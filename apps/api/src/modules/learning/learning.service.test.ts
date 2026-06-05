import { beforeEach, describe, expect, it, vi } from 'vitest';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { ExerciseType } from '@studyzone/shared-types';

import { LearningService } from './learning.service';
import { PrismaService } from '../../infra/prisma.service';
import { RewardsService } from '../rewards/rewards.service';

describe('LearningService', () => {
  let prisma: MockPrisma;
  let events: Pick<EventEmitter2, 'emit'>;
  let rewards: Pick<RewardsService, 'awardXpAndGemsWithClient' | 'syncHearts'>;
  let service: LearningService;

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-05-26T10:00:00Z'));
    prisma = createPrismaMock();
    events = { emit: vi.fn() };
    rewards = {
      awardXpAndGemsWithClient: vi.fn().mockResolvedValue(undefined),
      syncHearts: vi.fn().mockResolvedValue({ hearts: 5, maxHearts: 5 }),
    };
    service = new LearningService(
      prisma as unknown as PrismaService,
      events as EventEmitter2,
      rewards as RewardsService,
    );
  });

  it('starts a lesson by persisting an exercise queue without answers', async () => {
    prisma.lesson.findUnique.mockResolvedValue({
      id: 'lesson-1',
      unit: { courseId: 'course-1' },
      exerciseCount: 2,
      exercises: [
        { exercise: choiceExercise('exercise-1', 0), orderIndex: 0 },
        { exercise: choiceExercise('exercise-2', 1), orderIndex: 1 },
      ],
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
      courseId: 'course-1',
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
    prisma.$transaction.mockImplementation(async (arg) =>
      typeof arg === 'function' ? arg(prisma) : arg,
    );

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
      lessonFailed: false,
    });
  });

  it('fails and locks the lesson when the last heart is spent on a wrong answer', async () => {
    prisma.learningSession.findUnique.mockResolvedValue({
      id: 'session-1',
      userId: 'user-1',
      lessonId: 'lesson-1',
      finishedAt: null,
      startedAt: new Date('2026-05-26T09:59:00Z'),
      correctCount: 0,
      exerciseQueue: ['exercise-1'],
      user: { wallet: { hearts: 1 } },
    });
    prisma.exercise.findUnique.mockResolvedValue(choiceExercise('exercise-1', 1));
    prisma.userWallet.update.mockResolvedValue({ hearts: 0 });
    prisma.exerciseAttempt.create.mockReturnValue({ op: 'attempt-create' });
    prisma.learningSession.update.mockReturnValue({ op: 'session-update' });
    prisma.srsCard.findUnique.mockResolvedValue(null);
    prisma.srsCard.upsert.mockResolvedValue({});
    prisma.$transaction.mockImplementation(async (arg) =>
      typeof arg === 'function' ? arg(prisma) : arg,
    );

    const result = await service.submitAttempt('user-1', 'session-1', {
      exerciseId: 'exercise-1',
      payload: { correctIndex: 0 },
      responseMs: 12_000,
    });

    expect(result).toMatchObject({ correct: false, heartsRemaining: 0, lessonFailed: true });
    expect(prisma.learningSession.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ finishedAt: expect.any(Date), outcome: 'fail' }),
      }),
    );
    expect(events.emit).toHaveBeenCalledWith(
      'learning.lesson.failed',
      expect.objectContaining({
        payload: expect.objectContaining({
          userId: 'user-1',
          lessonId: 'lesson-1',
          reason: 'out_of_hearts',
        }),
      }),
    );
  });

  it('rejects starting a lesson when the user is out of hearts', async () => {
    (rewards.syncHearts as ReturnType<typeof vi.fn>).mockResolvedValue({ hearts: 0, maxHearts: 5 });

    await expect(service.startLesson('user-1', 'lesson-1')).rejects.toMatchObject({
      response: expect.objectContaining({ code: 'out_of_hearts' }),
    });
    expect(prisma.lesson.findUnique).not.toHaveBeenCalled();
  });

  it('completes a passing session with rewards, lesson progress, and domain event', async () => {
    prisma.learningSession.findUnique.mockResolvedValue({
      id: 'session-1',
      userId: 'user-1',
      lessonId: 'lesson-1',
      lesson: { id: 'lesson-1' },
      startedAt: new Date('2026-05-26T09:59:00Z'),
      finishedAt: null,
      correctCount: 5,
      totalCount: 5,
      exerciseQueue: ['exercise-1', 'exercise-2', 'exercise-3', 'exercise-4', 'exercise-5'],
      attempts: [
        attempt('exercise-1', true),
        attempt('exercise-2', true),
        attempt('exercise-3', true),
        attempt('exercise-4', true),
        attempt('exercise-5', true),
      ],
      user: {
        wallet: { xpTotal: 90, streakFreezes: 1 },
        streak: { currentStreak: 6, lastActiveLocalDate: '2026-05-25', longestStreak: 6 },
      },
    });
    prisma.userLessonProgress.findUnique.mockResolvedValue(null);
    prisma.userLessonProgress.create.mockResolvedValue({
      lessonId: 'lesson-1',
      completed: true,
      bestScore: 100,
    });
    prisma.lesson.findUnique.mockResolvedValue({ id: 'lesson-1', unit: { courseId: 'course-1' } });
    prisma.learningSession.update.mockReturnValue({ op: 'session-update' });
    prisma.userWallet.update.mockReturnValue({ op: 'wallet-update' });
    prisma.streakRecord.upsert.mockReturnValue({ op: 'streak-upsert' });
    prisma.xPLedger.create.mockReturnValue({ op: 'xp-ledger-create' });
    prisma.enrollment.updateMany.mockReturnValue({ op: 'enrollment-update' });
    prisma.$transaction.mockImplementation(async (arg) =>
      typeof arg === 'function' ? arg(prisma) : arg,
    );

    const result = await service.completeSession('user-1', 'session-1', {});

    expect(result).toMatchObject({
      outcome: 'pass',
      readyToComplete: true,
      xpGained: 20,
      perfectBonus: 5,
      gemsGained: 3,
      newStreak: 7,
      streakAdvanced: true,
      levelUp: { from: 0, to: 1 },
      lessonProgress: { lessonId: 'lesson-1', completed: true, bestScore: 100 },
    });
    expect(events.emit).toHaveBeenCalledWith(
      'learning.lesson.completed',
      expect.objectContaining({
        payload: expect.objectContaining({
          userId: 'user-1',
          sessionId: 'session-1',
          lessonId: 'lesson-1',
          outcome: 'pass',
          xpGained: 20,
        }),
      }),
    );
  });

  it('blocks completion until every wrong exercise is redone correctly', async () => {
    prisma.learningSession.findUnique.mockResolvedValue({
      id: 'session-1',
      userId: 'user-1',
      lessonId: 'lesson-1',
      lesson: { id: 'lesson-1' },
      startedAt: new Date('2026-05-26T09:59:00Z'),
      finishedAt: null,
      correctCount: 1,
      totalCount: 2,
      exerciseQueue: ['exercise-1', 'exercise-2'],
      attempts: [attempt('exercise-1', true), attempt('exercise-2', false)],
      user: {
        wallet: { xpTotal: 90, streakFreezes: 1 },
        streak: { currentStreak: 6, lastActiveLocalDate: '2026-05-25', longestStreak: 6 },
      },
    });

    await expect(service.completeSession('user-1', 'session-1', {})).rejects.toMatchObject({
      response: expect.objectContaining({
        code: 'redo_required',
        pendingExerciseIds: ['exercise-2'],
      }),
    });

    expect(prisma.learningSession.update).not.toHaveBeenCalled();
    expect(events.emit).not.toHaveBeenCalled();
  });

  it('allows completion after a redo but scores by first-pass correctness', async () => {
    prisma.learningSession.findUnique.mockResolvedValue({
      id: 'session-1',
      userId: 'user-1',
      lessonId: 'lesson-1',
      lesson: { id: 'lesson-1' },
      startedAt: new Date('2026-05-26T09:59:00Z'),
      finishedAt: null,
      correctCount: 2,
      totalCount: 2,
      exerciseQueue: ['exercise-1', 'exercise-2'],
      attempts: [
        attempt('exercise-1', true),
        attempt('exercise-2', false),
        attempt('exercise-2', true),
      ],
      user: {
        wallet: { xpTotal: 90, streakFreezes: 1 },
        streak: { currentStreak: 6, lastActiveLocalDate: '2026-05-25', longestStreak: 6 },
      },
    });
    prisma.userLessonProgress.findUnique.mockResolvedValue(null);
    prisma.userLessonProgress.create.mockResolvedValue({
      lessonId: 'lesson-1',
      completed: true,
      bestScore: 50,
    });
    prisma.lesson.findUnique.mockResolvedValue({ id: 'lesson-1', unit: { courseId: 'course-1' } });
    prisma.learningSession.update.mockReturnValue({ op: 'session-update' });
    prisma.userWallet.update.mockReturnValue({ op: 'wallet-update' });
    prisma.streakRecord.upsert.mockReturnValue({ op: 'streak-upsert' });
    prisma.xPLedger.create.mockReturnValue({ op: 'xp-ledger-create' });
    prisma.enrollment.updateMany.mockReturnValue({ op: 'enrollment-update' });
    prisma.$transaction.mockImplementation(async (arg) =>
      typeof arg === 'function' ? arg(prisma) : arg,
    );

    const result = await service.completeSession('user-1', 'session-1', {});

    expect(result).toMatchObject({
      outcome: 'pass',
      readyToComplete: true,
      perfectBonus: 0,
      lessonProgress: { completed: true, bestScore: 50 },
    });
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

function attempt(exerciseId: string, isCorrect: boolean) {
  return { exerciseId, isCorrect };
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
      findUnique: vi.fn().mockResolvedValue({ hearts: 5 }),
      update: vi.fn(),
    },
    exerciseAttempt: {
      create: vi.fn(),
    },
    srsCard: {
      findUnique: vi.fn(),
      upsert: vi.fn(),
    },
    userLessonProgress: {
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    streakRecord: {
      upsert: vi.fn(),
    },
    xPLedger: {
      create: vi.fn(),
    },
    enrollment: {
      updateMany: vi.fn(),
    },
    $transaction: vi.fn(),
  };
}

type MockPrisma = ReturnType<typeof createPrismaMock>;
