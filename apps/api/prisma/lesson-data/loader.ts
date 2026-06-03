import { existsSync, readFileSync } from 'node:fs';
import { join, relative } from 'node:path';

export interface LessonDataExercise {
  type: string;
  prompt: Record<string, unknown>;
  answer: Record<string, unknown>;
  difficulty: number;
}

export interface LessonDataLesson {
  orderIndex: number;
  title: string;
  icon: string;
  exercises: LessonDataExercise[];
}

export interface LessonDataUnit {
  orderIndex: number;
  title: string;
  themeColor: string;
  mapDecorations: LessonDataMapDecoration[];
  lessons: LessonDataLesson[];
}

export interface LessonDataMapDecoration {
  id: string;
  src: string;
  side: 'left' | 'right';
  anchorLessonOrder: number;
  stateMachine?: string;
  animation?: string;
  size?: number;
  offsetX?: number;
  offsetY?: number;
  hiddenWhenLocked?: boolean;
}

export interface LessonDataCourse {
  fromLocale: string;
  toLocale: string;
  name: string;
  description: string;
  coverImageUrl: string;
  version: number;
  status: string;
  units: LessonDataUnit[];
}

export interface LessonDataSubject {
  code: string;
  name: string;
  icon: string;
  color: string;
  order: number;
  courses: LessonDataCourse[];
}

export interface LessonDataCatalog {
  subjects: LessonDataSubject[];
}

interface SubjectsIndex {
  subjects: Array<{
    code: string;
    name: string;
    icon: string;
    color: string;
    order: number;
    dir: string;
  }>;
}

interface CoursesIndex {
  courses: Array<{
    dir: string;
    fromLocale: string;
    toLocale: string;
    name: string;
    description: string;
    coverImageUrl: string;
    version?: number;
    status?: string;
  }>;
}

interface UnitsIndex {
  units: Array<{
    dir: string;
    orderIndex: number;
    title: string;
    themeColor: string;
    mapDecorations?: unknown;
  }>;
}

interface LessonsIndex {
  lessons: Array<{
    file: string;
    orderIndex: number;
    title: string;
    icon?: string;
  }>;
}

interface LessonFile {
  exercises: Array<{
    type: string;
    prompt: Record<string, unknown>;
    answer: Record<string, unknown>;
    difficulty?: number;
  }>;
}

export function loadLessonData(rootDir = join(__dirname)): LessonDataCatalog {
  const subjectsIndex = readJson<SubjectsIndex>(rootDir, 'subjects.json');
  assertArray(subjectsIndex.subjects, 'subjects.json', 'subjects');

  return {
    subjects: subjectsIndex.subjects.map((subject) => {
      assertString(subject.code, 'subjects.json', 'subject.code');
      assertString(subject.dir, 'subjects.json', `${subject.code}.dir`);
      assertNoPathTraversal(subject.dir, `subjects.${subject.code}.dir`);

      const subjectDir = join(rootDir, subject.dir);
      assertExists(subjectDir, `subject directory ${subject.dir}`);
      const coursesIndex = readJson<CoursesIndex>(subjectDir, 'courses.json');
      assertArray(coursesIndex.courses, `${subject.dir}/courses.json`, 'courses');

      return {
        code: subject.code,
        name: requiredString(subject.name, 'subjects.json', `${subject.code}.name`),
        icon: requiredString(subject.icon, 'subjects.json', `${subject.code}.icon`),
        color: requiredString(subject.color, 'subjects.json', `${subject.code}.color`),
        order: requiredNumber(subject.order, 'subjects.json', `${subject.code}.order`),
        courses: coursesIndex.courses.map((course) => loadCourse(subjectDir, subject.dir, course)),
      };
    }),
  };
}

