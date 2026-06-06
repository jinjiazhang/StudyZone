import { describe, expect, it } from 'vitest';

import { recoverHearts, HEART_RECOVERY_INTERVAL_MINUTES } from './hearts';

const INTERVAL = HEART_RECOVERY_INTERVAL_MINUTES;
const base = new Date('2026-06-05T10:00:00Z');
const minutesLater = (n: number) => new Date(base.getTime() + n * 60_000);

describe('recoverHearts', () => {
  it('defaults to recovering one heart per minute', () => {
    expect(HEART_RECOVERY_INTERVAL_MINUTES).toBe(1);
  });

  it('returns no change when already at max', () => {
    const r = recoverHearts({ hearts: 5, maxHearts: 5, heartsUpdatedAt: base, now: minutesLater(999) });
    expect(r).toMatchObject({ hearts: 5, recovered: 0, nextHeartAt: null });
  });

  it('regenerates one heart per interval, capped at max', () => {
    const r = recoverHearts({
      hearts: 2,
      maxHearts: 5,
      heartsUpdatedAt: base,
      now: minutesLater(INTERVAL * 2 + INTERVAL * 0.3), // 2 full intervals + remainder
    });
    expect(r.hearts).toBe(4);
    expect(r.recovered).toBe(2);
    // Anchor advanced by the 2 consumed intervals, remainder preserved.
    expect(r.heartsUpdatedAt.getTime()).toBe(base.getTime() + INTERVAL * 2 * 60_000);
  });

  it('never exceeds max even after a long absence and stops the clock', () => {
    const r = recoverHearts({
      hearts: 1,
      maxHearts: 5,
      heartsUpdatedAt: base,
      now: minutesLater(INTERVAL * 100),
    });
    expect(r.hearts).toBe(5);
    expect(r.recovered).toBe(4);
    expect(r.nextHeartAt).toBeNull();
  });

  it('reports nextHeartAt without recovering before a full interval elapses', () => {
    const r = recoverHearts({
      hearts: 3,
      maxHearts: 5,
      heartsUpdatedAt: base,
      now: minutesLater(INTERVAL * 0.5), // less than one full interval
    });
    expect(r.recovered).toBe(0);
    expect(r.hearts).toBe(3);
    expect(r.nextHeartAt?.getTime()).toBe(base.getTime() + INTERVAL * 60_000);
  });
});
