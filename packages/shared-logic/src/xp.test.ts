import { describe, expect, it } from 'vitest';

import { calculateLessonScore } from './xp';
import { xpToLevel } from './level';

describe('calculateLessonScore', () => {
  it('awards no XP or gems for failed lessons', () => {
    expect(
      calculateLessonScore({
        totalExercises: 10,
        correctCount: 5,
        timeSpentMs: 60_000,
        currentStreak: 0,
      }),
    ).toMatchObject({ totalXp: 0, gems: 0 });
  });

  it('includes perfect, speed, and streak bonuses for strong lessons', () => {
    expect(
      calculateLessonScore({
        totalExercises: 10,
        correctCount: 10,
        timeSpentMs: 60_000,
        currentStreak: 14,
      }),
    ).toEqual({
      baseXp: 10,
      perfectBonus: 5,
      speedBonus: 5,
      streakBonus: 4,
      totalXp: 24,
      gems: 3,
    });
  });
});

describe('xpToLevel', () => {
  it('maps cumulative XP onto level progress', () => {
    expect(xpToLevel(0)).toEqual({ level: 0, xpIntoLevel: 0, xpForNextLevel: 100 });
    expect(xpToLevel(100)).toEqual({ level: 1, xpIntoLevel: 0, xpForNextLevel: 200 });
    expect(xpToLevel(250)).toEqual({ level: 1, xpIntoLevel: 150, xpForNextLevel: 200 });
  });
});
