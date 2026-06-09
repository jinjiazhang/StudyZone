import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import type {
  FollowUserDto,
  PublicProfileDto,
  UserPublic,
  UserSearchResultDto,
  Paginated,
  LeagueTier,
} from '@studyzone/shared-types';
import { PrismaService } from '../../infra/prisma.service';
import { startOfWeek } from '../league/league.util';

const PAGE_SIZE = 30;
const SEARCH_LIMIT = 20;

type UserWithStats = {
  id: string;
  username: string;
  nickname: string;
  avatarUrl: string | null;
  locale: string;
  createdAt: Date;
  wallet?: { xpTotal: number } | null;
  streak?: { currentStreak: number } | null;
};

@Injectable()
export class SocialService {
  constructor(private readonly prisma: PrismaService) {}

  // --- Mutations -------------------------------------------------------------

  /** Follow a user. Idempotent; no approval step. */
  async follow(viewerId: string, targetId: string): Promise<void> {
    if (viewerId === targetId) throw new ConflictException({ code: 'self_follow' });

    const target = await this.prisma.user.findUnique({ where: { id: targetId } });
    if (!target) throw new NotFoundException({ code: 'user_not_found' });

    await this.prisma.follow.upsert({
      where: { followerId_followeeId: { followerId: viewerId, followeeId: targetId } },
      create: { followerId: viewerId, followeeId: targetId },
      update: {},
    });

    // Hook point: emit a 'social.user.followed' event here to drive notifications
    // once that feature ships (mirrors auth.service's 'account.user.registered').
  }

  /** Unfollow a user. Idempotent (no error when the edge is absent). */
  async unfollow(viewerId: string, targetId: string): Promise<void> {
    await this.prisma.follow.deleteMany({
      where: { followerId: viewerId, followeeId: targetId },
    });
  }

  // --- Lists -----------------------------------------------------------------

  /** Users the given user follows. */
  async listFollowing(viewerId: string, cursor?: string): Promise<Paginated<FollowUserDto>> {
    const rows = await this.prisma.follow.findMany({
      where: { followerId: viewerId },
      include: { followee: { include: { wallet: true, streak: true } } },
      orderBy: { createdAt: 'desc' },
      take: PAGE_SIZE,
      ...(cursor
        ? {
            cursor: { followerId_followeeId: { followerId: viewerId, followeeId: cursor } },
            skip: 1,
          }
        : {}),
    });

    const items = await this.buildFollowRows(
      viewerId,
      rows.map((r) => r.followee),
    );
    return {
      items,
      nextCursor: rows.length === PAGE_SIZE ? rows[rows.length - 1]!.followeeId : null,
    };
  }

  /** Users who follow the given user. */
  async listFollowers(viewerId: string, cursor?: string): Promise<Paginated<FollowUserDto>> {
    const rows = await this.prisma.follow.findMany({
      where: { followeeId: viewerId },
      include: { follower: { include: { wallet: true, streak: true } } },
      orderBy: { createdAt: 'desc' },
      take: PAGE_SIZE,
      ...(cursor
        ? {
            cursor: { followerId_followeeId: { followerId: cursor, followeeId: viewerId } },
            skip: 1,
          }
        : {}),
    });

    const items = await this.buildFollowRows(
      viewerId,
      rows.map((r) => r.follower),
    );
    return {
      items,
      nextCursor: rows.length === PAGE_SIZE ? rows[rows.length - 1]!.followerId : null,
    };
  }

  // --- Search ----------------------------------------------------------------

  async searchUsers(
    viewerId: string,
    term: string,
    cursor?: string,
  ): Promise<Paginated<UserSearchResultDto>> {
    const trimmed = term.trim();
    if (!trimmed) return { items: [], nextCursor: null };

    const rows = await this.prisma.user.findMany({
      where: {
        id: { not: viewerId },
        status: 'active',
        OR: [
          { username: { contains: trimmed, mode: 'insensitive' } },
          { nickname: { contains: trimmed, mode: 'insensitive' } },
        ],
      },
      include: { wallet: true, streak: true },
      take: SEARCH_LIMIT + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
      orderBy: { createdAt: 'desc' },
    });

    const hasMore = rows.length > SEARCH_LIMIT;
    const page = hasMore ? rows.slice(0, SEARCH_LIMIT) : rows;
    const [following, followers] = await this.followMaps(
      viewerId,
      page.map((u) => u.id),
    );

    return {
      items: page.map((u) => ({
        user: toPublic(u),
        currentStreak: u.streak?.currentStreak ?? 0,
        xpTotal: u.wallet?.xpTotal ?? 0,
        isFollowing: following.has(u.id),
        followsYou: followers.has(u.id),
      })),
      nextCursor: hasMore ? page[page.length - 1]!.id : null,
    };
  }

  // --- Public profile --------------------------------------------------------

