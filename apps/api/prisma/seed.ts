/**
 * StudyZone seed data.
 *
 * Provides:
 *   • 3 subjects: English (for Chinese speakers), Math (Grade 3),
 *     Chinese / 语文 (Grade 1-3 — pinyin, characters, poetry).
 *   • For each subject: 2 units × 2 skills × 1-2 lessons × ~7 exercises.
 *   • A demo user (demo@studyzone.dev / studyzone) so the app is usable
 *     immediately after `pnpm db:seed`.
 *
 * Run with:  pnpm --filter @studyzone/api db:seed
 */
import { PrismaClient } from '@prisma/client';
import * as argon2 from 'argon2';
import {
  chineseCourseContent,
  englishCourseContent,
  mathCourseContent,
  type SeedCourseContent,
  type SeedExercise,
} from './seed-data';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding StudyZone...');

  // --- Subjects -------------------------------------------------------------
  const english = await prisma.subject.upsert({
    where: { code: 'english' },
    create: { code: 'english', name: '英语', icon: '🇬🇧', color: '#3FB984', order: 1 },
    update: {},
  });

  const math = await prisma.subject.upsert({
    where: { code: 'math' },
    create: { code: 'math', name: '数学', icon: '🧮', color: '#F59E0B', order: 2 },
    update: {},
  });

  const chinese = await prisma.subject.upsert({
    where: { code: 'chinese' },
    create: { code: 'chinese', name: '语文', icon: '📖', color: '#DC2626', order: 3 },
    update: {},
  });

  // --- English course -------------------------------------------------------
  const enCourse = await prisma.course.upsert({
    where: {
      subjectId_fromLocale_toLocale: {
        subjectId: english.id,
        fromLocale: 'zh-CN',
        toLocale: 'en-US',
      },
    },
    create: {
      subjectId: english.id,
      fromLocale: 'zh-CN',
      toLocale: 'en-US',
      name: '英语入门',
      description: '从问候和日常词汇开始，循序渐进掌握英语。',
      flagEmoji: '🇬🇧',
      status: 'published',
    },
    update: {},
  });

  await buildCourseContent(enCourse.id, englishCourseContent);

  // --- Math course ----------------------------------------------------------
  const mathCourse = await prisma.course.upsert({
    where: {
      subjectId_fromLocale_toLocale: {
        subjectId: math.id,
        fromLocale: 'zh-CN',
        toLocale: 'math',
      },
    },
    create: {
      subjectId: math.id,
      fromLocale: 'zh-CN',
      toLocale: 'math',
      name: '数学三年级',
      description: '加减乘除核心运算，配套关卡循序渐进。',
      flagEmoji: '🧮',
      status: 'published',
    },
    update: {},
  });

  await buildCourseContent(mathCourse.id, mathCourseContent);

  // --- Chinese course -------------------------------------------------------
  const zhCourse = await prisma.course.upsert({
    where: {
      subjectId_fromLocale_toLocale: {
        subjectId: chinese.id,
        fromLocale: 'zh-CN',
        toLocale: 'zh-CN',
      },
    },
    create: {
      subjectId: chinese.id,
      fromLocale: 'zh-CN',
      toLocale: 'zh-CN',
      name: '语文一年级',
      description: '从拼音、汉字到古诗启蒙，给小学低段同学量身打造。',
      flagEmoji: '📖',
      status: 'published',
    },
    update: {},
  });

  await buildCourseContent(zhCourse.id, chineseCourseContent);

  // --- Daily quests ---------------------------------------------------------
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

  // --- Achievements ---------------------------------------------------------
  const achievements = [
    { code: 'first_lesson', title: '初出茅庐', description: '完成你的第一节关卡', icon: '🎯', threshold: 1, category: 'xp' },
    { code: 'streak_7', title: '坚持一周', description: '连续学习 7 天', icon: '🔥', threshold: 7, category: 'streak' },
    { code: 'xp_100', title: '百分骑士', description: '累计获得 100 XP', icon: '⚡️', threshold: 100, category: 'xp' },
  ];
  for (const a of achievements) {
    await prisma.achievement.upsert({
      where: { code: a.code },
      create: a,
      update: {},
    });
  }

  // --- Demo user ------------------------------------------------------------
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

  await prisma.enrollment.upsert({
    where: { userId_courseId: { userId: demo.id, courseId: enCourse.id } },
    create: { userId: demo.id, courseId: enCourse.id },
    update: {},
  });
  await prisma.enrollment.upsert({
    where: { userId_courseId: { userId: demo.id, courseId: mathCourse.id } },
    create: { userId: demo.id, courseId: mathCourse.id },
    update: {},
  });
  await prisma.enrollment.upsert({
    where: { userId_courseId: { userId: demo.id, courseId: zhCourse.id } },
    create: { userId: demo.id, courseId: zhCourse.id },
    update: {},
  });

  console.log('Seed complete.');
  console.log('Demo login → demo@studyzone.dev / studyzone');
}

// =============================================================================
// Helpers
// =============================================================================

async function buildCourseContent(courseId: string, content: SeedCourseContent) {
  for (const unitData of content.units) {
    const unit = await upsertUnit(courseId, unitData.orderIndex, unitData.title, unitData.themeColor);

    for (const skillData of unitData.skills) {
      const skill = await upsertSkill(
        unit.id,
        skillData.orderIndex,
        skillData.name,
        skillData.icon,
        skillData.maxLevel,
      );

      for (const lessonData of skillData.lessons) {
        await buildLesson(skill.id, lessonData.level, lessonData.orderIndex, lessonData.exercises);
      }
    }
  }
}

async function upsertUnit(
  courseId: string,
  orderIndex: number,
  title: string,
  themeColor: string,
) {
  return prisma.unit.upsert({
    where: { courseId_orderIndex: { courseId, orderIndex } },
    create: { courseId, orderIndex, title, themeColor },
    update: { title, themeColor },
  });
}

async function upsertSkill(
  unitId: string,
  orderIndex: number,
  name: string,
  icon: string,
  maxLevel = 5,
) {
  return prisma.skill.upsert({
    where: { unitId_orderIndex: { unitId, orderIndex } },
    create: { unitId, orderIndex, name, icon, maxLevel },
    update: { name, icon, maxLevel },
  });
}

async function buildLesson(
  skillId: string,
  level: number,
  orderIndex: number,
  exercises: SeedExercise[],
) {
  const lesson = await prisma.lesson.upsert({
    where: { skillId_level_orderIndex: { skillId, level, orderIndex } },
    create: { skillId, level, orderIndex, exerciseCount: exercises.length },
    update: { exerciseCount: exercises.length },
  });

  // Reset junctions so re-seeding is idempotent.
  await prisma.lessonExercise.deleteMany({ where: { lessonId: lesson.id } });

  for (let i = 0; i < exercises.length; i++) {
    const e = exercises[i]!;
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
