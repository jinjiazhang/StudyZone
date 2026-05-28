import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import type { ExerciseAnswer, ExercisePrompt } from '@studyzone/shared-types';

import { PrismaService } from '../../infra/prisma.service';
import { UpdateExerciseDto } from './curriculum.dto';

@Injectable()
export class CurriculumService {
  constructor(private readonly prisma: PrismaService) {}

  listSubjects() {
    return this.prisma.subject.findMany({ orderBy: { order: 'asc' } });
  }

  async listCourses(subjectCode?: string) {
    return this.prisma.course.findMany({
      where: subjectCode ? { subject: { code: subjectCode } } : {},
      include: { subject: true },
      orderBy: { createdAt: 'asc' },
    });
  }

  async enroll(userId: string, courseId: string) {
    const course = await this.prisma.course.findUnique({ where: { id: courseId } });
    if (!course) throw new NotFoundException({ code: 'course_not_found', message: '课程不存在' });

    await this.prisma.enrollment.upsert({
      where: { userId_courseId: { userId, courseId } },
      create: { userId, courseId },
      update: { lastActiveAt: new Date() },
    });
  }

  async getCourseTree(userId: string, courseId: string) {
    const course = await this.prisma.course.findUnique({
      where: { id: courseId },
      include: {
        units: {
          orderBy: { orderIndex: 'asc' },
          include: {
            lessons: {
              orderBy: { orderIndex: 'asc' },
            },
          },
        },
      },
    });
    if (!course) throw new NotFoundException({ code: 'course_not_found', message: '课程不存在' });

    const progress = await this.prisma.userLessonProgress.findMany({
      where: { userId, lesson: { unit: { courseId } } },
    });
    const progressMap = new Map(progress.map((p) => [p.lessonId, p]));

    let previousUnitsCompleted = true;

    return course.units.map((unit) => {
      const unitUnlocked = previousUnitsCompleted;
      let previousLessonsCompleted = true;
      const lessons = unit.lessons.map((lesson, idx) => {
        const p = progressMap.get(lesson.id);
        const completed = p?.completed ?? false;
        const unlocked = unitUnlocked && (idx === 0 || previousLessonsCompleted);
        if (!completed) previousLessonsCompleted = false;

        return {
          lessonId: lesson.id,
          name: lesson.title,
          icon: lesson.icon,
          order: lesson.orderIndex,
          unlocked,
          completed,
          exerciseCount: lesson.exerciseCount,
        };
      });
      const unitCompleted =
        unit.lessons.length > 0 &&
        unit.lessons.every((lesson) => progressMap.get(lesson.id)?.completed ?? false);
      previousUnitsCompleted = previousUnitsCompleted && unitCompleted;

      return {
        unitId: unit.id,
        unitTitle: unit.title,
        unitOrder: unit.orderIndex,
        themeColor: unit.themeColor,
        lessons,
      };
    });
  }

  async getAdminCourseContent(courseId: string) {
    const course = await this.prisma.course.findUnique({
      where: { id: courseId },
      include: {
        units: {
          orderBy: { orderIndex: 'asc' },
          include: {
            lessons: {
              orderBy: { orderIndex: 'asc' },
              include: {
                exercises: {
                  orderBy: { orderIndex: 'asc' },
                  include: { exercise: true },
                },
              },
            },
          },
        },
      },
    });
    if (!course) throw new NotFoundException({ code: 'course_not_found', message: '课程不存在' });

    return {
      id: course.id,
      name: course.name,
      description: course.description,
      units: course.units.map((unit) => ({
        id: unit.id,
        orderIndex: unit.orderIndex,
        title: unit.title,
        themeColor: unit.themeColor,
        lessons: unit.lessons.map((lesson) => ({
          id: lesson.id,
          orderIndex: lesson.orderIndex,
          title: lesson.title,
          icon: lesson.icon,
          exerciseCount: lesson.exerciseCount,
          exercises: lesson.exercises.map((le) => ({
            id: le.exercise.id,
            type: le.exercise.type,
            prompt: le.exercise.prompt as unknown as ExercisePrompt,
            answer: le.exercise.answer as unknown as ExerciseAnswer,
            difficulty: le.exercise.difficulty,
            orderIndex: le.orderIndex,
          })),
        })),
      })),
    };
  }

  async updateExercise(exerciseId: string, dto: UpdateExerciseDto) {
    const existing = await this.prisma.exercise.findUnique({ where: { id: exerciseId } });
    if (!existing) throw new NotFoundException({ code: 'exercise_not_found', message: '题目不存在' });

    const updated = await this.prisma.exercise.update({
      where: { id: exerciseId },
      data: {
        ...(dto.type ? { type: dto.type } : {}),
        ...(dto.prompt ? { prompt: dto.prompt as Prisma.InputJsonValue } : {}),
        ...(dto.answer ? { answer: dto.answer as Prisma.InputJsonValue } : {}),
        ...(dto.difficulty ? { difficulty: dto.difficulty } : {}),
      },
    });

    const lessonLink = await this.prisma.lessonExercise.findFirst({
      where: { exerciseId },
      orderBy: { orderIndex: 'asc' },
    });

    return {
      id: updated.id,
      type: updated.type,
      prompt: updated.prompt as unknown as ExercisePrompt,
      answer: updated.answer as unknown as ExerciseAnswer,
      difficulty: updated.difficulty,
      orderIndex: lessonLink?.orderIndex ?? 0,
    };
  }
}
