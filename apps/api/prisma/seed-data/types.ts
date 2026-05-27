export interface SeedExercise {
  type: string;
  prompt: Record<string, unknown>;
  answer: Record<string, unknown>;
  difficulty?: number;
}

export interface SeedLesson {
  orderIndex: number;
  title: string;
  icon: string;
  exercises: SeedExercise[];
}

export interface SeedUnit {
  orderIndex: number;
  title: string;
  themeColor: string;
  lessons: SeedLesson[];
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
