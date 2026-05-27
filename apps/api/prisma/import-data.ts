/**
 * StudyZone import data.
 *
 * Provides:
 *   • 3 subjects with one course each.
 *   • Hierarchy: Subject -> Course -> Unit -> Lesson.
 *   • Reset-and-reimport behavior for curriculum content.
 *   • A demo user (demo@studyzone.dev / studyzone).
 */
import { PrismaClient } from '@prisma/client';
import * as argon2 from 'argon2';

import {
  loadLessonData,
  type LessonDataCourse,
  type LessonDataExercise,
  type LessonDataLesson,
} from './lesson-data/loader';

const prisma = new PrismaClient();

async function main() {
  console.log('Importing StudyZone data...');
  console.log('Resetting curriculum content...');
  await resetCurriculumContent();

  const lessonData = loadLessonData();
  const courseIds: string[] = [];

  for (const subjectData of lessonData.subjects) {
    const subject = await prisma.subject.create({
      data: {
        code: subjectData.code,
        name: subjectData.name,
        icon: subjectData.icon,
        color: subjectData.color,
        order: subjectData.order,
      },
    });

    for (const courseData of subjectData.courses) {
      const course = await prisma.course.create({
        data: {
          subjectId: subject.id,
          fromLocale: courseData.fromLocale,
          toLocale: courseData.toLocale,
          name: courseData.name,
          description: courseData.description,
          flagEmoji: courseData.flagEmoji,
          version: courseData.version,
          status: courseData.status,
        },
      });

      courseIds.push(course.id);
      await buildCourseContent(course.id, courseData);
    }
  }

  await prisma.dailyQuest.upsert({
    where: { code: 'complete_lessons' },
    create: {
      code: 'complete_lessons',
      title: '完成 3 节关卡',
      targetValue: 3,
      xpReward: 10,
      gemsReward: 5,
    },
    update: {},
  });
  await prisma.dailyQuest.upsert({
    where: { code: 'earn_xp' },
    create: {
      code: 'earn_xp',
      title: '获得 50 XP',
      targetValue: 50,
      xpReward: 5,
      gemsReward: 3,
    },
    update: {},
  });

  const achievements = [
    {
      code: 'first_lesson',
      title: '初出茅庐',
      description: '完成你的第一节关卡',
      icon: '🎯',
      threshold: 1,
      category: 'xp',
    },
    {
      code: 'streak_7',
      title: '坚持一周',
      description: '连续学习 7 天',
      icon: '🔥',
      threshold: 7,
      category: 'streak',
    },
    {
      code: 'xp_100',
      title: '百分骑士',
      description: '累计获得 100 XP',
      icon: '⚡️',
      threshold: 100,
      category: 'xp',
    },
  ];
  for (const a of achievements) {
    await prisma.achievement.upsert({
      where: { code: a.code },
      create: a,
      update: {},
    });
  }

  const passwordHash = await argon2.hash('studyzone');
  const demo = await prisma.user.upsert({
    where: { email: 'demo@studyzone.dev' },
    create: {
      email: 'demo@studyzone.dev',
      passwordHash,
      nickname: '示例同学',
      locale: 'zh-CN',
      wallet: { create: {} },
      streak: { create: {} },
    },
    update: {},
    include: { wallet: true, streak: true },
  });

  for (const courseId of courseIds) {
    await prisma.enrollment.upsert({
      where: { userId_courseId: { userId: demo.id, courseId } },
      create: { userId: demo.id, courseId },
      update: {},
    });
  }

  console.log('Import complete.');
  console.log('Demo login → demo@studyzone.dev / studyzone');
}

async function resetCurriculumContent() {
  await prisma.$transaction([
    prisma.exerciseAttempt.deleteMany(),
    prisma.learningSession.deleteMany(),
    prisma.srsCard.deleteMany(),
    prisma.userLessonProgress.deleteMany(),
    prisma.enrollment.deleteMany(),
    prisma.lessonExercise.deleteMany(),
    prisma.exercise.deleteMany(),
    prisma.lesson.deleteMany(),
    prisma.unit.deleteMany(),
    prisma.course.deleteMany(),
    prisma.subject.deleteMany(),
  ]);
}

async function buildCourseContent(courseId: string, content: LessonDataCourse) {
  for (const unitData of content.units) {
    const unit = await upsertUnit(
      courseId,
      unitData.orderIndex,
      unitData.title,
      unitData.themeColor,
    );
    for (const lessonData of unitData.lessons) {
      await buildLesson(unit.id, lessonData);
    }
  }
}

async function upsertUnit(courseId: string, orderIndex: number, title: string, themeColor: string) {
  return prisma.unit.create({
    data: { courseId, orderIndex, title, themeColor },
  });
}

async function buildLesson(unitId: string, lessonData: LessonDataLesson) {
  const lesson = await prisma.lesson.create({
    data: {
      unitId,
      orderIndex: lessonData.orderIndex,
      title: lessonData.title,
      icon: lessonData.icon,
      exerciseCount: lessonData.exercises.length,
    },
  });

  for (let i = 0; i < lessonData.exercises.length; i++) {
    const e: LessonDataExercise = lessonData.exercises[i]!;
    const created = await prisma.exercise.create({
      data: {
        type: e.type,
        prompt: e.prompt,
        answer: e.answer,
        difficulty: e.difficulty ?? 1,
      },
    });
    await prisma.lessonExercise.create({
      data: { lessonId: lesson.id, exerciseId: created.id, orderIndex: i },
    });
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
