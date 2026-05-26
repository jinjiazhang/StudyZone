/**
 * Spaced Repetition (SM-2 inspired).
 * Each card has: interval (days until next review), ease (multiplier),
 * and a due-date.
 */

export interface SrsCardState {
  intervalDays: number;
  ease: number; // typically 1.3 ~ 2.8
  /** Consecutive correct count. */
  streak: number;
}

export interface SrsReviewInput extends SrsCardState {
  /** 0..5 quality. 0 = total blackout, 5 = perfect. */
  quality: number;
}

export const INITIAL_SRS: SrsCardState = {
  intervalDays: 0,
  ease: 2.5,
  streak: 0,
};

export function reviewCard(input: SrsReviewInput): SrsCardState {
  const { quality } = input;
  let { intervalDays, ease, streak } = input;

  if (quality < 3) {
    // Failed — restart, but keep some ease memory.
    streak = 0;
    intervalDays = 1;
  } else {
    streak += 1;
    if (streak === 1) intervalDays = 1;
    else if (streak === 2) intervalDays = 3;
    else intervalDays = Math.round(intervalDays * ease);
  }

  // Update ease (SM-2 formula).
  ease = ease + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
  if (ease < 1.3) ease = 1.3;
  if (ease > 2.8) ease = 2.8;

  return { intervalDays, ease, streak };
}

export function nextDueAt(now: Date, intervalDays: number): Date {
  const d = new Date(now);
  d.setUTCDate(d.getUTCDate() + intervalDays);
  return d;
}
