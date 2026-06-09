import { beforeEach, describe, expect, it, vi } from 'vitest';

import { SocialService } from './social.service';
import { PrismaService } from '../../infra/prisma.service';

function createPrismaMock() {
  return {
    user: { findUnique: vi.fn(), findFirst: vi.fn(), findMany: vi.fn() },
    follow: {
      upsert: vi.fn(),
      deleteMany: vi.fn(),
      count: vi.fn(),
      findUnique: vi.fn(),
      findMany: vi.fn(),
    },
    leaderboardEntry: { findFirst: vi.fn(), findMany: vi.fn() },
  };
}
type MockPrisma = ReturnType<typeof createPrismaMock>;

function userRow(id: string, over: Partial<Record<string, unknown>> = {}) {
  return {
    id,
    username: id,
    nickname: id,
    avatarUrl: null,
    locale: 'zh-CN',
    createdAt: new Date('2026-01-01T00:00:00Z'),
    wallet: { xpTotal: 100 },
    streak: { currentStreak: 3, longestStreak: 9 },
    ...over,
  };
}

describe('SocialService', () => {
  let prisma: MockPrisma;
  let service: SocialService;

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-06-09T12:00:00Z'));
    prisma = createPrismaMock();
    service = new SocialService(prisma as unknown as PrismaService);
  });

  describe('follow', () => {
    it('is idempotent via upsert', async () => {
      prisma.user.findUnique.mockResolvedValue(userRow('target'));
      prisma.follow.upsert.mockResolvedValue({});

      await service.follow('viewer', 'target');
      await service.follow('viewer', 'target');

      expect(prisma.follow.upsert).toHaveBeenCalledTimes(2);
      expect(prisma.follow.upsert).toHaveBeenLastCalledWith(
        expect.objectContaining({
          where: { followerId_followeeId: { followerId: 'viewer', followeeId: 'target' } },
          create: { followerId: 'viewer', followeeId: 'target' },
          update: {},
        }),
      );
    });

    it('rejects following yourself', async () => {
      await expect(service.follow('me', 'me')).rejects.toMatchObject({
        response: { code: 'self_follow' },
      });
      expect(prisma.follow.upsert).not.toHaveBeenCalled();
    });

    it('rejects following a nonexistent user', async () => {
      prisma.user.findUnique.mockResolvedValue(null);
      await expect(service.follow('viewer', 'ghost')).rejects.toMatchObject({
        response: { code: 'user_not_found' },
      });
      expect(prisma.follow.upsert).not.toHaveBeenCalled();
    });
  });

  describe('unfollow', () => {
    it('does not throw when the edge is absent', async () => {
      prisma.follow.deleteMany.mockResolvedValue({ count: 0 });
      await expect(service.unfollow('viewer', 'target')).resolves.toBeUndefined();
      expect(prisma.follow.deleteMany).toHaveBeenCalledWith({
        where: { followerId: 'viewer', followeeId: 'target' },
      });
    });
  });

  describe('searchUsers', () => {
    it('excludes self and flags follow relationships', async () => {
      prisma.user.findMany.mockResolvedValue([userRow('a'), userRow('b')]);
      // viewer follows 'a'; 'b' follows viewer.
      prisma.follow.findMany
        .mockResolvedValueOnce([{ followeeId: 'a' }]) // usersViewerFollows
        .mockResolvedValueOnce([{ followerId: 'b' }]); // usersFollowingViewer

      const result = await service.searchUsers('viewer', 'a');

      expect(prisma.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ id: { not: 'viewer' }, status: 'active' }),
          take: 21,
        }),
      );
      const byId = Object.fromEntries(result.items.map((i) => [i.user.id, i]));
      expect(byId.a).toMatchObject({ isFollowing: true, followsYou: false });
      expect(byId.b).toMatchObject({ isFollowing: false, followsYou: true });
    });

    it('short-circuits on a blank term', async () => {
      const result = await service.searchUsers('viewer', '   ');
      expect(result).toEqual({ items: [], nextCursor: null });
      expect(prisma.user.findMany).not.toHaveBeenCalled();
    });
  });

  describe('getPublicProfile', () => {
    it('returns counts, follow flags, weeklyXp and league tier', async () => {
      prisma.user.findUnique.mockResolvedValue(
        userRow('target', {
          leagueMemberships: [{ group: { weekStart: new Date('2026-06-08T00:00:00Z'), tier: 'gold' } }],
          leagueHistory: [],
        }),
      );
      prisma.follow.count
        .mockResolvedValueOnce(5) // followers
        .mockResolvedValueOnce(2); // following
      prisma.follow.findUnique
        .mockResolvedValueOnce({ followerId: 'viewer', followeeId: 'target' }) // isFollowing
        .mockResolvedValueOnce(null); // followsYou
      prisma.leaderboardEntry.findFirst.mockResolvedValue({ weeklyXp: 250 });

      const profile = await service.getPublicProfile('viewer', 'target');

      expect(profile).toMatchObject({
        followersCount: 5,
        followingCount: 2,
        isFollowing: true,
        followsYou: false,
        isSelf: false,
        weeklyXp: 250,
        leagueTier: 'gold',
        achievements: [],
      });
      expect(profile.user.username).toBe('target');
    });

    it('marks isSelf and skips follow lookups when viewing yourself', async () => {
      prisma.user.findUnique.mockResolvedValue(
        userRow('me', { leagueMemberships: [], leagueHistory: [] }),
      );
      prisma.follow.count.mockResolvedValue(0);
      prisma.leaderboardEntry.findFirst.mockResolvedValue(null);

      const profile = await service.getPublicProfile('me', 'me');

      expect(profile.isSelf).toBe(true);
      expect(profile.isFollowing).toBe(false);
      expect(profile.followsYou).toBe(false);
      expect(prisma.follow.findUnique).not.toHaveBeenCalled();
    });

    it('falls back to username lookup when id misses', async () => {
      prisma.user.findUnique.mockResolvedValue(null);
      prisma.user.findFirst.mockResolvedValue(
        userRow('target', { leagueMemberships: [], leagueHistory: [] }),
      );
      prisma.follow.count.mockResolvedValue(0);
      prisma.follow.findUnique.mockResolvedValue(null);
      prisma.leaderboardEntry.findFirst.mockResolvedValue(null);

      const profile = await service.getPublicProfile('viewer', 'TargetHandle');

      expect(prisma.user.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { username: { equals: 'TargetHandle', mode: 'insensitive' } },
        }),
      );
      expect(profile.user.id).toBe('target');
    });
  });

  describe('usernameAvailable', () => {
    it('reports availability case-insensitively', async () => {
      prisma.user.findFirst.mockResolvedValueOnce({ id: 'x' });
      expect(await service.usernameAvailable('Taken')).toEqual({ available: false });

      prisma.user.findFirst.mockResolvedValueOnce(null);
      expect(await service.usernameAvailable('free')).toEqual({ available: true });
    });
  });
});
