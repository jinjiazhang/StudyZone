/**
 * Hearts regeneration. Pure function — same input, same output — so the API
 * (lazy recovery on read), the worker (periodic batch top-up), and clients
 * (countdown display) all agree on how many hearts a user should have.
 *
 * Model: a user regenerates one heart every `intervalMinutes`. `heartsUpdatedAt`
 * is the anchor the next regeneration is measured from. While a user is at full
 * hearts the clock is irrelevant; it (re)starts the moment a heart is spent.
 */

export const HEART_RECOVERY_INTERVAL_MINUTES = 1;

export interface HeartRecoveryInput {
  hearts: number;
  maxHearts: number;
  /** Anchor for the next regeneration (the last time hearts changed). */
  heartsUpdatedAt: Date | string | number;
  /** Defaults to Date.now(). */
  now?: Date | string | number;
  /** Minutes per regenerated heart. Defaults to HEART_RECOVERY_INTERVAL_MINUTES. */
  intervalMinutes?: number;
}

export interface HeartRecoveryOutput {
  hearts: number;
  /** Advanced anchor to persist. */
  heartsUpdatedAt: Date;
  /** How many hearts were regenerated (0 means nothing to persist). */
  recovered: number;
  /** When the next heart will be restored, or null if already full. */
  nextHeartAt: Date | null;
}

export function recoverHearts(input: HeartRecoveryInput): HeartRecoveryOutput {
  const { hearts, maxHearts } = input;
  const intervalMs = (input.intervalMinutes ?? HEART_RECOVERY_INTERVAL_MINUTES) * 60_000;
  const now = input.now != null ? new Date(input.now).getTime() : Date.now();
  const anchor = new Date(input.heartsUpdatedAt).getTime();

  if (hearts >= maxHearts || intervalMs <= 0) {
    return {
      hearts,
      heartsUpdatedAt: new Date(anchor),
      recovered: 0,
      nextHeartAt: null,
    };
  }

  const elapsed = Math.max(0, now - anchor);
  const ticks = Math.floor(elapsed / intervalMs);
  const recovered = Math.min(ticks, maxHearts - hearts);
  const newHearts = hearts + recovered;

  // Advance the anchor by the intervals we consumed (preserving the remainder);
  // once full, the clock stops, so just park it at `now`.
  const newAnchor = newHearts >= maxHearts ? now : anchor + recovered * intervalMs;
  const nextHeartAt = newHearts >= maxHearts ? null : new Date(newAnchor + intervalMs);

  return {
    hearts: newHearts,
    heartsUpdatedAt: new Date(newAnchor),
    recovered,
    nextHeartAt,
  };
}
