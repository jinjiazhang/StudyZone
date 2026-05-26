import { describe, expect, it } from 'vitest';

import { INITIAL_SRS, nextDueAt, reviewCard } from './srs';

describe('reviewCard', () => {
  it('starts a new correct streak with a one-day interval', () => {
    expect(reviewCard({ ...INITIAL_SRS, quality: 5 })).toEqual({
      intervalDays: 1,
      ease: 2.6,
      streak: 1,
    });
  });

  it('resets the streak on failed recall while preserving a bounded ease', () => {
    const result = reviewCard({
      intervalDays: 12,
      ease: 1.35,
      streak: 4,
      quality: 2,
    });

    expect(result.intervalDays).toBe(1);
    expect(result.streak).toBe(0);
    expect(result.ease).toBeGreaterThanOrEqual(1.3);
  });
});

describe('nextDueAt', () => {
  it('adds intervals in UTC days', () => {
    expect(nextDueAt(new Date('2026-05-26T12:00:00Z'), 3).toISOString()).toBe(
      '2026-05-29T12:00:00.000Z',
    );
  });
});
