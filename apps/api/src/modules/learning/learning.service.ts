import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';

import {
  judge,
  calculateLessonScore,
  updateStreak,
  reviewCard,
  INITIAL_SRS,
  xpToLevel,
} from '@studyzone/shared-logic';
import type {
  ExerciseAnswer,
  ExercisePrompt,
  UserAttemptPayload,
} from '@studyzone/shared-types';

import { PrismaService } from '../../infra/prisma.service';
import { SubmitAttemptDto, CompleteSessionDto } from './learning.dto';

@Injectable()
export class LearningService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly events: EventEmitter2,
  ) {}

  /**
   * Start a learning session for a lesson.
   * Picks an exercise queue (SRS due cards mixed with lesson exercises) and
   * persists it on the session so attempts are validated against the queue.
   */
  async startLesson(userId: string, lessonId: string) {
    const lesson = await this.prisma.lesson.findUnique({
      where: { id: lessonId },
      include: {
        exercises: { include: { exercise: true }, orderBy: { orderIndex: 'asc' } },
        skill: true,
      },
    });
    if (!lesson) throw new NotFoundException({ code: 'lesson_not_found', message: '关卡不存在' });

    // Pick exercises: up to `exerciseCount`, with light shuffling.
    const target = lesson.exerciseCount;
    const pool = lesson.exercises.map((le) => le.exercise);
    const queue = pickAndShuffle(pool, target);

    const session = await this.prisma.learningSession.create({
      data: {
        userId,
        lessonId,
        totalCount: queue.length,
        exerciseQueue: queue.map((e) => e.id),
      },
    });

    return {
      sessionId: session.id,
      lessonId: lesson.id,
      skillId: lesson.skillId,
      startedAt: session.startedAt.toISOString(),
      exercises: queue.map((e) => ({
        id: e.id,
        type: e.type,
        prompt: e.prompt as unknown as ExercisePrompt,
        difficulty: e.difficulty,
      })),
    };
  }

  /**
   * Submit a single attempt. Judges server-side and returns the verdict.
   * Hearts decrement on incorrect.
   */
  async submitAttempt(userId: string, sessionId: string, dto: SubmitAttemptDto) {
    const session = await this.prisma.learningSession.findUnique({
      where: { id: sessionId },
      include: { user: { include: { wallet: true } } },
    });
    if (!session) throw new NotFoundException({ code: 'session_not_found', message: '会话不存在' });
    if (session.userId !== userId) throw new BadRequestException({ code: 'forbidden' });
    if (session.finishedAt) throw new ConflictException({ code: 'session_finished', message: '关卡已结束' });

    const queue = session.exerciseQueue as string[];
    if (!queue.includes(dto.exerciseId)) {
      throw new BadRequestException({ code: 'exercise_not_in_session' });
    }

    const exercise = await this.prisma.exercise.findUnique({ where: { id: dto.exerciseId } });
    if (!exercise) throw new NotFoundException({ code: 'exercise_not_found' });

    const result = judge(
      exercise.prompt as unknown as ExercisePrompt,
      exercise.answer as unknown as ExerciseAnswer,
      dto.payload as unknown as UserAttemptPayload,
    );

    let heartLost = false;
    let heartsRemaining = session.user.wallet?.hearts ?? 5;

    if (!result.correct && session.user.wallet) {
      heartLost = true;
      heartsRemaining = Math.max(0, session.user.wallet.hearts - 1);
      await this.prisma.userWallet.update({
        where: { userId },
        data: { hearts: heartsRemaining },
      });
    }

    // Persist attempt and update counters.
    await this.prisma.$transaction([
      this.prisma.exerciseAttempt.create({
        data: {
          sessionId,
          exerciseId: dto.exerciseId,
          userAnswer: dto.payload as any,
          isCorrect: result.correct,
          responseMs: dto.responseMs,
        },
      }),
      this.prisma.learningSession.update({
        where: { id: sessionId },
        data: {
          correctCount: { increment: result.correct ? 1 : 0 },
          heartsUsed: { increment: heartLost ? 1 : 0 },
        },
      }),
    ]);

    // Update SRS card.
    const quality = result.correct ? (dto.responseMs < 8000 ? 5 : 4) : 2;
    const existing = await this.prisma.srsCard.findUnique({
      where: { userId_exerciseId: { userId, exerciseId: dto.exerciseId } },
    });
    const prev = existing
      ? { intervalDays: existing.intervalDays, ease: existing.ease, streak: existing.streakOk }
      : INITIAL_SRS;
    const updated = reviewCard({ ...prev, quality });
    const dueAt = new Date(Date.now() + updated.intervalDays * 86_400_000);
    await this.prisma.srsCard.upsert({
      where: { userId_exerciseId: { userId, exerciseId: dto.exerciseId } },
      create: {
        userId,
        exerciseId: dto.exerciseId,
        intervalDays: updated.intervalDays,
        ease: updated.ease,
        streakOk: updated.streak,
        dueAt,
      },
      update: {
        intervalDays: updated.intervalDays,
        ease: updated.ease,
        streakOk: updated.streak,
        dueAt,
      },
    });

    return {
      correct: result.correct,
      canonicalAnswer: result.canonicalAnswer,
      heartLost,
      heartsRemaining,
    };
  }

  /**
   * Complete a session. Computes XP/gems, updates streak, level, skill progress.
   * Emits a learning.lesson.completed event for downstream listeners.
   */
  async completeSession(userId: string, sessionId: string, _dto: CompleteSessionDto) {
    const session = await this.prisma.learningSession.findUnique({
      where: { id: sessionId },
      include: {
        lesson: { include: { skill: true } },
        user: { include: { wallet: true, streak: true } },
      },
    });
    if (!session) throw new NotFoundException({ code: 'session_not_found' });
    if (session.userId !== userId) throw new BadRequestException({ code: 'forbidden' });
    if (session.finishedAt) throw new ConflictException({ code: 'session_finished' });

    const timeSpentMs = Date.now() - session.startedAt.getTime();

    const score = calculateLessonScore({
      totalExercises: session.totalCount,
      correctCount: session.correctCount,
      timeSpentMs,
      currentStreak: session.user.streak?.currentStreak ?? 0,
    });

    const outcome = score.totalXp > 0 ? 'pass' : 'fail';

    // Streak update (use UTC date as local for now; proper impl reads user.timezone).
    const todayLocalDate = new Date().toISOString().slice(0, 10);
    const streak = updateStreak({
      todayLocalDate,
      lastActiveLocalDate: session.user.streak?.lastActiveLocalDate ?? null,
      currentStreak: session.user.streak?.currentStreak ?? 0,
      streakFreezes: session.user.wallet?.streakFreezes ?? 0,
    });

    // Old level for level-up detection.
    const oldXp = session.user.wallet?.xpTotal ?? 0;
    const oldLevel = xpToLevel(oldXp).level;
    const newXp = oldXp + score.totalXp;
    const newLevel = xpToLevel(newXp).level;

    // Skill progress: if lesson passed, advance level/strength on its skill.
    const skillProgress = await this.advanceSkill(userId, session.lesson.skill.id, outcome === 'pass');

    // Persist everything in a transaction.
    await this.prisma.$transaction([
      this.prisma.learningSession.update({
        where: { id: sessionId },
        data: {
          finishedAt: new Date(),
          xpGained: score.totalXp,
          outcome,
        },
      }),
      this.prisma.userWallet.update({
        where: { userId },
        data: {
          xpTotal: { increment: score.totalXp },
          gems: { increment: score.gems },
          streakFreezes: streak.newStreakFreezes,
        },
      }),
      this.prisma.streakRecord.upsert({
        where: { userId },
        create: {
          userId,
          currentStreak: streak.newStreak,
          longestStreak: streak.newStreak,
          lastActiveLocalDate: streak.newLastActiveLocalDate,
        },
        update: {
          currentStreak: streak.newStreak,
          longestStreak: Math.max(streak.newStreak, session.user.streak?.longestStreak ?? 0),
          lastActiveLocalDate: streak.newLastActiveLocalDate,
        },
      }),
      this.prisma.xPLedger.create({
        data: {
          userId,
          delta: score.totalXp,
          reason: 'lesson_completed',
          refId: sessionId,
        },
      }),
    ]);

    // Emit domain event.
    this.events.emit('learning.lesson.completed', {
      type: 'learning.lesson.completed',
      occurredAt: new Date().toISOString(),
      source: 'learning',
      payload: {
        userId,
        sessionId,
        lessonId: session.lessonId,
        skillId: session.lesson.skillId,
        outcome,
        correctCount: session.correctCount,
        totalCount: session.totalCount,
        xpGained: score.totalXp,
        timeSpentMs,
      },
    });

    return {
      outcome,
      xpGained: score.totalXp,
      perfectBonus: score.perfectBonus,
      gemsGained: score.gems,
      newStreak: streak.newStreak,
      streakAdvanced: streak.advanced,
      levelUp: newLevel > oldLevel ? { from: oldLevel, to: newLevel } : null,
      skillProgress,
    };
  }

  private async advanceSkill(userId: string, skillId: string, passed: boolean) {
    const existing = await this.prisma.userSkillProgress.findUnique({
      where: { userId_skillId: { userId, skillId } },
    });
    const skill = await this.prisma.skill.findUnique({ where: { id: skillId } });
    if (!skill) throw new NotFoundException({ code: 'skill_not_found' });

    if (!existing) {
      const created = await this.prisma.userSkillProgress.create({
        data: {
          userId,
          skillId,
          level: passed ? 1 : 0,
          strength: passed ? 20 : 5,
        },
      });
      return { skillId, level: created.level, strength: created.strength };
    }

    // 5 lessons per level-up cap by maxLevel.
    const nextStrength = Math.min(100, existing.strength + (passed ? 20 : 5));
    const nextLevel = nextStrength >= 100 && existing.level < skill.maxLevel
      ? existing.level + 1
      : existing.level;
    const resetStrength = nextLevel > existing.level ? 0 : nextStrength;

    const updated = await this.prisma.userSkillProgress.update({
      where: { userId_skillId: { userId, skillId } },
      data: { level: nextLevel, strength: resetStrength },
    });
    return { skillId, level: updated.level, strength: updated.strength };
  }
}

// Fisher–Yates shuffle, then take first `n`.
function pickAndShuffle<T>(arr: T[], n: number): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j]!, a[i]!];
  }
  return a.slice(0, n);
}
