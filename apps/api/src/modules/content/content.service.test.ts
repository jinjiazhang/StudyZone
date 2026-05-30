import { describe, expect, it, vi } from 'vitest';
import { ExerciseType } from '@studyzone/shared-types';

import { ContentService } from './content.service';
import { PrismaService } from '../../infra/prisma.service';

describe('ContentService admin content', () => {
  it('locks later units until all lessons in the previous unit are completed', async () => {
    const prisma = createPrismaMock();
    prisma.course.findUnique.mockResolvedValue({
      id: 'course-1',
      units: [
        {
          id: 'unit-1',
          orderIndex: 0,
          title: 'Basics',
          themeColor: '#1CB0F6',
          lessons: [
            { id: 'lesson-1', orderIndex: 0, title: 'One', icon: '1', exerciseCount: 1 },
            { id: 'lesson-2', orderIndex: 1, title: 'Two', icon: '2', exerciseCount: 1 },
          ],
        },
        {
          id: 'unit-2',
          orderIndex: 1,
          title: 'Next',
          themeColor: '#58CC02',
          lessons: [
            { id: 'lesson-3', orderIndex: 0, title: 'Three', icon: '3', exerciseCount: 1 },
          ],
        },
      ],
    });
    prisma.userLessonProgress.findMany.mockResolvedValue([
      { lessonId: 'lesson-1', completed: true },
    ]);

    const service = new ContentService(prisma as unknown as PrismaService);
    const tree = await service.getCourseTree('user-1', 'course-1');

    expect(tree[0].lessons.map((lesson) => lesson.unlocked)).toEqual([true, true]);
    expect(tree[1].lessons.map((lesson) => lesson.unlocked)).toEqual([false]);
  });

  it('unlocks the next unit after every lesson in the previous unit is completed', async () => {
    const prisma = createPrismaMock();
    prisma.course.findUnique.mockResolvedValue({
      id: 'course-1',
      units: [
        {
          id: 'unit-1',
          orderIndex: 0,
          title: 'Basics',
          themeColor: '#1CB0F6',
          lessons: [
            { id: 'lesson-1', orderIndex: 0, title: 'One', icon: '1', exerciseCount: 1 },
            { id: 'lesson-2', orderIndex: 1, title: 'Two', icon: '2', exerciseCount: 1 },
          ],
        },
        {
          id: 'unit-2',
          orderIndex: 1,
          title: 'Next',
          themeColor: '#58CC02',
          lessons: [
            { id: 'lesson-3', orderIndex: 0, title: 'Three', icon: '3', exerciseCount: 1 },
          ],
        },
      ],
    });
    prisma.userLessonProgress.findMany.mockResolvedValue([
      { lessonId: 'lesson-1', completed: true },
      { lessonId: 'lesson-2', completed: true },
    ]);

    const service = new ContentService(prisma as unknown as PrismaService);
    const tree = await service.getCourseTree('user-1', 'course-1');

    expect(tree[1].lessons[0].unlocked).toBe(true);
  });

  it('returns nested course content including exercise answers for CMS editing', async () => {
    const prisma = createPrismaMock();
    prisma.course.findUnique.mockResolvedValue({
      id: 'course-1',
      name: 'English',
      description: 'Starter course',
      units: [
        {
          id: 'unit-1',
          orderIndex: 0,
          title: 'Basics',
          themeColor: '#3FB984',
          lessons: [
            {
              id: 'lesson-1',
              orderIndex: 0,
              title: 'Greetings',
              icon: '👋',
              exerciseCount: 1,
              exercises: [
                {
                  orderIndex: 0,
                  exercise: {
                    id: 'exercise-1',
                    type: ExerciseType.SINGLE_CHOICE,
                    prompt: {
                      type: ExerciseType.SINGLE_CHOICE,
                      question: 'Hello means?',
                      options: ['你好', '再见'],
                    },
                    answer: { correctIndex: 0 },
                    difficulty: 1,
                  },
                },
              ],
            },
          ],
        },
      ],
    });

    const service = new ContentService(prisma as unknown as PrismaService);

    await expect(service.getAdminCourseContent('course-1')).resolves.toMatchObject({
      id: 'course-1',
      units: [
        {
          lessons: [
            {
              exercises: [
                {
                  id: 'exercise-1',
                  answer: { correctIndex: 0 },
                  orderIndex: 0,
                },
              ],
            },
          ],
        },
      ],
    });
  });

  it('updates editable exercise JSON fields', async () => {
    const prisma = createPrismaMock();
    prisma.exercise.findUnique.mockResolvedValue({ id: 'exercise-1' });
    prisma.exercise.update.mockResolvedValue({
      id: 'exercise-1',
      type: ExerciseType.NUMERIC_INPUT,
      prompt: { type: ExerciseType.NUMERIC_INPUT, statement: '6 × 7 = ?' },
      answer: { value: 42 },
      difficulty: 2,
    });
    prisma.lessonExercise.findFirst.mockResolvedValue({ orderIndex: 3 });

    const service = new ContentService(prisma as unknown as PrismaService);
    const result = await service.updateExercise('exercise-1', {
      prompt: { type: ExerciseType.NUMERIC_INPUT, statement: '6 × 7 = ?' },
      answer: { value: 42 },
      difficulty: 2,
    });

    expect(result).toMatchObject({
      id: 'exercise-1',
      type: ExerciseType.NUMERIC_INPUT,
      answer: { value: 42 },
      difficulty: 2,
      orderIndex: 3,
    });
  });

  it('lists user enrollments sorted by recency with subjectId attached', async () => {
    const prisma = createPrismaMock();
    prisma.enrollment.findMany.mockResolvedValue([
      {
        courseId: 'course-2',
        enrolledAt: new Date('2024-01-02T00:00:00Z'),
        lastActiveAt: new Date('2024-01-10T00:00:00Z'),
        course: { subjectId: 'subject-math' },
      },
      {
        courseId: 'course-1',
        enrolledAt: new Date('2024-01-01T00:00:00Z'),
        lastActiveAt: new Date('2024-01-05T00:00:00Z'),
        course: { subjectId: 'subject-english' },
      },
    ]);

    const service = new ContentService(prisma as unknown as PrismaService);
    const enrollments = await service.listMyEnrollments('user-1');

    expect(prisma.enrollment.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { userId: 'user-1' },
        orderBy: { lastActiveAt: 'desc' },
      }),
    );
    expect(enrollments).toEqual([
      {
        courseId: 'course-2',
        subjectId: 'subject-math',
        enrolledAt: '2024-01-02T00:00:00.000Z',
        lastActiveAt: '2024-01-10T00:00:00.000Z',
      },
      {
        courseId: 'course-1',
        subjectId: 'subject-english',
        enrolledAt: '2024-01-01T00:00:00.000Z',
        lastActiveAt: '2024-01-05T00:00:00.000Z',
      },
    ]);
  });

  it('bumps lastActiveAt when fetching the course tree for an enrolled user', async () => {
    const prisma = createPrismaMock();
    prisma.course.findUnique.mockResolvedValue({
      id: 'course-1',
      units: [],
    });
    prisma.userLessonProgress.findMany.mockResolvedValue([]);
    prisma.enrollment.update.mockResolvedValue({});

    const service = new ContentService(prisma as unknown as PrismaService);
    await service.getCourseTree('user-1', 'course-1');

    expect(prisma.enrollment.update).toHaveBeenCalledWith({
      where: { userId_courseId: { userId: 'user-1', courseId: 'course-1' } },
      data: { lastActiveAt: expect.any(Date) },
    });
  });

  it('does not fail when fetching course tree for a not-yet-enrolled user', async () => {
    const prisma = createPrismaMock();
    prisma.course.findUnique.mockResolvedValue({
      id: 'course-1',
      units: [],
    });
    prisma.userLessonProgress.findMany.mockResolvedValue([]);
    prisma.enrollment.update.mockRejectedValue(new Error('record not found'));

    const service = new ContentService(prisma as unknown as PrismaService);
    await expect(service.getCourseTree('user-1', 'course-1')).resolves.toEqual([]);
  });
});

function createPrismaMock() {
  return {
    course: {
      findUnique: vi.fn(),
    },
    userLessonProgress: {
      findMany: vi.fn(),
    },
    exercise: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    lessonExercise: {
      findFirst: vi.fn(),
    },
    enrollment: {
      findMany: vi.fn(),
      update: vi.fn(),
    },
  };
}
