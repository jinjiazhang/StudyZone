import { Injectable, Logger } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { PrismaService } from '../../infra/prisma.service';
import { RewardsService } from '../rewards/rewards.service';
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

  constructor(
    private readonly prisma: PrismaService,
    private readonly rewards: RewardsService,
  ) {}

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
      const tier = await this.resolvePlacementTier(userId);
      return {
        leagueId: '',
        tier,
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
    const groupsToRefresh = new Set<string>();

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

          const existingHistory = await tx.leagueHistory.findUnique({
            where: { userId_weekStart: { userId: entry.userId, weekStart } },
          });

          const history = existingHistory
            ? await tx.leagueHistory.update({
                where: { userId_weekStart: { userId: entry.userId, weekStart } },
                data: {
                  tier,
                  finalRank: rank,
                  weeklyXp: entry.weeklyXp,
                  result,
                  nextTier,
                  gemsAwarded: gems,
                },
              })
            : await tx.leagueHistory.create({
                data: {
                  userId: entry.userId,
                  weekStart,
                  tier,
                  finalRank: rank,
                  weeklyXp: entry.weeklyXp,
                  result,
                  nextTier,
                  gemsAwarded: gems,
                },
              });

          if (!existingHistory && gems > 0) {
            await this.rewards.awardXpAndGemsWithClient(tx, {
              userId: entry.userId,
              xp: 0,
              gems,
              reason: 'league_reward',
              refId: history.id,
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

    const migratedEntries = await this.migrateNextWeekEntriesForHistoryWeek(
      weekStart,
      groupsToRefresh,
    );

    for (const groupId of groupsToRefresh) {
      await this.recomputeRanks(groupId);
    }

    this.logger.log(
      `Settled ${groups.length} group(s) for week ${weekStart.toISOString()}: ` +
        `${playersSettled} players, +${promoted}/-${demoted}, migrated ${migratedEntries} next-week entries`,
    );

    return {
      weekStart: weekStart.toISOString(),
      groupsSettled: groups.length,
      playersSettled,
      promoted,
      demoted,
    };
  }

  private async migrateNextWeekEntriesForHistoryWeek(
    weekStart: Date,
    groupsToRefresh: Set<string>,
  ): Promise<number> {
    const nextWeekStart = addDays(weekStart, 7);
    const histories = await this.prisma.leagueHistory.findMany({
      where: { weekStart },
      select: { userId: true, nextTier: true },
    });

    let migratedEntries = 0;
    for (const history of histories) {
      const movedGroupIds = await this.prisma.$transaction((tx) =>
        this.migrateNextWeekEntryIfNeeded(
          tx,
          history.userId,
          nextWeekStart,
          history.nextTier as LeagueTier,
        ),
      );
      if (movedGroupIds.length > 0) migratedEntries++;
      for (const groupId of movedGroupIds) groupsToRefresh.add(groupId);
    }

    return migratedEntries;
  }

  private async migrateNextWeekEntryIfNeeded(
    tx: Prisma.TransactionClient,
    userId: string,
    weekStart: Date,
    targetTier: LeagueTier,
  ): Promise<string[]> {
    const currentEntry = await tx.leaderboardEntry.findFirst({
      where: { userId, group: { weekStart } },
      include: { group: true },
    });
    if (!currentEntry || currentEntry.group.tier === targetTier) return [];

    const targetGroup = await this.findOrCreateActiveGroup(tx, targetTier, weekStart);
    await tx.leaderboardEntry.update({
      where: { groupId_userId: { groupId: currentEntry.groupId, userId } },
      data: { groupId: targetGroup.id },
    });

    return [currentEntry.groupId, targetGroup.id];
  }

  private async findOrCreateActiveGroup(
    tx: Prisma.TransactionClient,
    tier: LeagueTier,
    weekStart: Date,
  ) {
    const candidates = await tx.leagueGroup.findMany({
      where: { tier, weekStart, status: 'active' },
      include: { _count: { select: { entries: true } } },
      orderBy: { id: 'asc' },
    });
    const group = candidates.find((g) => g._count.entries < g.capacity);
    if (group) return group;

    return {
      ...(await tx.leagueGroup.create({
        data: { tier, weekStart, capacity: LEAGUE_GROUP_CAPACITY, status: 'active' },
      })),
      _count: { entries: 0 },
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

  async adminListWeeks() {
    const groups = await this.prisma.leagueGroup.findMany({
      include: { _count: { select: { entries: true } } },
      orderBy: { weekStart: 'desc' },
    });

    const byWeek = new Map<
      string,
      { weekStart: string; groupCount: number; totalPlayers: number }
    >();
    for (const group of groups) {
      const weekStart = group.weekStart.toISOString();
      const item = byWeek.get(weekStart) ?? { weekStart, groupCount: 0, totalPlayers: 0 };
      item.groupCount++;
      item.totalPlayers += group._count.entries;
      byWeek.set(weekStart, item);
    }

    return [...byWeek.values()];
  }

  async adminGetGroup(groupId: string) {
    const group = await this.prisma.leagueGroup.findUnique({
      where: { id: groupId },
      include: {
        entries: {
          include: { user: true },
          orderBy: [{ weeklyXp: 'desc' }, { joinedAt: 'asc' }],
        },
      },
    });
    if (!group) return null;

    const tier = group.tier as LeagueTier;
    const groupSize = group.entries.length;
    const { promoteCount, demoteCount } = zoneCounts(tier, groupSize);

    return {
      id: group.id,
      tier,
      weekStart: group.weekStart.toISOString(),
      capacity: group.capacity,
      status: group.status as 'active' | 'settled',
      settledAt: group.settledAt ? group.settledAt.toISOString() : null,
      memberCount: groupSize,
      promoteCount,
      demoteCount,
      entries: group.entries.map((entry, idx) => {
        const rank = idx + 1;
        const result = classifyResult(tier, rank, groupSize, entry.weeklyXp);
        return {
          rank,
          user: {
            id: entry.user.id,
            email: entry.user.email,
            nickname: entry.user.nickname,
            avatarUrl: entry.user.avatarUrl,
            locale: entry.user.locale,
            createdAt: entry.user.createdAt.toISOString(),
          },
          weeklyXp: entry.weeklyXp,
          joinedAt: entry.joinedAt.toISOString(),
          result,
          nextTier: resolveNextTier(tier, result),
          gemsAwarded: settlementGemReward(tier, rank, result),
        };
      }),
    };
  }
}
