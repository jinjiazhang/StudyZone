import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../infra/prisma.service';

/**
 * Centralized writer for the user "economy": XP, gems, hearts, streak freezes.
 * Other modules (quests, learning, league settlement, ...) call into this
 * service so XP ledger entries and wallet updates stay consistent.
 */
@Injectable()
export class RewardsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Atomically credit XP + gems to a user's wallet and append an XP ledger row.
   * `reason` is a short machine code (e.g. "daily_quest", "lesson_complete").
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

    await this.prisma.$transaction([
      this.prisma.userWallet.update({
        where: { userId },
        data: {
          ...(xp ? { xpTotal: { increment: xp } } : {}),
          ...(gems ? { gems: { increment: gems } } : {}),
        },
      }),
      ...(xp
        ? [
            this.prisma.xPLedger.create({
              data: { userId, delta: xp, reason, refId },
            }),
          ]
        : []),
    ]);
  }
}