function loadCourse(
  subjectDir: string,
  subjectDirName: string,
  course: CoursesIndex['courses'][number],
): LessonDataCourse {
  assertString(course.dir, `${subjectDirName}/courses.json`, `${course.name}.dir`);
  assertNoPathTraversal(course.dir, `courses.${course.name}.dir`);

  const courseDir = join(subjectDir, course.dir);
  assertExists(courseDir, `course directory ${subjectDirName}/${course.dir}`);
  const unitsIndex = readJson<UnitsIndex>(courseDir, 'units.json');
  assertArray(unitsIndex.units, `${subjectDirName}/${course.dir}/units.json`, 'units');
  assertUniqueOrder(unitsIndex.units, `${subjectDirName}/${course.dir}/units.json`, 'units');

  return {
    fromLocale: requiredString(
      course.fromLocale,
      `${subjectDirName}/courses.json`,
      `${course.name}.fromLocale`,
    ),
    toLocale: requiredString(
      course.toLocale,
      `${subjectDirName}/courses.json`,
      `${course.name}.toLocale`,
    ),
    name: requiredString(course.name, `${subjectDirName}/courses.json`, 'course.name'),
    description: requiredString(
      course.description,
      `${subjectDirName}/courses.json`,
      `${course.name}.description`,
    ),
    coverImageUrl: requiredString(
      course.coverImageUrl,
      `${subjectDirName}/courses.json`,
      `${course.name}.coverImageUrl`,
    ),
    version: course.version ?? 1,
    status: course.status ?? 'published',
    units: unitsIndex.units.map((unit) =>
      loadUnit(courseDir, `${subjectDirName}/${course.dir}`, unit),
    ),
  };
}

function loadUnit(
  courseDir: string,
  coursePath: string,
  unit: UnitsIndex['units'][number],
): LessonDataUnit {
  assertString(unit.dir, `${coursePath}/units.json`, `${unit.title}.dir`);
  assertNoPathTraversal(unit.dir, `units.${unit.title}.dir`);

  const unitDir = join(courseDir, unit.dir);
  assertExists(unitDir, `unit directory ${coursePath}/${unit.dir}`);
  const lessonsIndex = readJson<LessonsIndex>(unitDir, 'lessons.json');
  assertArray(lessonsIndex.lessons, `${coursePath}/${unit.dir}/lessons.json`, 'lessons');
  assertUniqueOrder(lessonsIndex.lessons, `${coursePath}/${unit.dir}/lessons.json`, 'lessons');

  return {
    orderIndex: requiredNumber(
      unit.orderIndex,
      `${coursePath}/units.json`,
      `${unit.title}.orderIndex`,
    ),
    title: requiredString(unit.title, `${coursePath}/units.json`, 'unit.title'),
    themeColor: requiredString(
      unit.themeColor,
      `${coursePath}/units.json`,
      `${unit.title}.themeColor`,
    ),
    mapDecorations: normalizeMapDecorations(
      unit.mapDecorations,
      `${coursePath}/units.json`,
      `${unit.title}.mapDecorations`,
    ),
    lessons: lessonsIndex.lessons.map((lesson) =>
      loadLesson(unitDir, `${coursePath}/${unit.dir}`, lesson),
    ),
  };
}

function normalizeMapDecorations(
  value: unknown,
  filePath: string,
  field: string,
): LessonDataMapDecoration[] {
  if (value === undefined) return [];
  assertArray(value, filePath, field);

  return value.map((decoration, index) => {
    const itemField = `${field}[${index}]`;
    assertPlainObject(decoration, filePath, itemField);

    const side = requiredString(decoration.side, filePath, `${itemField}.side`);
    if (side !== 'left' && side !== 'right') {
      throw new Error(`Invalid lesson data: ${filePath} ${itemField}.side must be left or right`);
    }

    const normalized: LessonDataMapDecoration = {
      id: requiredString(decoration.id, filePath, `${itemField}.id`),
      src: requiredString(decoration.src, filePath, `${itemField}.src`),
      side,
      anchorLessonOrder: requiredNumber(
        decoration.anchorLessonOrder,
        filePath,
        `${itemField}.anchorLessonOrder`,
      ),
    };
    const stateMachine = optionalString(
      decoration.stateMachine,
      filePath,
      `${itemField}.stateMachine`,
    );
    const animation = optionalString(decoration.animation, filePath, `${itemField}.animation`);
    const size = optionalNumber(decoration.size, filePath, `${itemField}.size`);
    const offsetX = optionalNumber(decoration.offsetX, filePath, `${itemField}.offsetX`);
    const offsetY = optionalNumber(decoration.offsetY, filePath, `${itemField}.offsetY`);
    const hiddenWhenLocked = optionalBoolean(
      decoration.hiddenWhenLocked,
      filePath,
      `${itemField}.hiddenWhenLocked`,
    );

    if (stateMachine !== undefined) normalized.stateMachine = stateMachine;
    if (animation !== undefined) normalized.animation = animation;
    if (size !== undefined) normalized.size = size;
    if (offsetX !== undefined) normalized.offsetX = offsetX;
    if (offsetY !== undefined) normalized.offsetY = offsetY;
    if (hiddenWhenLocked !== undefined) normalized.hiddenWhenLocked = hiddenWhenLocked;

    return normalized;
  });
}

