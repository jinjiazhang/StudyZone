import { describe, expect, it, vi } from 'vitest';
import { ExerciseType } from '@studyzone/shared-types';

import { CurriculumService } from './curriculum.service';
import { PrismaService } from '../../infra/prisma.service';

describe('CurriculumService admin content', () => {
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
          skills: [
            {
              id: 'skill-1',
              orderIndex: 0,
              name: 'Greetings',
              icon: '👋',
              maxLevel: 5,
              lessons: [
                {
                  id: 'lesson-1',
                  level: 1,
                  orderIndex: 0,
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
        },
      ],
    });

    const service = new CurriculumService(prisma as unknown as PrismaService);

    await expect(service.getAdminCourseContent('course-1')).resolves.toMatchObject({
      id: 'course-1',
      units: [
        {
          skills: [
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

    const service = new CurriculumService(prisma as unknown as PrismaService);
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
    expect(prisma.exercise.update).toHaveBeenCalledWith({
      where: { id: 'exercise-1' },
      data: expect.objectContaining({
        prompt: { type: ExerciseType.NUMERIC_INPUT, statement: '6 × 7 = ?' },
        answer: { value: 42 },
        difficulty: 2,
      }),
    });
  });
});

function createPrismaMock() {
  return {
    course: {
      findUnique: vi.fn(),
    },
    exercise: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    lessonExercise: {
      findFirst: vi.fn(),
    },
  };
}
