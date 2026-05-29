import { describe, it, expect } from 'vitest';
import {
  classifyResult,
  resolveNextTier,
  zoneCounts,
  promotionCutoffXp,
  demotionCutoffXp,
  settlementGemReward,
  isLowestTier,
  isHighestTier,
} from './league';
import { LeagueTier } from '@studyzone/shared-types';

describe('league rules', () => {
  it('lowest tier never demotes', () => {
    expect(isLowestTier(LeagueTier.BRONZE)).toBe(true);
    const { demoteCount } = zoneCounts(LeagueTier.BRONZE, 30);
    expect(demoteCount).toBe(0);
  });

  it('highest tier never promotes', () => {
    expect(isHighestTier(LeagueTier.DIAMOND)).toBe(true);
    const { promoteCount } = zoneCounts(LeagueTier.DIAMOND, 30);
    expect(promoteCount).toBe(0);
  });

  it('classifies promotion / demotion / stay', () => {
    expect(classifyResult(LeagueTier.GOLD, 1, 30, 500)).toBe('promoted');
    expect(classifyResult(LeagueTier.GOLD, 15, 30, 200)).toBe('stayed');
    expect(classifyResult(LeagueTier.GOLD, 30, 30, 10)).toBe('demoted');
  });

  it('treats zero weekly XP as demotion', () => {
    expect(classifyResult(LeagueTier.GOLD, 10, 30, 0)).toBe('demoted');
  });

  it('zones never overlap in tiny groups', () => {
    const { promoteCount, demoteCount } = zoneCounts(LeagueTier.GOLD, 4);
    expect(promoteCount + demoteCount).toBeLessThanOrEqual(4);
  });

  it('resolves the next tier', () => {
    expect(resolveNextTier(LeagueTier.SILVER, 'promoted')).toBe(LeagueTier.GOLD);
    expect(resolveNextTier(LeagueTier.SILVER, 'demoted')).toBe(LeagueTier.BRONZE);
    expect(resolveNextTier(LeagueTier.SILVER, 'stayed')).toBe(LeagueTier.SILVER);
  });

  it('computes promotion / demotion cutoffs', () => {
    const sorted = Array.from({ length: 30 }, (_, i) => (30 - i) * 10); // 300..10
    expect(promotionCutoffXp(LeagueTier.GOLD, sorted)).toBe(sorted[6]);
    expect(demotionCutoffXp(LeagueTier.GOLD, sorted)).toBe(sorted[25]);
    expect(promotionCutoffXp(LeagueTier.DIAMOND, sorted)).toBeNull();
    expect(demotionCutoffXp(LeagueTier.BRONZE, sorted)).toBeNull();
  });

  it('rewards top ranks and promotions', () => {
    expect(settlementGemReward(LeagueTier.GOLD, 1, 'promoted')).toBeGreaterThan(
      settlementGemReward(LeagueTier.GOLD, 5, 'promoted'),
    );
    expect(settlementGemReward(LeagueTier.GOLD, 25, 'demoted')).toBe(0);
  });
});