function loadLesson(
  unitDir: string,
  unitPath: string,
  lesson: LessonsIndex['lessons'][number],
): LessonDataLesson {
  assertString(lesson.file, `${unitPath}/lessons.json`, `${lesson.title}.file`);
  assertNoPathTraversal(lesson.file, `lessons.${lesson.title}.file`);

  const lessonFile = readJson<LessonFile>(unitDir, lesson.file);
  assertArray(lessonFile.exercises, `${unitPath}/${lesson.file}`, 'exercises');

  return {
    orderIndex: requiredNumber(
      lesson.orderIndex,
      `${unitPath}/lessons.json`,
      `${lesson.title}.orderIndex`,
    ),
    title: requiredString(lesson.title, `${unitPath}/lessons.json`, 'lesson.title'),
    icon: lesson.icon ?? '',
    exercises: lessonFile.exercises.map((exercise, index) =>
      normalizeExercise(exercise, `${unitPath}/${lesson.file}`, index),
    ),
  };
}

function normalizeExercise(
  exercise: LessonFile['exercises'][number],
  filePath: string,
  index: number,
): LessonDataExercise {
  assertString(exercise.type, filePath, `exercises[${index}].type`);
  assertPlainObject(exercise.prompt, filePath, `exercises[${index}].prompt`);
  assertPlainObject(exercise.answer, filePath, `exercises[${index}].answer`);

  return {
    type: exercise.type,
    prompt: { type: exercise.type, ...exercise.prompt },
    answer: exercise.answer,
    difficulty: exercise.difficulty ?? 1,
  };
}

function readJson<T>(baseDir: string, fileName: string): T {
  assertNoPathTraversal(fileName, `file ${fileName}`);
  const filePath = join(baseDir, fileName);
  assertExists(filePath, `file ${relative(join(__dirname, '..'), filePath)}`);
  return JSON.parse(readFileSync(filePath, 'utf8')) as T;
}

function assertExists(path: string, label: string) {
  if (!existsSync(path)) {
    throw new Error(`Missing lesson data ${label}`);
  }
}

function assertArray(value: unknown, filePath: string, field: string): asserts value is unknown[] {
  if (!Array.isArray(value)) {
    throw new Error(`Invalid lesson data: ${filePath} ${field} must be an array`);
  }
}

function assertPlainObject(
  value: unknown,
  filePath: string,
  field: string,
): asserts value is Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error(`Invalid lesson data: ${filePath} ${field} must be an object`);
  }
}

function assertString(value: unknown, filePath: string, field: string): asserts value is string {
  if (typeof value !== 'string' || value.length === 0) {
    throw new Error(`Invalid lesson data: ${filePath} ${field} must be a non-empty string`);
  }
}

function requiredString(value: unknown, filePath: string, field: string): string {
  assertString(value, filePath, field);
  return value;
}

function optionalString(value: unknown, filePath: string, field: string): string | undefined {
  if (value === undefined) return undefined;
  assertString(value, filePath, field);
  return value;
}

function requiredNumber(value: unknown, filePath: string, field: string): number {
  if (!Number.isInteger(value)) {
    throw new Error(`Invalid lesson data: ${filePath} ${field} must be an integer`);
  }
  return value;
}

function optionalNumber(value: unknown, filePath: string, field: string): number | undefined {
  if (value === undefined) return undefined;
  return requiredNumber(value, filePath, field);
}

function optionalBoolean(value: unknown, filePath: string, field: string): boolean | undefined {
  if (value === undefined) return undefined;
  if (typeof value !== 'boolean') {
    throw new Error(`Invalid lesson data: ${filePath} ${field} must be a boolean`);
  }
  return value;
}

function assertUniqueOrder(items: Array<{ orderIndex: number }>, filePath: string, field: string) {
  const seen = new Set<number>();
  for (const item of items) {
    const orderIndex = requiredNumber(item.orderIndex, filePath, `${field}.orderIndex`);
    if (seen.has(orderIndex)) {
      throw new Error(`Invalid lesson data: duplicate orderIndex ${orderIndex} in ${filePath}`);
    }
    seen.add(orderIndex);
  }
}

function assertNoPathTraversal(value: string, field: string) {
  if (value.includes('..') || value.startsWith('/') || value.startsWith('\\')) {
    throw new Error(`Invalid lesson data path for ${field}: ${value}`);
  }
}
