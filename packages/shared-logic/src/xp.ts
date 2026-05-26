/**
 * XP calculation rules. Pure functions — same input, same output —
 * so they're trivially testable and shareable between client (for previews)
 * and server (for authoritative scoring).
 */

export interface LessonScoreInput {
  totalExercises: number;
  correctCount: number;
  /** Total time spent in the session in milliseconds. */
  timeSpentMs: number;
  /** User's current streak length BEFORE this lesson. */
  currentStreak: number;
  /** Whether the user is a paying subscriber (slight boost). */
  isSubscriber?: boolean;
}

export interface LessonScoreOutput {
  baseXp: number;
  perfectBonus: number;
  speedBonus: number;
  streakBonus: number;
  totalXp: number;
  gems: number;
}

const BASE_XP_PER_LESSON = 10;
const PERFECT_BONUS = 5;
const SPEED_THRESHOLD_MS = 90_000; // sub-90s gets speed bonus
const SPEED_BONUS = 5;
const STREAK_BONUS_PER_7 = 2; // every 7 days of streak adds 2 XP
const SUBSCRIBER_MULT = 1.2;

export function calculateLessonScore(input: LessonScoreInput): LessonScoreOutput {
  const accuracy = input.totalExercises > 0 ? input.correctCount / input.totalExercises : 0;
  const passed = accuracy >= 0.6;

  if (!passed) {
    return {
      baseXp: 0,
      perfectBonus: 0,
      speedBonus: 0,
      streakBonus: 0,
      totalXp: 0,
      gems: 0,
    };
  }

  const baseXp = BASE_XP_PER_LESSON;
  const perfectBonus = input.correctCount === input.totalExercises ? PERFECT_BONUS : 0;
  const speedBonus = input.timeSpentMs <= SPEED_THRESHOLD_MS ? SPEED_BONUS : 0;
  const streakBonus = Math.floor(input.currentStreak / 7) * STREAK_BONUS_PER_7;

  let totalXp = baseXp + perfectBonus + speedBonus + streakBonus;
  if (input.isSubscriber) {
    totalXp = Math.round(totalXp * SUBSCRIBER_MULT);
  }

  // Gems: 1 per lesson, +2 for perfect
  const gems = 1 + (perfectBonus > 0 ? 2 : 0);

  return { baseXp, perfectBonus, speedBonus, streakBonus, totalXp, gems };
}
