import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import type {
  FriendSummaryDto,
  FriendRequestDto,
  Paginated,
} from '@studyzone/shared-types';
import { FriendshipStatus } from '@studyzone/shared-types';
import { PrismaService } from '../../infra/prisma.service';

@Injectable()
export class SocialService {
  constructor(private readonly prisma: PrismaService) {}

  async listFriends(userId: string, cursor?: string): Promise<Paginated<FriendSummaryDto>> {
    const items = await this.prisma.friendship.findMany({
      where: { userId, status: 'accepted' },
      include: {
        friend: {
          include: { wallet: true, streak: true },
        },
      },
      orderBy: { createdAt: 'desc' },
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
            user: toPublic(f.friend),
            status: FriendshipStatus.ACCEPTED,
            weeklyXp: entry?.weeklyXp ?? 0,
            currentStreak: f.friend.streak?.currentStreak ?? 0,
          };
        }),
      ),
      nextCursor: items.length === 30 ? items[items.length - 1]!.friendId : null,
    };
  }

  /**
   * Pending friend requests for the current user, both received (incoming —
   * someone asked to add me) and sent (outgoing — I asked to add someone).
   */
  async listRequests(userId: string): Promise<{
    incoming: FriendRequestDto[];
    outgoing: FriendRequestDto[];
  }> {
    const [incoming, outgoing] = await Promise.all([
      this.prisma.friendship.findMany({
        where: { friendId: userId, status: 'pending' },
        include: { user: true },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.friendship.findMany({
        where: { userId, status: 'pending' },
        include: { friend: true },
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    return {
      incoming: incoming.map((f) => ({
        user: toPublic(f.user),
        direction: 'incoming' as const,
        createdAt: f.createdAt.toISOString(),
      })),
      outgoing: outgoing.map((f) => ({
        user: toPublic(f.friend),
        direction: 'outgoing' as const,
        createdAt: f.createdAt.toISOString(),
      })),
    };
  }

  async sendRequest(userId: string, friendEmail: string): Promise<void> {
    const friend = await this.prisma.user.findUnique({
      where: { email: friendEmail.trim().toLowerCase() },
    });
    if (!friend) throw new NotFoundException({ code: 'user_not_found' });
    if (friend.id === userId) throw new ConflictException({ code: 'self_friend' });

    // Already friends?
    const existing = await this.prisma.friendship.findUnique({
      where: { userId_friendId: { userId, friendId: friend.id } },
    });
    if (existing?.status === 'accepted') {
      throw new ConflictException({ code: 'already_friends' });
    }

    // If the other person already sent *me* a pending request, accept it instead
    // of creating a duplicate in the other direction.
    const reverse = await this.prisma.friendship.findUnique({
      where: { userId_friendId: { userId: friend.id, friendId: userId } },
    });
    if (reverse?.status === 'pending') {
      await this.accept(userId, friend.id);
      return;
    }

    await this.prisma.friendship.upsert({
      where: { userId_friendId: { userId, friendId: friend.id } },
      create: { userId, friendId: friend.id, status: 'pending' },
      update: {},
    });
  }

  async accept(userId: string, requesterId: string): Promise<void> {
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

  /** Decline an incoming request (the requester -> me edge is removed). */
  async decline(userId: string, requesterId: string): Promise<void> {
    const fr = await this.prisma.friendship.findUnique({
      where: { userId_friendId: { userId: requesterId, friendId: userId } },
    });
    if (!fr || fr.status !== 'pending') throw new NotFoundException({ code: 'request_not_found' });

    await this.prisma.friendship.delete({
      where: { userId_friendId: { userId: requesterId, friendId: userId } },
    });
  }

  /**
   * Remove a relationship in both directions. Works for confirmed friends
   * (unfriend) and for cancelling an outgoing pending request.
   */
  async remove(userId: string, otherId: string): Promise<void> {
    await this.prisma.friendship.deleteMany({
      where: {
        OR: [
          { userId, friendId: otherId },
          { userId: otherId, friendId: userId },
        ],
      },
    });
  }
}

function toPublic(u: {
  id: string;
  nickname: string;
  avatarUrl: string | null;
  locale: string;
  createdAt: Date;
}) {
  return {
    id: u.id,
    nickname: u.nickname,
    avatarUrl: u.avatarUrl,
    locale: u.locale as never,
    createdAt: u.createdAt.toISOString(),
  };
}

function startOfWeek(d: Date): Date {
  const day = d.getUTCDay();
  const diff = (day + 6) % 7;
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate() - diff));
}
