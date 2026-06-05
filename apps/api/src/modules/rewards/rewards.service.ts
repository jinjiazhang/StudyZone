import { Injectable } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { recoverHearts, HEART_RECOVERY_INTERVAL_MINUTES } from '@studyzone/shared-logic';
import { PrismaService } from '../../infra/prisma.service';

/** Minutes per regenerated heart, overridable via env for tuning/tests. */
export function heartRecoveryMinutes(): number {
  const raw = Number(process.env.HEART_RECOVERY_MINUTES);
  return Number.isFinite(raw) && raw > 0 ? raw : HEART_RECOVERY_INTERVAL_MINUTES;
}

/**
 * Centralized writer for the user "economy": XP, gems, hearts, streak freezes.
 * Other modules (quests, learning, league settlement, ...) call into this
 * service so XP ledger entries and wallet updates stay consistent.
 */
@Injectable()
export class RewardsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Apply any pending timed heart regeneration for one user (lazy, on-read).
   * Returns the up-to-date wallet, persisting only when hearts actually changed.
   */
  async syncHearts(userId: string) {
    const wallet = await this.prisma.userWallet.findUnique({ where: { userId } });
    if (!wallet) return null;

    const result = recoverHearts({
      hearts: wallet.hearts,
      maxHearts: wallet.maxHearts,
      heartsUpdatedAt: wallet.heartsUpdatedAt,
      intervalMinutes: heartRecoveryMinutes(),
    });
    if (result.recovered <= 0) return wallet;

    return this.prisma.userWallet.update({
      where: { userId },
      data: { hearts: result.hearts, heartsUpdatedAt: result.heartsUpdatedAt },
    });
  }

  /**
   * Periodic batch top-up (called by the worker). Regenerates hearts for every
   * wallet currently below its max and returns how many wallets were updated.
   */
  async recoverAllHearts(): Promise<number> {
    const intervalMinutes = heartRecoveryMinutes();
    const due = await this.prisma.$queryRaw<
      { userId: string; hearts: number; maxHearts: number; heartsUpdatedAt: Date }[]
    >`SELECT "userId", hearts, "maxHearts", "heartsUpdatedAt" FROM "UserWallet" WHERE hearts < "maxHearts"`;

    let updated = 0;
    for (const wallet of due) {
      const result = recoverHearts({
        hearts: wallet.hearts,
        maxHearts: wallet.maxHearts,
        heartsUpdatedAt: wallet.heartsUpdatedAt,
        intervalMinutes,
      });
      if (result.recovered <= 0) continue;
      await this.prisma.userWallet.update({
        where: { userId: wallet.userId },
        data: { hearts: result.hearts, heartsUpdatedAt: result.heartsUpdatedAt },
      });
      updated += 1;
    }
    return updated;
  }

  /**
   * Atomically credit XP + gems to a user's wallet and append a reward ledger row.
   * `reason` is a short machine code (e.g. "daily_quest", "league_reward").
   */
  async awardXpAndGems(params: {
    userId: string;
    xp: number;
    gems: number;
    reason: string;
    refId?: string | null;
  }) {
    const { userId, xp, gems, reason, refId = null } = params;
    if (xp === 0 && gems === 0) return;

    await this.prisma.$transaction((tx) =>
      this.awardXpAndGemsWithClient(tx, { userId, xp, gems, reason, refId }),
    );
  }

  async awardXpAndGemsWithClient(
    client: Prisma.TransactionClient,
    params: {
      userId: string;
      xp: number;
      gems: number;
      reason: string;
      refId?: string | null;
    },
  ) {
    const { userId, xp, gems, reason, refId = null } = params;
    if (xp === 0 && gems === 0) return;

    await client.userWallet.update({
      where: { userId },
      data: {
        ...(xp ? { xpTotal: { increment: xp } } : {}),
        ...(gems ? { gems: { increment: gems } } : {}),
      },
    });

    await client.xPLedger.create({
      data: { userId, delta: xp, reason, refId },
    });
  }
}
