import { beforeEach, describe, expect, it, vi } from 'vitest';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { ExerciseType } from '@studyzone/shared-types';

import { LearningService } from './learning.service';
import { PrismaService } from '../../infra/prisma.service';

describe('LearningService', () => {
  let prisma: MockPrisma;
  let events: Pick<EventEmitter2, 'emit'>;
  let service: LearningService;

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-05-26T10:00:00Z'));
    prisma = createPrismaMock();
    events = { emit: vi.fn() };
    service = new LearningService(prisma as unknown as PrismaService, events as EventEmitter2);
  });

  it('starts a lesson by persisting an exercise queue without answers', async () => {
    prisma.lesson.findUnique.mockResolvedValue({
      id: 'lesson-1',
      skillId: 'skill-1',
      exerciseCount: 2,
      exercises: [
        { exercise: choiceExercise('exercise-1', 0), orderIndex: 0 },
        { exercise: choiceExercise('exercise-2', 1), orderIndex: 1 },
      ],
      skill: { id: 'skill-1' },
    });
    prisma.learningSession.create.mockResolvedValue({
      id: 'session-1',
      startedAt: new Date('2026-05-26T10:00:00Z'),
    });

    const result = await service.startLesson('user-1', 'lesson-1');

    expect(prisma.learningSession.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        userId: 'user-1',
        lessonId: 'lesson-1',
        totalCount: 2,
      }),
    });
    expect(result).toMatchObject({
      sessionId: 'session-1',
      lessonId: 'lesson-1',
      skillId: 'skill-1',
      exercises: expect.arrayContaining([
        expect.objectContaining({ id: 'exercise-1', difficulty: 1 }),
        expect.objectContaining({ id: 'exercise-2', difficulty: 1 }),
      ]),
    });
    expect(result.exercises[0]).not.toHaveProperty('answer');
  });

  it('submits an incorrect attempt, spends a heart, and schedules SRS review', async () => {
    prisma.learningSession.findUnique.mockResolvedValue({
      id: 'session-1',
      userId: 'user-1',
      finishedAt: null,
      exerciseQueue: ['exercise-1'],
      user: { wallet: { hearts: 3 } },
    });
    prisma.exercise.findUnique.mockResolvedValue(choiceExercise('exercise-1', 1));
    prisma.userWallet.update.mockResolvedValue({ hearts: 2 });
    prisma.exerciseAttempt.create.mockReturnValue({ op: 'attempt-create' });
    prisma.learningSession.update.mockReturnValue({ op: 'session-update' });
    prisma.srsCard.findUnique.mockResolvedValue(null);
    prisma.srsCard.upsert.mockResolvedValue({});
    prisma.$transaction.mockImplementation(async (ops) => ops);

    const result = await service.submitAttempt('user-1', 'session-1', {
      exerciseId: 'exercise-1',
      payload: { correctIndex: 0 },
      responseMs: 12_000,
    });

    expect(result).toEqual({
      correct: false,
      canonicalAnswer: 'B',
      heartLost: true,
      heartsRemaining: 2,
    });
    expect(prisma.userWallet.update).toHaveBeenCalledWith({
      where: { userId: 'user-1' },
      data: { hearts: 2 },
    });
    expect(prisma.exerciseAttempt.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        sessionId: 'session-1',
        exerciseId: 'exercise-1',
        isCorrect: false,
      }),
    });
    expect(prisma.srsCard.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        create: expect.objectContaining({
          userId: 'user-1',
          exerciseId: 'exercise-1',
          intervalDays: 1,
          streakOk: 0,
        }),
      }),
    );
  });

  it('completes a passing session with rewards, skill progress, and domain event', async () => {
    prisma.learningSession.findUnique.mockResolvedValue({
      id: 'session-1',
      userId: 'user-1',
      lessonId: 'lesson-1',
      lesson: { skillId: 'skill-1', skill: { id: 'skill-1' } },
      startedAt: new Date('2026-05-26T09:59:00Z'),
      finishedAt: null,
      correctCount: 5,
      totalCount: 5,
      user: {
        wallet: { xpTotal: 90, streakFreezes: 1 },
        streak: { currentStreak: 6, lastActiveLocalDate: '2026-05-25', longestStreak: 6 },
      },
    });
    prisma.userSkillProgress.findUnique.mockResolvedValue(null);
    prisma.skill.findUnique.mockResolvedValue({ id: 'skill-1', maxLevel: 5 });
    prisma.userSkillProgress.create.mockResolvedValue({
      skillId: 'skill-1',
      level: 1,
      strength: 20,
    });
    prisma.learningSession.update.mockReturnValue({ op: 'session-update' });
    prisma.userWallet.update.mockReturnValue({ op: 'wallet-update' });
    prisma.streakRecord.upsert.mockReturnValue({ op: 'streak-upsert' });
    prisma.xPLedger.create.mockReturnValue({ op: 'xp-ledger-create' });
    prisma.$transaction.mockImplementation(async (ops) => ops);

    const result = await service.completeSession('user-1', 'session-1', {});

    expect(result).toMatchObject({
      outcome: 'pass',
      xpGained: 20,
      perfectBonus: 5,
      gemsGained: 3,
      newStreak: 7,
      streakAdvanced: true,
      levelUp: { from: 0, to: 1 },
      skillProgress: { skillId: 'skill-1', level: 1, strength: 20 },
    });
    expect(prisma.userWallet.update).toHaveBeenCalledWith({
      where: { userId: 'user-1' },
      data: {
        xpTotal: { increment: 20 },
        gems: { increment: 3 },
        streakFreezes: 1,
      },
    });
    expect(events.emit).toHaveBeenCalledWith(
      'learning.lesson.completed',
      expect.objectContaining({
        payload: expect.objectContaining({
          userId: 'user-1',
          sessionId: 'session-1',
          lessonId: 'lesson-1',
          skillId: 'skill-1',
          outcome: 'pass',
          xpGained: 20,
        }),
      }),
    );
  });
});

function choiceExercise(id: string, correctIndex: number) {
  return {
    id,
    type: ExerciseType.SINGLE_CHOICE,
    prompt: {
      type: ExerciseType.SINGLE_CHOICE,
      question: 'Pick one',
      options: ['A', 'B'],
    },
    answer: { correctIndex },
    difficulty: 1,
  };
}

function createPrismaMock() {
  return {
    lesson: {
      findUnique: vi.fn(),
    },
    learningSession: {
      create: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    exercise: {
      findUnique: vi.fn(),
    },
    userWallet: {
      update: vi.fn(),
    },
    exerciseAttempt: {
      create: vi.fn(),
    },
    srsCard: {
      findUnique: vi.fn(),
      upsert: vi.fn(),
    },
    userSkillProgress: {
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    skill: {
      findUnique: vi.fn(),
    },
    streakRecord: {
      upsert: vi.fn(),
    },
    xPLedger: {
      create: vi.fn(),
    },
    $transaction: vi.fn(),
  };
}

type MockPrisma = ReturnType<typeof createPrismaMock>;
