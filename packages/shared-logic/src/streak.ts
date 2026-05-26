/**
 * Streak (consecutive learning days) computation.
 * Boundaries are based on the user's local timezone — caller must pass
 * dates already normalized to the user's day.
 */

export interface StreakUpdateInput {
  /** ISO date string YYYY-MM-DD for the day the user just finished a lesson. */
  todayLocalDate: string;
  /** Last active local date, or null if first ever lesson. */
  lastActiveLocalDate: string | null;
  currentStreak: number;
  /** Freezes available (consume to maintain streak across a missed day). */
  streakFreezes: number;
}

export interface StreakUpdateOutput {
  newStreak: number;
  advanced: boolean;
  freezeConsumed: boolean;
  newLastActiveLocalDate: string;
  newStreakFreezes: number;
}

function daysBetween(a: string, b: string): number {
  const da = new Date(a + 'T00:00:00Z').getTime();
  const db = new Date(b + 'T00:00:00Z').getTime();
  return Math.round((db - da) / 86_400_000);
}

export function updateStreak(input: StreakUpdateInput): StreakUpdateOutput {
  const { todayLocalDate, lastActiveLocalDate, currentStreak, streakFreezes } = input;

  // First lesson ever.
  if (!lastActiveLocalDate) {
    return {
      newStreak: 1,
      advanced: true,
      freezeConsumed: false,
      newLastActiveLocalDate: todayLocalDate,
      newStreakFreezes: streakFreezes,
    };
  }

  const gap = daysBetween(lastActiveLocalDate, todayLocalDate);

  if (gap <= 0) {
    // Same day or earlier — no advance.
    return {
      newStreak: currentStreak,
      advanced: false,
      freezeConsumed: false,
      newLastActiveLocalDate: lastActiveLocalDate,
      newStreakFreezes: streakFreezes,
    };
  }

  if (gap === 1) {
    return {
      newStreak: currentStreak + 1,
      advanced: true,
      freezeConsumed: false,
      newLastActiveLocalDate: todayLocalDate,
      newStreakFreezes: streakFreezes,
    };
  }

  // gap === 2 with at least one freeze: consume one and continue.
  if (gap === 2 && streakFreezes > 0) {
    return {
      newStreak: currentStreak + 1,
      advanced: true,
      freezeConsumed: true,
      newLastActiveLocalDate: todayLocalDate,
      newStreakFreezes: streakFreezes - 1,
    };
  }

  // Streak broken.
  return {
    newStreak: 1,
    advanced: true,
    freezeConsumed: false,
    newLastActiveLocalDate: todayLocalDate,
    newStreakFreezes: streakFreezes,
  };
}
