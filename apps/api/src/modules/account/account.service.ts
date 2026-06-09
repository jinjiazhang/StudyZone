import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { recoverHearts } from '@studyzone/shared-logic';
import { PrismaService } from '../../infra/prisma.service';
import { RewardsService, heartRecoveryMinutes } from '../rewards/rewards.service';

@Injectable()
export class AccountService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly rewards: RewardsService,
  ) {}

  async getProfile(userId: string) {
    // Apply any pending heart regeneration so the profile reflects it instantly.
    await this.rewards.syncHearts(userId);

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        wallet: true,
        streak: true,
        leagueMemberships: {
          include: { group: true },
          take: 1,
          orderBy: { group: { weekStart: 'desc' } },
        },
        leagueHistory: { take: 1, orderBy: { weekStart: 'desc' } },
        _count: { select: { following: true, followers: true } },
      },
    });
    if (!user) throw new NotFoundException({ code: 'user_not_found', message: '用户不存在' });

    // When below max, tell the client when the next heart lands (for a countdown).
    const nextHeartAt = user.wallet
      ? recoverHearts({
          hearts: user.wallet.hearts,
          maxHearts: user.wallet.maxHearts,
          heartsUpdatedAt: user.wallet.heartsUpdatedAt,
          intervalMinutes: heartRecoveryMinutes(),
        }).nextHeartAt
      : null;

    const currentLeague = user.leagueMemberships[0];
    const lastHistory = user.leagueHistory[0];
    const leagueTier =
      currentLeague && (!lastHistory || currentLeague.group.weekStart > lastHistory.weekStart)
        ? currentLeague.group.tier
        : (lastHistory?.nextTier ?? currentLeague?.group.tier ?? null);

    return {
      id: user.id,
      email: user.email,
      username: user.username,
      nickname: user.nickname,
      avatarUrl: user.avatarUrl,
      locale: user.locale,
      createdAt: user.createdAt.toISOString(),
      dailyGoalMinutes: user.dailyGoalMinutes,
      xpTotal: user.wallet?.xpTotal ?? 0,
      gems: user.wallet?.gems ?? 0,
      hearts: user.wallet?.hearts ?? 0,
      maxHearts: user.wallet?.maxHearts ?? 5,
      nextHeartAt: nextHeartAt ? nextHeartAt.toISOString() : null,
      currentStreak: user.streak?.currentStreak ?? 0,
      longestStreak: user.streak?.longestStreak ?? 0,
      leagueTier,
      followingCount: user._count.following,
      followersCount: user._count.followers,
    };
  }

  async updateProfile(
    userId: string,
    patch: { nickname?: string; username?: string; dailyGoalMinutes?: number; avatarUrl?: string },
  ) {
    if (patch.username) {
      const taken = await this.prisma.user.findFirst({
        where: {
          id: { not: userId },
          username: { equals: patch.username, mode: 'insensitive' },
        },
        select: { id: true },
      });
      if (taken) throw new ConflictException({ code: 'username_taken', message: '该用户名已被占用' });
    }

    try {
      return await this.prisma.user.update({ where: { id: userId }, data: patch });
    } catch (err) {
      // Backstop against a race on the functional unique index.
      if (isUniqueViolation(err)) {
        throw new ConflictException({ code: 'username_taken', message: '该用户名已被占用' });
      }
      throw err;
    }
  }
}

function isUniqueViolation(err: unknown): boolean {
  return typeof err === 'object' && err !== null && (err as { code?: string }).code === 'P2002';
}
