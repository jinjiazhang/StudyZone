/**
 * StudyZone import data.
 *
 * Provides:
 *   • 3 subjects with one course each.
 *   • Hierarchy: Subject -> Course -> Unit -> Lesson.
 *   • Reimport behavior for curriculum content while preserving user progress.
 *   • A demo user (tiantianzh@qq.com / 00000000).
 */
import { Prisma, PrismaClient } from '@prisma/client';
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
  console.log('Upserting curriculum content while preserving learning progress...');

  const lessonData = loadLessonData();

  for (const subjectData of lessonData.subjects) {
    const subject = await prisma.subject.upsert({
      where: { code: subjectData.code },
      create: {
        code: subjectData.code,
        name: subjectData.name,
        icon: subjectData.icon,
        color: subjectData.color,
        order: subjectData.order,
      },
      update: {
        name: subjectData.name,
        icon: subjectData.icon,
        color: subjectData.color,
        order: subjectData.order,
      },
    });

    for (const courseData of subjectData.courses) {
      const course = await prisma.course.upsert({
        where: {
          subjectId_fromLocale_toLocale: {
            subjectId: subject.id,
            fromLocale: courseData.fromLocale,
            toLocale: courseData.toLocale,
          },
        },
        create: {
          subjectId: subject.id,
          fromLocale: courseData.fromLocale,
          toLocale: courseData.toLocale,
          name: courseData.name,
          description: courseData.description,
          coverImageUrl: courseData.coverImageUrl,
          version: courseData.version,
          status: courseData.status,
        },
        update: {
          name: courseData.name,
          description: courseData.description,
          coverImageUrl: courseData.coverImageUrl,
          version: courseData.version,
          status: courseData.status,
        },
      });

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

  const passwordHash = await argon2.hash('00000000');
  await prisma.user.upsert({
    where: { email: 'tiantianzh@qq.com' },
    create: {
      email: 'tiantianzh@qq.com',
      passwordHash,
      username: 'tiantian',
      nickname: '天天',
      locale: 'zh-CN',
      wallet: { create: {} },
      streak: { create: {} },
    },
    update: {},
  });

  console.log('Import complete.');
  console.log('Learning progress, enrollments, sessions, attempts, and SRS cards were preserved.');
  console.log('Default login → tiantianzh@qq.com / 00000000');
}

async function buildCourseContent(courseId: string, content: LessonDataCourse) {
  const importedUnitOrderIndexes = content.units.map((unit) => unit.orderIndex);

  for (const unitData of content.units) {
    const unit = await upsertUnit(
      courseId,
      unitData.orderIndex,
      unitData.title,
      unitData.themeColor,
      unitData.mapDecorations,
    );
    for (const lessonData of unitData.lessons) {
      await buildLesson(unit.id, lessonData);
    }

    await pruneStaleLessons(
      unit.id,
      unitData.lessons.map((lesson) => lesson.orderIndex),
    );
  }

  await pruneStaleUnits(courseId, importedUnitOrderIndexes);
}

async function upsertUnit(
  courseId: string,
  orderIndex: number,
  title: string,
  themeColor: string,
  mapDecorations: LessonDataCourse['units'][number]['mapDecorations'],
) {
  return prisma.unit.upsert({
    where: { courseId_orderIndex: { courseId, orderIndex } },
    create: {
      courseId,
      orderIndex,
      title,
      themeColor,
      mapDecorations: mapDecorations as unknown as Prisma.InputJsonValue,
    },
    update: {
      title,
      themeColor,
      mapDecorations: mapDecorations as unknown as Prisma.InputJsonValue,
    },
  });
}

async function buildLesson(unitId: string, lessonData: LessonDataLesson) {
  const lesson = await prisma.lesson.upsert({
    where: { unitId_orderIndex: { unitId, orderIndex: lessonData.orderIndex } },
    create: {
      unitId,
      orderIndex: lessonData.orderIndex,
      title: lessonData.title,
      icon: lessonData.icon,
      exerciseCount: lessonData.exercises.length,
    },
    update: {
      title: lessonData.title,
      icon: lessonData.icon,
      exerciseCount: lessonData.exercises.length,
    },
  });

  const existingLinks = await prisma.lessonExercise.findMany({
    where: { lessonId: lesson.id },
    include: { exercise: true },
    orderBy: { orderIndex: 'asc' },
  });
  const linksByOrderIndex = new Map(existingLinks.map((link) => [link.orderIndex, link]));
  const importedOrderIndexes = new Set<number>();

  for (let i = 0; i < lessonData.exercises.length; i++) {
    const e: LessonDataExercise = lessonData.exercises[i]!;
    const existingLink = linksByOrderIndex.get(i);
    importedOrderIndexes.add(i);

    if (existingLink) {
      await prisma.exercise.update({
        where: { id: existingLink.exerciseId },
        data: {
          type: e.type,
          prompt: e.prompt as unknown as Prisma.InputJsonValue,
          answer: e.answer as unknown as Prisma.InputJsonValue,
          difficulty: e.difficulty ?? 1,
        },
      });
      continue;
    }

    const created = await prisma.exercise.create({
      data: {
        type: e.type,
        prompt: e.prompt as unknown as Prisma.InputJsonValue,
        answer: e.answer as unknown as Prisma.InputJsonValue,
        difficulty: e.difficulty ?? 1,
      },
    });
    await prisma.lessonExercise.create({
      data: { lessonId: lesson.id, exerciseId: created.id, orderIndex: i },
    });
  }

  const staleLinks = existingLinks.filter((link) => !importedOrderIndexes.has(link.orderIndex));
  for (const staleLink of staleLinks) {
    await prisma.lessonExercise.delete({
      where: { lessonId_exerciseId: { lessonId: lesson.id, exerciseId: staleLink.exerciseId } },
    });
  }
}

async function pruneStaleLessons(unitId: string, importedOrderIndexes: number[]) {
  const staleLessons = await prisma.lesson.findMany({
    where: { unitId, orderIndex: { notIn: importedOrderIndexes } },
    select: { id: true },
  });

  for (const lesson of staleLessons) {
    const learningStateCount =
      (await prisma.learningSession.count({ where: { lessonId: lesson.id } })) +
      (await prisma.userLessonProgress.count({ where: { lessonId: lesson.id } }));

    if (learningStateCount > 0) continue;

    await prisma.lessonExercise.deleteMany({ where: { lessonId: lesson.id } });
    await prisma.lesson.delete({ where: { id: lesson.id } });
  }
}

async function pruneStaleUnits(courseId: string, importedOrderIndexes: number[]) {
  const staleUnits = await prisma.unit.findMany({
    where: { courseId, orderIndex: { notIn: importedOrderIndexes } },
    select: { id: true, lessons: { select: { id: true } } },
  });

  for (const unit of staleUnits) {
    const lessonIds = unit.lessons.map((lesson) => lesson.id);
    if (lessonIds.length > 0) {
      const learningStateCount =
        (await prisma.learningSession.count({ where: { lessonId: { in: lessonIds } } })) +
        (await prisma.userLessonProgress.count({ where: { lessonId: { in: lessonIds } } }));

      if (learningStateCount > 0) continue;

      await prisma.lessonExercise.deleteMany({ where: { lessonId: { in: lessonIds } } });
      await prisma.lesson.deleteMany({ where: { id: { in: lessonIds } } });
    }

    await prisma.unit.delete({ where: { id: unit.id } });
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
