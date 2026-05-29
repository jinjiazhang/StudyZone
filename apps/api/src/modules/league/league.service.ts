import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../infra/prisma.service';
import {
  LeagueTier,
  type LeagueStandingDto,
  type LeagueEntryDto,
  type LeagueHistoryItemDto,
  type LeagueResultType,
} from '@studyzone/shared-types';
import {
  LEAGUE_GROUP_CAPACITY,
  classifyResult,
  resolveNextTier,
  zoneCounts,
  settlementGemReward,
} from '@studyzone/shared-logic';
import { startOfWeek, startOfPreviousWeek, addDays } from './league.util';

@Injectable()
export class LeagueService {
  private readonly logger = new Logger('LeagueService');

  constructor(private readonly prisma: PrismaService) {}

  // ===========================================================================
  // Placement & live XP
  // ===========================================================================

  /**
   * The tier a user should compete in this week. Derived from their most recent
   * settled history (the tier they were promoted/demoted/held into). New users
   * start in bronze.
   */
  private async resolvePlacementTier(userId: string): Promise<LeagueTier> {
    const last = await this.prisma.leagueHistory.findFirst({
      where: { userId },
      orderBy: { weekStart: 'desc' },
    });
    return (last?.nextTier as LeagueTier) ?? LeagueTier.BRONZE;
  }

  /**
   * Ensure the user has an entry for the current week, assigning them to a
   * non-full group of their placement tier (or creating a fresh one). Returns
   * the entry's groupId.
   */
  async ensureEntry(userId: string, now = new Date()): Promise<string> {
    const weekStart = startOfWeek(now);

    const existing = await this.prisma.leaderboardEntry.findFirst({
      where: { userId, group: { weekStart } },
    });
    if (existing) return existing.groupId;

    const tier = await this.resolvePlacementTier(userId);

    // Find an active, non-full group of this tier for the week.
    const candidates = await this.prisma.leagueGroup.findMany({
      where: { tier, weekStart, status: 'active' },
      include: { _count: { select: { entries: true } } },
      orderBy: { id: 'asc' },
    });
    let group = candidates.find((g) => g._count.entries < g.capacity);

    if (!group) {
      group = {
        ...(await this.prisma.leagueGroup.create({
          data: { tier, weekStart, capacity: LEAGUE_GROUP_CAPACITY, status: 'active' },
        })),
        _count: { entries: 0 },
      } as (typeof candidates)[number];
    }

    try {
      await this.prisma.leaderboardEntry.create({
        data: { groupId: group.id, userId, weeklyXp: 0, rank: 0 },
      });
    } catch {
      // Race: another request created the entry first. Re-read.
      const e = await this.prisma.leaderboardEntry.findFirst({
        where: { userId, group: { weekStart } },
      });
      if (e) return e.groupId;
      throw new Error('failed to assign league entry');
    }

    await this.recomputeRanks(group.id);
    return group.id;
  }

  /** Add weekly XP for a user, assigning a group if needed, then refresh ranks. */
  async addWeeklyXp(userId: string, delta: number, now = new Date()): Promise<void> {
    if (delta <= 0) return;
    const groupId = await this.ensureEntry(userId, now);
    await this.prisma.leaderboardEntry.update({
      where: { groupId_userId: { groupId, userId } },
      data: { weeklyXp: { increment: delta } },
    });
    await this.recomputeRanks(groupId);
  }

  /** Recompute and persist 1-based ranks for every entry in a group. */
  async recomputeRanks(groupId: string): Promise<void> {
    const entries = await this.prisma.leaderboardEntry.findMany({
      where: { groupId },
      orderBy: [{ weeklyXp: 'desc' }, { joinedAt: 'asc' }],
    });
    await this.prisma.$transaction(
      entries.map((e, idx) =>
        this.prisma.leaderboardEntry.update({
          where: { groupId_userId: { groupId, userId: e.userId } },
          data: { rank: idx + 1 },
        }),
      ),
    );
  }

  // ===========================================================================
  // Standings (client)
  // ===========================================================================

  async myLeague(userId: string, now = new Date()): Promise<LeagueStandingDto> {
    const weekStart = startOfWeek(now);
    const weekEnd = addDays(weekStart, 7);

    const myEntry = await this.prisma.leaderboardEntry.findFirst({
      where: { userId, group: { weekStart } },
      include: {
        group: {
          include: {
            entries: {
              include: { user: true },
              orderBy: [{ weeklyXp: 'desc' }, { joinedAt: 'asc' }],
            },
          },
        },
      },
    });

    if (!myEntry) {
      return {
        leagueId: '',
        tier: LeagueTier.BRONZE,
        weekStart: weekStart.toISOString(),
        weekEnd: weekEnd.toISOString(),
        selfIndex: -1,
        groupSize: 0,
        promoteCount: 0,
        demoteCount: 0,
        entries: [],
      };
    }

    const tier = myEntry.group.tier as LeagueTier;
    const groupEntries = myEntry.group.entries;
    const groupSize = groupEntries.length;
    const { promoteCount, demoteCount } = zoneCounts(tier, groupSize);

    const entries: LeagueEntryDto[] = groupEntries.map((e, idx) => {
      const rank = idx + 1;
      return {
        rank,
        user: {
          id: e.user.id,
          nickname: e.user.nickname,
          avatarUrl: e.user.avatarUrl,
          locale: e.user.locale as LeagueEntryDto['user']['locale'],
          createdAt: e.user.createdAt.toISOString(),
        },
        weeklyXp: e.weeklyXp,
        zone: classifyResult(tier, rank, groupSize, e.weeklyXp),
      };
    });

    return {
      leagueId: myEntry.group.id,
      tier,
      weekStart: myEntry.group.weekStart.toISOString(),
      weekEnd: weekEnd.toISOString(),
      selfIndex: entries.findIndex((e) => e.user.id === userId),
      groupSize,
      promoteCount,
      demoteCount,
      entries,
    };
  }

