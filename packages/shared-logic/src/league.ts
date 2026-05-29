/**
 * League / weekly-leaderboard rules. Pure functions — same input, same output —
 * so they're shared between the API (authoritative settlement), the worker
 * (scheduled settlement), and clients (zone previews).
 *
 * Model (Duolingo-like):
 *   - Players are bucketed into groups of up to LEAGUE_GROUP_CAPACITY.
 *   - Each week, within a group, the top LEAGUE_PROMOTE_COUNT players move up a
 *     tier and the bottom LEAGUE_DEMOTE_COUNT move down a tier.
 *   - The lowest tier never demotes; the highest tier never promotes.
 */

import { LeagueTier, LEAGUE_TIER_ORDER } from '@studyzone/shared-types';

/** Max players per league group. */
export const LEAGUE_GROUP_CAPACITY = 30;
/** Top N players in a group promote to the next tier. */
export const LEAGUE_PROMOTE_COUNT = 7;
/** Bottom N players in a group demote to the previous tier. */
export const LEAGUE_DEMOTE_COUNT = 5;

export type LeagueResult = 'promoted' | 'stayed' | 'demoted';

/** True if a tier is the lowest (no demotion possible). */
export function isLowestTier(tier: LeagueTier): boolean {
  return LEAGUE_TIER_ORDER.indexOf(tier) <= 0;
}

/** True if a tier is the highest (no promotion possible). */
export function isHighestTier(tier: LeagueTier): boolean {
  return LEAGUE_TIER_ORDER.indexOf(tier) >= LEAGUE_TIER_ORDER.length - 1;
}

/** The tier one step up, or the same tier if already at the top. */
export function nextTierUp(tier: LeagueTier): LeagueTier {
  const i = LEAGUE_TIER_ORDER.indexOf(tier);
  return LEAGUE_TIER_ORDER[Math.min(i + 1, LEAGUE_TIER_ORDER.length - 1)] ?? tier;
}

/** The tier one step down, or the same tier if already at the bottom. */
export function nextTierDown(tier: LeagueTier): LeagueTier {
  const i = LEAGUE_TIER_ORDER.indexOf(tier);
  return LEAGUE_TIER_ORDER[Math.max(i - 1, 0)] ?? tier;
}

/**
 * How many of a group promote / demote, clamped so the two zones never
 * overlap in a small or partially-filled group.
 */
export function zoneCounts(
  tier: LeagueTier,
  groupSize: number,
): { promoteCount: number; demoteCount: number } {
  const promoteCount = isHighestTier(tier) ? 0 : Math.min(LEAGUE_PROMOTE_COUNT, groupSize);
  let demoteCount = isLowestTier(tier) ? 0 : Math.min(LEAGUE_DEMOTE_COUNT, groupSize);
  // Never let the promotion and demotion zones overlap.
  if (promoteCount + demoteCount > groupSize) {
    demoteCount = Math.max(0, groupSize - promoteCount);
  }
  return { promoteCount, demoteCount };
}

/**
 * Classify a 1-based rank within a group into a settlement result.
 * Players with zero weekly XP are treated as inactive and always demoted
 * (when demotion is possible).
 */
export function classifyResult(
  tier: LeagueTier,
  rank: number,
  groupSize: number,
  weeklyXp: number,
): LeagueResult {
  const { promoteCount, demoteCount } = zoneCounts(tier, groupSize);
  if (promoteCount > 0 && rank <= promoteCount && weeklyXp > 0) return 'promoted';
  if (demoteCount > 0 && (rank > groupSize - demoteCount || weeklyXp <= 0)) return 'demoted';
  return 'stayed';
}

/** The tier a player lands in next week, given their result this week. */
export function resolveNextTier(tier: LeagueTier, result: LeagueResult): LeagueTier {
  if (result === 'promoted') return nextTierUp(tier);
  if (result === 'demoted') return nextTierDown(tier);
  return tier;
}

/**
 * Gem reward granted at settlement. Higher tiers and better placements pay
 * more; promotion is rewarded, demotion is not.
 */
export function settlementGemReward(
  tier: LeagueTier,
  rank: number,
  result: LeagueResult,
): number {
  const tierIndex = LEAGUE_TIER_ORDER.indexOf(tier);
  const tierBonus = Math.max(0, tierIndex) * 10;
  let base = 0;
  if (rank === 1) base = 100;
  else if (rank === 2) base = 50;
  else if (rank === 3) base = 30;
  else if (result === 'promoted') base = 20;
  else if (result === 'stayed') base = 5;
  return base > 0 ? base + tierBonus : 0;
}

/**
 * Given the descending-sorted weekly XP of a group, the XP value at the
 * promotion cutoff (the weekly XP of the last promoting slot). Null when the
 * tier can't promote.
 */
export function promotionCutoffXp(tier: LeagueTier, sortedDescXp: number[]): number | null {
  const { promoteCount } = zoneCounts(tier, sortedDescXp.length);
  if (promoteCount <= 0) return null;
  return sortedDescXp[promoteCount - 1] ?? 0;
}

/**
 * The XP value at the demotion cutoff (the weekly XP of the highest demoting
 * slot). Null when the tier can't demote.
 */
export function demotionCutoffXp(tier: LeagueTier, sortedDescXp: number[]): number | null {
  const size = sortedDescXp.length;
  const { demoteCount } = zoneCounts(tier, size);
  if (demoteCount <= 0) return null;
  return sortedDescXp[size - demoteCount] ?? 0;
}
