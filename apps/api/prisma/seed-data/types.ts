export interface SeedExercise {
  type: string;
  prompt: Record<string, unknown>;
  answer: Record<string, unknown>;
  difficulty?: number;
}

export interface SeedLesson {
  level: number;
  orderIndex: number;
  exercises: SeedExercise[];
}

export interface SeedSkill {
  orderIndex: number;
  name: string;
  icon: string;
  maxLevel?: number;
  lessons: SeedLesson[];
}

export interface SeedUnit {
  orderIndex: number;
  title: string;
  themeColor: string;
  skills: SeedSkill[];
}

export interface SeedCourseContent {
  units: SeedUnit[];
}

export function ex(
  type: string,
  prompt: Record<string, unknown>,
  answer: Record<string, unknown>,
  difficulty = 1,
): SeedExercise {
  return { type, prompt: { type, ...prompt }, answer, difficulty };
}
