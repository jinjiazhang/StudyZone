import { beforeEach, describe, expect, it, vi } from 'vitest';

import { RewardsService } from './rewards.service';
import { PrismaService } from '../../infra/prisma.service';

describe('RewardsService.syncHearts', () => {
  let prisma: {
    userWallet: { findUnique: ReturnType<typeof vi.fn>; update: ReturnType<typeof vi.fn> };
  };
  let service: RewardsService;

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-06-05T12:00:00Z'));
    process.env.HEART_RECOVERY_MINUTES = '20';
    prisma = {
      userWallet: { findUnique: vi.fn(), update: vi.fn() },
    };
    service = new RewardsService(prisma as unknown as PrismaService);
  });

  it('persists regenerated hearts when enough time has elapsed', async () => {
    prisma.userWallet.findUnique.mockResolvedValue({
      userId: 'user-1',
      hearts: 2,
      maxHearts: 5,
      heartsUpdatedAt: new Date('2026-06-05T11:00:00Z'), // 60 min ago → +3 (capped → +3 to 5)
    });
    prisma.userWallet.update.mockResolvedValue({ userId: 'user-1', hearts: 5 });

    await service.syncHearts('user-1');

    expect(prisma.userWallet.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { userId: 'user-1' },
        data: expect.objectContaining({ hearts: 5 }),
      }),
    );
  });

  it('does not write when no full interval has elapsed', async () => {
    prisma.userWallet.findUnique.mockResolvedValue({
      userId: 'user-1',
      hearts: 4,
      maxHearts: 5,
      heartsUpdatedAt: new Date('2026-06-05T11:55:00Z'), // 5 min ago
    });

    const result = await service.syncHearts('user-1');

    expect(prisma.userWallet.update).not.toHaveBeenCalled();
    expect(result).toMatchObject({ hearts: 4 });
  });
});
