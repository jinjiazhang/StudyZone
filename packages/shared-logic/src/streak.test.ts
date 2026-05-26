import { describe, expect, it } from 'vitest';

import { updateStreak } from './streak';

describe('updateStreak', () => {
  it('starts at one on the first active day', () => {
    expect(
      updateStreak({
        todayLocalDate: '2026-05-26',
        lastActiveLocalDate: null,
        currentStreak: 0,
        streakFreezes: 1,
      }),
    ).toEqual({
      newStreak: 1,
      advanced: true,
      freezeConsumed: false,
      newLastActiveLocalDate: '2026-05-26',
      newStreakFreezes: 1,
    });
  });

  it('does not advance twice on the same local day', () => {
    expect(
      updateStreak({
        todayLocalDate: '2026-05-26',
        lastActiveLocalDate: '2026-05-26',
        currentStreak: 5,
        streakFreezes: 0,
      }).advanced,
    ).toBe(false);
  });

  it('consumes one freeze for a single missed day', () => {
    expect(
      updateStreak({
        todayLocalDate: '2026-05-28',
        lastActiveLocalDate: '2026-05-26',
        currentStreak: 5,
        streakFreezes: 2,
      }),
    ).toMatchObject({
      newStreak: 6,
      advanced: true,
      freezeConsumed: true,
      newStreakFreezes: 1,
    });
  });

  it('breaks the streak after a larger gap', () => {
    expect(
      updateStreak({
        todayLocalDate: '2026-05-30',
        lastActiveLocalDate: '2026-05-26',
        currentStreak: 5,
        streakFreezes: 2,
      }).newStreak,
    ).toBe(1);
  });
});
