/**
 * XP -> level mapping. Same curve client and server use to render the
 * progress bar / detect level-ups.
 *
 * Curve: each level requires `100 * level` XP, cumulative.
 * Level 1: 100 XP total
 * Level 2: 300 XP total
 * Level 3: 600 XP total
 * Level n: 100 * n * (n+1) / 2 total
 */

export interface LevelInfo {
  level: number;
  xpIntoLevel: number;
  xpForNextLevel: number;
}

export function xpToLevel(xp: number): LevelInfo {
  if (xp < 0) xp = 0;
  let level = 0;
  let totalForLevel = 0;
  // Linear scan up to a reasonable cap is fine; could be O(1) with quadratic
  // formula, but levels rarely exceed a few hundred.
  while (true) {
    const nextThreshold = totalForLevel + 100 * (level + 1);
    if (xp < nextThreshold) {
      return {
        level,
        xpIntoLevel: xp - totalForLevel,
        xpForNextLevel: 100 * (level + 1),
      };
    }
    totalForLevel = nextThreshold;
    level += 1;
    if (level > 1000) {
      // Safety cap.
      return { level, xpIntoLevel: 0, xpForNextLevel: 100 * (level + 1) };
    }
  }
}