  async history(userId: string, limit = 12): Promise<LeagueHistoryItemDto[]> {
    const rows = await this.prisma.leagueHistory.findMany({
      where: { userId },
      orderBy: { weekStart: 'desc' },
      take: limit,
    });
    return rows.map((r) => ({
      weekStart: r.weekStart.toISOString(),
      tier: r.tier as LeagueTier,
      finalRank: r.finalRank,
      weeklyXp: r.weeklyXp,
      result: r.result as LeagueResultType,
      nextTier: r.nextTier as LeagueTier,
      gemsAwarded: r.gemsAwarded,
    }));
  }

  // ===========================================================================
  // Settlement
  // ===========================================================================

  /**
   * Settle every active group for the given week: rank members, decide
   * promotion/relegation, write history, award gems. Idempotent — already
   * settled groups are skipped.
   */
  async settleWeek(weekStart: Date): Promise<{
    weekStart: string;
    groupsSettled: number;
    playersSettled: number;
    promoted: number;
    demoted: number;
  }> {
    const groups = await this.prisma.leagueGroup.findMany({
      where: { weekStart, status: 'active' },
      include: {
        entries: { orderBy: [{ weeklyXp: 'desc' }, { joinedAt: 'asc' }] },
      },
    });

    let playersSettled = 0;
    let promoted = 0;
    let demoted = 0;

    for (const group of groups) {
      const tier = group.tier as LeagueTier;
      const groupSize = group.entries.length;

      await this.prisma.$transaction(async (tx) => {
        for (let i = 0; i < group.entries.length; i++) {
          const entry = group.entries[i]!;
          const rank = i + 1;
          const result = classifyResult(tier, rank, groupSize, entry.weeklyXp);
          const nextTier = resolveNextTier(tier, result);
          const gems = settlementGemReward(tier, rank, result);

          await tx.leaderboardEntry.update({
            where: { groupId_userId: { groupId: group.id, userId: entry.userId } },
            data: { rank },
          });

          await tx.leagueHistory.upsert({
            where: { userId_weekStart: { userId: entry.userId, weekStart } },
            create: {
              userId: entry.userId,
              weekStart,
              tier,
              finalRank: rank,
              weeklyXp: entry.weeklyXp,
              result,
              nextTier,
              gemsAwarded: gems,
            },
            update: {
              tier,
              finalRank: rank,
              weeklyXp: entry.weeklyXp,
              result,
              nextTier,
              gemsAwarded: gems,
            },
          });

          if (gems > 0) {
            await tx.userWallet.update({
              where: { userId: entry.userId },
              data: { gems: { increment: gems } },
            });
          }

          if (result === 'promoted') promoted++;
          else if (result === 'demoted') demoted++;
          playersSettled++;
        }

        await tx.leagueGroup.update({
          where: { id: group.id },
          data: { status: 'settled', settledAt: new Date() },
        });
      });
    }

    this.logger.log(
      `Settled ${groups.length} group(s) for week ${weekStart.toISOString()}: ` +
        `${playersSettled} players, +${promoted}/-${demoted}`,
    );

    return {
      weekStart: weekStart.toISOString(),
      groupsSettled: groups.length,
      playersSettled,
      promoted,
      demoted,
    };
  }

  /** Settle the most recently completed week (the one before the current week). */
  async settlePreviousWeek(now = new Date()) {
    return this.settleWeek(startOfPreviousWeek(now));
  }

  // ===========================================================================
  // Admin
  // ===========================================================================

  async adminListWeek(weekStartIso?: string) {
    const weekStart = weekStartIso ? new Date(weekStartIso) : startOfWeek(new Date());
    const groups = await this.prisma.leagueGroup.findMany({
      where: { weekStart },
      include: { _count: { select: { entries: true } } },
      orderBy: [{ tier: 'asc' }, { id: 'asc' }],
    });
    const totalPlayers = groups.reduce((sum, g) => sum + g._count.entries, 0);
    return {
      weekStart: weekStart.toISOString(),
      totalPlayers,
      groups: groups.map((g) => ({
        id: g.id,
        tier: g.tier as LeagueTier,
        weekStart: g.weekStart.toISOString(),
        capacity: g.capacity,
        status: g.status as 'active' | 'settled',
        settledAt: g.settledAt ? g.settledAt.toISOString() : null,
        memberCount: g._count.entries,
      })),
    };
  }
}