  async getPublicProfile(viewerId: string, idOrUsername: string): Promise<PublicProfileDto> {
    const user = await this.resolveUser(idOrUsername);
    if (!user) throw new NotFoundException({ code: 'user_not_found' });

    const isSelf = viewerId === user.id;
    const [followersCount, followingCount, isFollowing, followsYou, weeklyXp] = await Promise.all([
      this.prisma.follow.count({ where: { followeeId: user.id } }),
      this.prisma.follow.count({ where: { followerId: user.id } }),
      isSelf ? Promise.resolve(false) : this.hasFollow(viewerId, user.id),
      isSelf ? Promise.resolve(false) : this.hasFollow(user.id, viewerId),
      this.weeklyXp(user.id),
    ]);

    return {
      user: toPublic(user),
      xpTotal: user.wallet?.xpTotal ?? 0,
      currentStreak: user.streak?.currentStreak ?? 0,
      longestStreak: user.streak?.longestStreak ?? 0,
      leagueTier: deriveLeagueTier(user.leagueMemberships[0], user.leagueHistory[0]),
      weeklyXp,
      followersCount,
      followingCount,
      isFollowing,
      followsYou,
      isSelf,
      achievements: [],
    };
  }

  async usernameAvailable(username: string): Promise<{ available: boolean }> {
    const existing = await this.prisma.user.findFirst({
      where: { username: { equals: username.trim(), mode: 'insensitive' } },
      select: { id: true },
    });
    return { available: !existing };
  }

  // --- Helpers ---------------------------------------------------------------

  /** Attach weeklyXp + viewer's isFollowing flag to a list of users (no N+1). */
  private async buildFollowRows(
    viewerId: string,
    users: UserWithStats[],
  ): Promise<FollowUserDto[]> {
    const ids = users.map((u) => u.id);
    const [following] = await this.followMaps(viewerId, ids);
    const weekStart = startOfWeek(new Date());
    const entries = await this.prisma.leaderboardEntry.findMany({
      where: { userId: { in: ids }, group: { weekStart } },
    });
    const weeklyByUser = new Map(entries.map((e) => [e.userId, e.weeklyXp]));

    return users.map((u) => ({
      user: toPublic(u),
      currentStreak: u.streak?.currentStreak ?? 0,
      weeklyXp: weeklyByUser.get(u.id) ?? 0,
      isFollowing: following.has(u.id),
    }));
  }

  /** Returns [usersViewerFollows, usersFollowingViewer] as id sets, batched. */
  private async followMaps(
    viewerId: string,
    ids: string[],
  ): Promise<[Set<string>, Set<string>]> {
    if (ids.length === 0) return [new Set(), new Set()];
    const [following, followers] = await Promise.all([
      this.prisma.follow.findMany({
        where: { followerId: viewerId, followeeId: { in: ids } },
        select: { followeeId: true },
      }),
      this.prisma.follow.findMany({
        where: { followeeId: viewerId, followerId: { in: ids } },
        select: { followerId: true },
      }),
    ]);
    return [
      new Set(following.map((f) => f.followeeId)),
      new Set(followers.map((f) => f.followerId)),
    ];
  }

  private hasFollow(followerId: string, followeeId: string): Promise<boolean> {
    return this.prisma.follow
      .findUnique({ where: { followerId_followeeId: { followerId, followeeId } } })
      .then(Boolean);
  }

  private async weeklyXp(userId: string): Promise<number> {
    const weekStart = startOfWeek(new Date());
    const entry = await this.prisma.leaderboardEntry.findFirst({
      where: { userId, group: { weekStart } },
    });
    return entry?.weeklyXp ?? 0;
  }

  /** Resolve a profile target by cuid id first, then by case-insensitive username. */
  private resolveUser(idOrUsername: string) {
    const include = {
      wallet: true,
      streak: true,
      leagueMemberships: {
        include: { group: true },
        take: 1,
        orderBy: { group: { weekStart: 'desc' } },
      },
      leagueHistory: { take: 1, orderBy: { weekStart: 'desc' } },
    } as const;

    return this.prisma.user
      .findUnique({ where: { id: idOrUsername }, include })
      .then((byId) =>
        byId ??
        this.prisma.user.findFirst({
          where: { username: { equals: idOrUsername, mode: 'insensitive' } },
          include,
        }),
      );
  }
}

function toPublic(u: {
  id: string;
  username: string;
  nickname: string;
  avatarUrl: string | null;
  locale: string;
  createdAt: Date;
}): UserPublic {
  return {
    id: u.id,
    username: u.username,
    nickname: u.nickname,
    avatarUrl: u.avatarUrl,
    locale: u.locale as never,
    createdAt: u.createdAt.toISOString(),
  };
}

/** Shared league-tier derivation (mirrors AccountService.getProfile). */
function deriveLeagueTier(
  currentLeague: { group: { weekStart: Date; tier: string } } | undefined,
  lastHistory: { weekStart: Date; nextTier: string } | undefined,
): LeagueTier | null {
  const tier =
    currentLeague && (!lastHistory || currentLeague.group.weekStart > lastHistory.weekStart)
      ? currentLeague.group.tier
      : (lastHistory?.nextTier ?? currentLeague?.group.tier ?? null);
  return tier as LeagueTier | null;
}
