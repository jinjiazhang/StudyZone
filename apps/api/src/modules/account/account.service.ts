import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../infra/prisma.service';

@Injectable()
export class AccountService {
  constructor(private readonly prisma: PrismaService) {}

  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { wallet: true, streak: true, leagueMemberships: { include: { group: true }, take: 1, orderBy: { group: { weekStart: 'desc' } } } },
    });
    if (!user) throw new NotFoundException({ code: 'user_not_found', message: '用户不存在' });

    const currentLeague = user.leagueMemberships[0];

    return {
      id: user.id,
      email: user.email,
      nickname: user.nickname,
      avatarUrl: user.avatarUrl,
      locale: user.locale,
      createdAt: user.createdAt.toISOString(),
      dailyGoalMinutes: user.dailyGoalMinutes,
      xpTotal: user.wallet?.xpTotal ?? 0,
      gems: user.wallet?.gems ?? 0,
      hearts: user.wallet?.hearts ?? 0,
      maxHearts: user.wallet?.maxHearts ?? 5,
      currentStreak: user.streak?.currentStreak ?? 0,
      longestStreak: user.streak?.longestStreak ?? 0,
      leagueTier: currentLeague?.group.tier ?? null,
    };
  }

  async updateProfile(userId: string, patch: { nickname?: string; dailyGoalMinutes?: number; avatarUrl?: string }) {
    return this.prisma.user.update({
      where: { id: userId },
      data: patch,
    });
  }
}
