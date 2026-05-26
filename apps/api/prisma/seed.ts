/**
 * StudyZone seed data.
 *
 * Provides:
 *   • 2 subjects: English (for Chinese speakers) and Math (Grade 3).
 *   • For each subject: 2 units × 2 skills × 2 lessons × ~6 exercises.
 *   • A demo user (demo@studyzone.dev / studyzone) so the app is usable
 *     immediately after `pnpm db:seed`.
 *
 * Run with:  pnpm --filter @studyzone/api db:seed
 */
import { PrismaClient } from '@prisma/client';
import * as argon2 from 'argon2';

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

  await buildEnglishCourse(enCourse.id);

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

  await buildMathCourse(mathCourse.id);

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

  console.log('Seed complete.');
  console.log('Demo login → demo@studyzone.dev / studyzone');
}

// =============================================================================
// English content
// =============================================================================

async function buildEnglishCourse(courseId: string) {
  // Unit 1: Greetings
  const unit1 = await upsertUnit(courseId, 0, '问候与基础', '#3FB984');
  const skill1a = await upsertSkill(unit1.id, 0, '打招呼', '👋');
  const skill1b = await upsertSkill(unit1.id, 1, '人称代词', '👤');

  await buildLesson(skill1a.id, 1, 0, [
    ex('translate_choice', {
      source: '你好',
      sourceLocale: 'zh-CN',
      options: ['Hello', 'Goodbye', 'Sorry', 'Thanks'],
    }, { correctIndex: 0 }),
    ex('translate_choice', {
      source: '再见',
      sourceLocale: 'zh-CN',
      options: ['Welcome', 'Hello', 'Goodbye', 'Please'],
    }, { correctIndex: 2 }),
    ex('translate_input', {
      source: '谢谢',
      sourceLocale: 'zh-CN',
    }, { accepted: ['thank you', 'thanks'], tolerance: 1 }),
    ex('listen_input', {
      audioUrl: 'https://ssl.gstatic.com/dictionary/static/sounds/oxford/hello--_gb_1.mp3',
    }, { accepted: ['hello'], tolerance: 1 }),
    ex('word_bank', {
      source: '早上好',
      tokens: ['Good', 'morning', 'evening', 'night'],
    }, { ordered: ['Good', 'morning'] }),
    ex('match_pairs', {
      left: [
        { id: 'l1', text: '你好' },
        { id: 'l2', text: '再见' },
        { id: 'l3', text: '谢谢' },
      ],
      right: [
        { id: 'r1', text: 'Goodbye' },
        { id: 'r2', text: 'Thanks' },
        { id: 'r3', text: 'Hello' },
      ],
    }, { pairs: { l1: 'r3', l2: 'r1', l3: 'r2' } }),
    ex('translate_input', {
      source: '对不起',
      sourceLocale: 'zh-CN',
    }, { accepted: ['sorry', "i'm sorry"], tolerance: 1 }),
  ]);

  await buildLesson(skill1a.id, 1, 1, [
    ex('single_choice', {
      question: 'Which is a greeting?',
      options: ['Apple', 'Hello', 'Run', 'Big'],
    }, { correctIndex: 1 }),
    ex('translate_choice', {
      source: '请',
      sourceLocale: 'zh-CN',
      options: ['Please', 'Maybe', 'Now', 'Why'],
    }, { correctIndex: 0 }),
    ex('translate_input', {
      source: '欢迎',
      sourceLocale: 'zh-CN',
    }, { accepted: ['welcome'], tolerance: 1 }),
    ex('word_bank', {
      source: '晚安',
      tokens: ['Good', 'night', 'morning'],
    }, { ordered: ['Good', 'night'] }),
    ex('listen_input', {
      audioUrl: 'https://ssl.gstatic.com/dictionary/static/sounds/oxford/welcome--_gb_1.mp3',
    }, { accepted: ['welcome'], tolerance: 1 }),
    ex('translate_choice', {
      source: '你好吗',
      sourceLocale: 'zh-CN',
      options: ['What is this', 'How are you', 'Where are you', 'Who are you'],
    }, { correctIndex: 1 }),
    ex('translate_input', {
      source: '我很好',
      sourceLocale: 'zh-CN',
    }, { accepted: ["i'm fine", 'i am fine', 'i am good'], tolerance: 2 }),
  ]);

  await buildLesson(skill1b.id, 1, 0, [
    ex('translate_choice', {
      source: '我',
      sourceLocale: 'zh-CN',
      options: ['You', 'I', 'He', 'They'],
    }, { correctIndex: 1 }),
    ex('translate_choice', {
      source: '你',
      sourceLocale: 'zh-CN',
      options: ['You', 'We', 'She', 'It'],
    }, { correctIndex: 0 }),
    ex('translate_input', {
      source: '他',
      sourceLocale: 'zh-CN',
    }, { accepted: ['he'], tolerance: 0 }),
    ex('translate_input', {
      source: '她',
      sourceLocale: 'zh-CN',
    }, { accepted: ['she'], tolerance: 0 }),
    ex('image_choice', {
      word: 'I',
      options: [
        { id: 'me', label: 'I', imageUrl: 'https://placehold.co/480x360/E6F4EC/1F2937.png?text=I' },
        { id: 'you', label: 'You', imageUrl: 'https://placehold.co/480x360/EEF2FF/1F2937.png?text=You' },
        { id: 'he', label: 'He', imageUrl: 'https://placehold.co/480x360/FEE2E2/1F2937.png?text=He' },
        { id: 'they', label: 'They', imageUrl: 'https://placehold.co/480x360/FEF3C7/1F2937.png?text=They' },
      ],
    }, { correctOptionId: 'me' }),
    ex('word_bank', {
      source: '我们是学生',
      tokens: ['We', 'are', 'students', 'is', 'student'],
    }, { ordered: ['We', 'are', 'students'] }),
    ex('translate_choice', {
      source: '他们',
      sourceLocale: 'zh-CN',
      options: ['We', 'They', 'You', 'I'],
    }, { correctIndex: 1 }),
  ]);

  // Unit 2: Food
  const unit2 = await upsertUnit(courseId, 1, '日常词汇', '#F97316');
  const skill2a = await upsertSkill(unit2.id, 0, '食物', '🍎');
  const skill2b = await upsertSkill(unit2.id, 1, '颜色', '🎨');

  await buildLesson(skill2a.id, 1, 0, [
    ex('translate_choice', {
      source: '苹果',
      sourceLocale: 'zh-CN',
      options: ['Apple', 'Banana', 'Orange', 'Grape'],
    }, { correctIndex: 0 }),
    ex('translate_choice', {
      source: '水',
      sourceLocale: 'zh-CN',
      options: ['Wine', 'Water', 'Milk', 'Juice'],
    }, { correctIndex: 1 }),
    ex('translate_input', {
      source: '面包',
      sourceLocale: 'zh-CN',
    }, { accepted: ['bread'], tolerance: 0 }),
    ex('translate_input', {
      source: '牛奶',
      sourceLocale: 'zh-CN',
    }, { accepted: ['milk'], tolerance: 0 }),
    ex('image_choice', {
      word: 'apple',
      audioUrl: 'https://ssl.gstatic.com/dictionary/static/sounds/oxford/apple--_gb_1.mp3',
      options: [
        { id: 'apple', label: 'Apple', imageUrl: 'https://placehold.co/480x360/FEE2E2/991B1B.png?text=Apple' },
        { id: 'bread', label: 'Bread', imageUrl: 'https://placehold.co/480x360/FEF3C7/92400E.png?text=Bread' },
        { id: 'water', label: 'Water', imageUrl: 'https://placehold.co/480x360/DBEAFE/1D4ED8.png?text=Water' },
        { id: 'milk', label: 'Milk', imageUrl: 'https://placehold.co/480x360/F8FAFC/334155.png?text=Milk' },
      ],
    }, { correctOptionId: 'apple' }),
    ex('match_pairs', {
      left: [
        { id: 'l1', text: '苹果' },
        { id: 'l2', text: '水' },
        { id: 'l3', text: '面包' },
      ],
      right: [
        { id: 'r1', text: 'Bread' },
        { id: 'r2', text: 'Apple' },
        { id: 'r3', text: 'Water' },
      ],
    }, { pairs: { l1: 'r2', l2: 'r3', l3: 'r1' } }),
    ex('word_bank', {
      source: '我喝水',
      tokens: ['I', 'drink', 'water', 'eat', 'food'],
    }, { ordered: ['I', 'drink', 'water'] }),
  ]);

  await buildLesson(skill2b.id, 1, 0, [
    ex('translate_choice', {
      source: '红色',
      sourceLocale: 'zh-CN',
      options: ['Red', 'Blue', 'Green', 'Yellow'],
    }, { correctIndex: 0 }),
    ex('translate_choice', {
      source: '蓝色',
      sourceLocale: 'zh-CN',
      options: ['Pink', 'Black', 'Blue', 'White'],
    }, { correctIndex: 2 }),
    ex('translate_input', {
      source: '绿色',
      sourceLocale: 'zh-CN',
    }, { accepted: ['green'], tolerance: 0 }),
    ex('translate_input', {
      source: '黄色',
      sourceLocale: 'zh-CN',
    }, { accepted: ['yellow'], tolerance: 1 }),
    ex('image_choice', {
      word: 'blue',
      options: [
        { id: 'red', label: 'Red', imageUrl: 'https://placehold.co/480x360/FEE2E2/DC2626.png?text=Red' },
        { id: 'blue', label: 'Blue', imageUrl: 'https://placehold.co/480x360/DBEAFE/2563EB.png?text=Blue' },
        { id: 'green', label: 'Green', imageUrl: 'https://placehold.co/480x360/DCFCE7/16A34A.png?text=Green' },
        { id: 'yellow', label: 'Yellow', imageUrl: 'https://placehold.co/480x360/FEF9C3/CA8A04.png?text=Yellow' },
      ],
    }, { correctOptionId: 'blue' }),
    ex('word_bank', {
      source: '苹果是红色的',
      tokens: ['The', 'apple', 'is', 'red', 'blue'],
    }, { ordered: ['The', 'apple', 'is', 'red'] }),
    ex('single_choice', {
      question: 'Which one is a color?',
      options: ['Bread', 'Green', 'Walk', 'Tree'],
    }, { correctIndex: 1 }),
  ]);
}

