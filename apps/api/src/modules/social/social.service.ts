import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../infra/prisma.service';

@Injectable()
export class SocialService {
  constructor(private readonly prisma: PrismaService) {}

  async listFriends(userId: string, cursor?: string) {
    const items = await this.prisma.friendship.findMany({
      where: { userId, status: 'accepted' },
      include: {
        friend: {
          include: { wallet: true, streak: true },
        },
      },
      take: 30,
      ...(cursor ? { cursor: { userId_friendId: { userId, friendId: cursor } }, skip: 1 } : {}),
    });

    const weekStart = startOfWeek(new Date());

    return {
      items: await Promise.all(
        items.map(async (f) => {
          const entry = await this.prisma.leaderboardEntry.findFirst({
            where: { userId: f.friendId, group: { weekStart } },
          });
          return {
            user: {
              id: f.friend.id,
              nickname: f.friend.nickname,
              avatarUrl: f.friend.avatarUrl,
              locale: f.friend.locale,
              createdAt: f.friend.createdAt.toISOString(),
            },
            status: f.status,
            weeklyXp: entry?.weeklyXp ?? 0,
            currentStreak: f.friend.streak?.currentStreak ?? 0,
          };
        }),
      ),
      nextCursor: items.length === 30 ? items[items.length - 1]!.friendId : null,
    };
  }

  async sendRequest(userId: string, friendEmail: string) {
    const friend = await this.prisma.user.findUnique({ where: { email: friendEmail } });
    if (!friend) throw new NotFoundException({ code: 'user_not_found' });
    if (friend.id === userId) throw new ConflictException({ code: 'self_friend' });

    await this.prisma.friendship.upsert({
      where: { userId_friendId: { userId, friendId: friend.id } },
      create: { userId, friendId: friend.id, status: 'pending' },
      update: {},
    });
  }

  async accept(userId: string, requesterId: string) {
    const fr = await this.prisma.friendship.findUnique({
      where: { userId_friendId: { userId: requesterId, friendId: userId } },
    });
    if (!fr || fr.status !== 'pending') throw new NotFoundException({ code: 'request_not_found' });

    await this.prisma.$transaction([
      this.prisma.friendship.update({
        where: { userId_friendId: { userId: requesterId, friendId: userId } },
        data: { status: 'accepted' },
      }),
      this.prisma.friendship.upsert({
        where: { userId_friendId: { userId, friendId: requesterId } },
        create: { userId, friendId: requesterId, status: 'accepted' },
        update: { status: 'accepted' },
      }),
    ]);
  }

}

function startOfWeek(d: Date): Date {
  const day = d.getUTCDay();
  const diff = (day + 6) % 7;
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate() - diff));
}
