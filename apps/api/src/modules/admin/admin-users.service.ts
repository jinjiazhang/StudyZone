import { Injectable, NotFoundException } from '@nestjs/common';
import type { Prisma } from '@prisma/client';

import { PrismaService } from '../../infra/prisma.service';
import { AdjustWalletDto, ListUsersQueryDto, UpdateUserDto } from './admin-users.dto';

const DEFAULT_LIMIT = 20;

@Injectable()
export class AdminUsersService {
  constructor(private readonly prisma: PrismaService) {}

  async list(query: ListUsersQueryDto) {
    const limit = query.limit ?? DEFAULT_LIMIT;

    const where: Prisma.UserWhereInput = {};
    if (query.status) where.status = query.status;
    if (query.search) {
      const term = query.search.trim();
      where.OR = [
        { email: { contains: term, mode: 'insensitive' } },
        { nickname: { contains: term, mode: 'insensitive' } },
      ];
    }

    const rows = await this.prisma.user.findMany({
      where,
      take: limit + 1,
      ...(query.cursor ? { cursor: { id: query.cursor }, skip: 1 } : {}),
      orderBy: { createdAt: 'desc' },
      include: { wallet: true, streak: true },
    });

    const hasMore = rows.length > limit;
    const page = hasMore ? rows.slice(0, limit) : rows;

    return {
      items: page.map((u) => ({
        id: u.id,
        email: u.email,
        nickname: u.nickname,
        avatarUrl: u.avatarUrl,
        locale: u.locale,
        status: u.status,
        xpTotal: u.wallet?.xpTotal ?? 0,
        currentStreak: u.streak?.currentStreak ?? 0,
        createdAt: u.createdAt.toISOString(),
      })),
      nextCursor: hasMore ? page[page.length - 1].id : null,
    };
  }

  async detail(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: {
        wallet: true,
        streak: true,
        leagueMemberships: {
          include: { group: true },
          take: 1,
          orderBy: { group: { weekStart: 'desc' } },
        },
        _count: { select: { enrollments: true } },
      },
    });
    if (!user) throw new NotFoundException({ code: 'user_not_found', message: '用户不存在' });

    const lessonsCompleted = await this.prisma.userLessonProgress.count({
      where: { userId: id, completed: true },
    });

    return {
      id: user.id,
      email: user.email,
      nickname: user.nickname,
      avatarUrl: user.avatarUrl,
      locale: user.locale,
      status: user.status,
      timezone: user.timezone,
      dailyGoalMinutes: user.dailyGoalMinutes,
      xpTotal: user.wallet?.xpTotal ?? 0,
      gems: user.wallet?.gems ?? 0,
      hearts: user.wallet?.hearts ?? 0,
      maxHearts: user.wallet?.maxHearts ?? 5,
      currentStreak: user.streak?.currentStreak ?? 0,
      longestStreak: user.streak?.longestStreak ?? 0,
      leagueTier: user.leagueMemberships[0]?.group.tier ?? null,
      enrolledCourses: user._count.enrollments,
      lessonsCompleted,
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString(),
    };
  }

  async update(id: string, dto: UpdateUserDto) {
    await this.ensureExists(id);
    await this.prisma.user.update({
      where: { id },
      data: {
        ...(dto.nickname !== undefined ? { nickname: dto.nickname } : {}),
        ...(dto.status !== undefined ? { status: dto.status } : {}),
        ...(dto.dailyGoalMinutes !== undefined
          ? { dailyGoalMinutes: dto.dailyGoalMinutes }
          : {}),
      },
    });
    return this.detail(id);
  }

  async adjustWallet(id: string, dto: AdjustWalletDto) {
    await this.ensureExists(id);
    const wallet = await this.prisma.userWallet.findUnique({ where: { userId: id } });
    if (!wallet) {
      throw new NotFoundException({ code: 'wallet_not_found', message: '用户钱包不存在' });
    }
    const nextGems = Math.max(0, wallet.gems + (dto.gemsDelta ?? 0));
    await this.prisma.userWallet.update({
      where: { userId: id },
      data: {
        gems: nextGems,
        ...(dto.hearts !== undefined
          ? { hearts: Math.min(dto.hearts, wallet.maxHearts) }
          : {}),
      },
    });
    return this.detail(id);
  }

  private async ensureExists(id: string) {
    const exists = await this.prisma.user.findUnique({ where: { id }, select: { id: true } });
    if (!exists) throw new NotFoundException({ code: 'user_not_found', message: '用户不存在' });
  }
}