// =============================================================================
// Math content
// =============================================================================

async function buildMathCourse(courseId: string) {
  const unit1 = await upsertUnit(courseId, 0, '加减法基础', '#F59E0B');
  const skill1a = await upsertSkill(unit1.id, 0, '一位数加法', '➕');
  const skill1b = await upsertSkill(unit1.id, 1, '一位数减法', '➖');

  await buildLesson(skill1a.id, 1, 0, [
    ex('numeric_input', { statement: '3 + 4 = ?' }, { value: 7 }),
    ex('numeric_input', { statement: '5 + 2 = ?' }, { value: 7 }),
    ex('match_pairs', {
      left: [
        { id: 'l1', text: '3 + 4' },
        { id: 'l2', text: '4 + 4' },
        { id: 'l3', text: '6 + 3' },
      ],
      right: [
        { id: 'r1', text: '9' },
        { id: 'r2', text: '7' },
        { id: 'r3', text: '8' },
      ],
    }, { pairs: { l1: 'r2', l2: 'r3', l3: 'r1' } }),
    ex('numeric_input', { statement: '6 + 3 = ?' }, { value: 9 }),
    ex('single_choice', {
      question: '8 + 1 = ?',
      options: ['7', '8', '9', '10'],
    }, { correctIndex: 2 }),
    ex('numeric_input', { statement: '2 + 2 = ?' }, { value: 4 }),
    ex('single_choice', {
      question: '4 + 5 = ?',
      options: ['8', '9', '10', '11'],
    }, { correctIndex: 1 }),
  ]);

  await buildLesson(skill1b.id, 1, 0, [
    ex('numeric_input', { statement: '9 - 3 = ?' }, { value: 6 }),
    ex('numeric_input', { statement: '7 - 2 = ?' }, { value: 5 }),
    ex('numeric_input', { statement: '8 - 5 = ?' }, { value: 3 }),
    ex('single_choice', {
      question: '10 - 4 = ?',
      options: ['4', '5', '6', '7'],
    }, { correctIndex: 2 }),
    ex('image_choice', {
      word: 'Which picture shows 6?',
      options: [
        { id: 'four', label: '4', imageUrl: 'https://placehold.co/480x360/EEF2FF/3730A3.png?text=4' },
        { id: 'five', label: '5', imageUrl: 'https://placehold.co/480x360/E0F2FE/0369A1.png?text=5' },
        { id: 'six', label: '6', imageUrl: 'https://placehold.co/480x360/DCFCE7/15803D.png?text=6' },
        { id: 'seven', label: '7', imageUrl: 'https://placehold.co/480x360/FEF3C7/B45309.png?text=7' },
      ],
    }, { correctOptionId: 'six' }),
    ex('numeric_input', { statement: '6 - 1 = ?' }, { value: 5 }),
    ex('single_choice', {
      question: '5 - 5 = ?',
      options: ['0', '1', '5', '10'],
    }, { correctIndex: 0 }),
  ]);

  const unit2 = await upsertUnit(courseId, 1, '乘法启蒙', '#3B82F6');
  const skill2a = await upsertSkill(unit2.id, 0, '2 的乘法', '✖️');
  const skill2b = await upsertSkill(unit2.id, 1, '5 的乘法', '⭐');

  await buildLesson(skill2a.id, 1, 0, [
    ex('numeric_input', { statement: '2 × 3 = ?' }, { value: 6 }),
    ex('numeric_input', { statement: '2 × 4 = ?' }, { value: 8 }),
    ex('numeric_input', { statement: '2 × 6 = ?' }, { value: 12 }),
    ex('single_choice', {
      question: '2 × 7 = ?',
      options: ['12', '13', '14', '15'],
    }, { correctIndex: 2 }),
    ex('word_bank', {
      source: '2 × 8 等于 16',
      tokens: ['2', '×', '8', '=', '16', '14'],
    }, { ordered: ['2', '×', '8', '=', '16'] }),
    ex('numeric_input', { statement: '2 × 9 = ?' }, { value: 18 }),
    ex('single_choice', {
      question: '2 × 8 = ?',
      options: ['14', '16', '18', '20'],
    }, { correctIndex: 1 }),
  ]);

  await buildLesson(skill2b.id, 1, 0, [
    ex('numeric_input', { statement: '5 × 2 = ?' }, { value: 10 }),
    ex('numeric_input', { statement: '5 × 4 = ?' }, { value: 20 }),
    ex('numeric_input', { statement: '5 × 6 = ?' }, { value: 30 }),
    ex('single_choice', {
      question: '5 × 5 = ?',
      options: ['20', '25', '30', '35'],
    }, { correctIndex: 1 }),
    ex('match_pairs', {
      left: [
        { id: 'l1', text: '5 × 2' },
        { id: 'l2', text: '5 × 4' },
        { id: 'l3', text: '5 × 6' },
      ],
      right: [
        { id: 'r1', text: '20' },
        { id: 'r2', text: '30' },
        { id: 'r3', text: '10' },
      ],
    }, { pairs: { l1: 'r3', l2: 'r1', l3: 'r2' } }),
    ex('numeric_input', { statement: '5 × 9 = ?' }, { value: 45 }),
    ex('single_choice', {
      question: '5 × 7 = ?',
      options: ['30', '35', '40', '45'],
    }, { correctIndex: 1 }),
  ]);
}

// =============================================================================
// Helpers
// =============================================================================

function ex(type: string, prompt: Record<string, unknown>, answer: Record<string, unknown>) {
  return { type, prompt: { type, ...prompt }, answer };
}

async function upsertUnit(courseId: string, orderIndex: number, title: string, themeColor: string) {
  return prisma.unit.upsert({
    where: { courseId_orderIndex: { courseId, orderIndex } },
    create: { courseId, orderIndex, title, themeColor },
    update: { title, themeColor },
  });
}

async function upsertSkill(unitId: string, orderIndex: number, name: string, icon: string) {
  return prisma.skill.upsert({
    where: { unitId_orderIndex: { unitId, orderIndex } },
    create: { unitId, orderIndex, name, icon, maxLevel: 5 },
    update: { name, icon },
  });
}

async function buildLesson(
  skillId: string,
  level: number,
  orderIndex: number,
  exercises: Array<{ type: string; prompt: any; answer: any }>,
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
        difficulty: 1,
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
