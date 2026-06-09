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
import { RewardsService } from '../rewards/rewards.service';
import { SubmitAttemptDto, CompleteSessionDto } from './learning.dto';

@Injectable()
export class LearningService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly events: EventEmitter2,
    private readonly rewards: RewardsService,
  ) {}

  async startLesson(userId: string, lessonId: string) {
    // Hearts gate: apply any pending regeneration first, then block if still 0.
    const wallet = await this.rewards.syncHearts(userId);
    if (wallet && wallet.hearts <= 0) {
      throw new BadRequestException({
        code: 'out_of_hearts',
        message: '心数已耗尽，先等待恢复或补充后再来挑战',
      });
    }

    const lesson = await this.prisma.lesson.findUnique({
      where: { id: lessonId },
      include: {
        unit: true,
        exercises: { include: { exercise: true }, orderBy: { orderIndex: 'asc' } },
      },
    });
    if (!lesson) throw new NotFoundException({ code: 'lesson_not_found', message: '关卡不存在' });

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

    // Remember which unit the user is studying so the course can reopen here.
    await this.prisma.enrollment.updateMany({
      where: { userId, courseId: lesson.unit.courseId },
      data: { currentUnitId: lesson.unit.id, lastActiveAt: new Date() },
    });

    return {
      sessionId: session.id,
      lessonId: lesson.id,
      courseId: lesson.unit.courseId,
      startedAt: session.startedAt.toISOString(),
      exercises: queue.map((e) => ({
        id: e.id,
        type: e.type,
        prompt: e.prompt as unknown as ExercisePrompt,
        difficulty: e.difficulty,
      })),
    };
  }

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
    let lessonFailed = false;

    if (!result.correct && session.user.wallet) {
      heartLost = true;
      const wallet = session.user.wallet;
      // Start the regeneration clock the moment we drop below full.
      const wasFull = wallet.hearts >= wallet.maxHearts;
      heartsRemaining = Math.max(0, wallet.hearts - 1);
      // Hearts exhausted → lock & fail the lesson on this attempt.
      lessonFailed = heartsRemaining === 0;
      await this.prisma.userWallet.update({
        where: { userId },
        data: {
          hearts: heartsRemaining,
          ...(wasFull ? { heartsUpdatedAt: new Date() } : {}),
        },
      });
    }

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
          ...(lessonFailed ? { finishedAt: new Date(), outcome: 'fail', xpGained: 0 } : {}),
        },
      }),
    ]);

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

    if (lessonFailed) {
      this.events.emit('learning.lesson.failed', {
        type: 'learning.lesson.failed',
        occurredAt: new Date().toISOString(),
        source: 'learning',
        payload: {
          userId,
          sessionId,
          lessonId: session.lessonId,
          reason: 'out_of_hearts',
          correctCount: session.correctCount + (result.correct ? 1 : 0),
          timeSpentMs: Date.now() - session.startedAt.getTime(),
        },
      });
    }

    return {
      correct: result.correct,
      canonicalAnswer: result.canonicalAnswer,
      heartLost,
      heartsRemaining,
      lessonFailed,
    };
  }

  async completeSession(userId: string, sessionId: string, _dto: CompleteSessionDto) {
    const session = await this.prisma.learningSession.findUnique({
      where: { id: sessionId },
      include: {
        lesson: true,
        attempts: { orderBy: { createdAt: 'asc' } },
        user: { include: { wallet: true, streak: true } },
      },
    });
    if (!session) throw new NotFoundException({ code: 'session_not_found' });
    if (session.userId !== userId) throw new BadRequestException({ code: 'forbidden' });
    if (session.finishedAt) throw new ConflictException({ code: 'session_finished' });

    const timeSpentMs = Date.now() - session.startedAt.getTime();
    const completion = summarizeCompletion(
      session.exerciseQueue as string[],
      session.attempts.map((attempt) => ({
        exerciseId: attempt.exerciseId,
        isCorrect: attempt.isCorrect,
      })),
    );
    if (!completion.readyToComplete) {
      throw new BadRequestException({
        code: 'redo_required',
        message: '请先把本关错题重做正确',
        pendingExerciseIds: completion.pendingExerciseIds,
      });
    }

    const score = calculateLessonScore({
      totalExercises: session.totalCount,
      correctCount: completion.firstPassCorrectCount,
      timeSpentMs,
      currentStreak: session.user.streak?.currentStreak ?? 0,
    });

    const outcome = 'pass';
    const todayLocalDate = new Date().toISOString().slice(0, 10);
    const streak = updateStreak({
      todayLocalDate,
      lastActiveLocalDate: session.user.streak?.lastActiveLocalDate ?? null,
      currentStreak: session.user.streak?.currentStreak ?? 0,
      streakFreezes: session.user.wallet?.streakFreezes ?? 0,
    });

    const oldXp = session.user.wallet?.xpTotal ?? 0;
    const oldLevel = xpToLevel(oldXp).level;
    const newXp = oldXp + score.totalXp;
    const newLevel = xpToLevel(newXp).level;
    const lessonProgress = await this.updateLessonProgress(
      userId,
      session.lesson.id,
      true,
      session.totalCount > 0
        ? Math.round((completion.firstPassCorrectCount / session.totalCount) * 100)
        : 0,
    );

    const courseIds = await this.courseIdsForLesson(session.lesson.id);

    await this.prisma.$transaction(async (tx) => {
      await tx.learningSession.update({
        where: { id: sessionId },
        data: {
          finishedAt: new Date(),
          xpGained: score.totalXp,
          outcome,
        },
      });
      // Centralized wallet + ledger write (xp/gems) so all reward paths agree.
      await this.rewards.awardXpAndGemsWithClient(tx, {
        userId,
        xp: score.totalXp,
        gems: score.gems,
        reason: 'lesson_completed',
        refId: sessionId,
      });
      await tx.userWallet.update({
        where: { userId },
        data: { streakFreezes: streak.newStreakFreezes },
      });
      await tx.streakRecord.upsert({
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
      });
      await tx.enrollment.updateMany({
        where: { userId, courseId: { in: courseIds } },
        data: {
          currentLessonId: session.lesson.id,
          currentUnitId: session.lesson.unitId,
          lastActiveAt: new Date(),
        },
      });
    });

    this.events.emit('learning.lesson.completed', {
      type: 'learning.lesson.completed',
      occurredAt: new Date().toISOString(),
      source: 'learning',
      payload: {
        userId,
        sessionId,
        lessonId: session.lessonId,
        outcome,
        correctCount: completion.firstPassCorrectCount,
        totalCount: session.totalCount,
        xpGained: score.totalXp,
        timeSpentMs,
      },
    });

    return {
      outcome,
      readyToComplete: true,
      xpGained: score.totalXp,
      perfectBonus: score.perfectBonus,
      gemsGained: score.gems,
      newStreak: streak.newStreak,
      streakAdvanced: streak.advanced,
      levelUp: newLevel > oldLevel ? { from: oldLevel, to: newLevel } : null,
      lessonProgress,
    };
  }

  private async updateLessonProgress(userId: string, lessonId: string, passed: boolean, score: number) {
    const existing = await this.prisma.userLessonProgress.findUnique({
      where: { userId_lessonId: { userId, lessonId } },
    });

    if (!existing) {
      const created = await this.prisma.userLessonProgress.create({
        data: {
          userId,
          lessonId,
          completed: passed,
          bestScore: score,
        },
      });
      return { lessonId, completed: created.completed, bestScore: created.bestScore };
    }

    const updated = await this.prisma.userLessonProgress.update({
      where: { userId_lessonId: { userId, lessonId } },
      data: {
        completed: existing.completed || passed,
        bestScore: Math.max(existing.bestScore, score),
      },
    });
    return { lessonId, completed: updated.completed, bestScore: updated.bestScore };
  }

  private async courseIdsForLesson(lessonId: string) {
    const lesson = await this.prisma.lesson.findUnique({
      where: { id: lessonId },
      include: { unit: true },
    });
    return lesson ? [lesson.unit.courseId] : [];
  }
}

function pickAndShuffle<T>(arr: T[], n: number): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]!] = [a[j]!, a[i]!];
  }
  return a.slice(0, n);
}

function summarizeCompletion(
  queue: string[],
  attempts: Array<{ exerciseId: string; isCorrect: boolean }>,
) {
  const requiredExerciseIds = Array.from(new Set(queue));
  const firstByExercise = new Map<string, boolean>();
  const latestByExercise = new Map<string, boolean>();

  for (const attempt of attempts) {
    if (!requiredExerciseIds.includes(attempt.exerciseId)) continue;
    if (!firstByExercise.has(attempt.exerciseId)) {
      firstByExercise.set(attempt.exerciseId, attempt.isCorrect);
    }
    latestByExercise.set(attempt.exerciseId, attempt.isCorrect);
  }

  const pendingExerciseIds = requiredExerciseIds.filter(
    (exerciseId) => latestByExercise.get(exerciseId) !== true,
  );

  return {
    readyToComplete: pendingExerciseIds.length === 0,
    pendingExerciseIds,
    firstPassCorrectCount: requiredExerciseIds.filter(
      (exerciseId) => firstByExercise.get(exerciseId) === true,
    ).length,
  };
}
