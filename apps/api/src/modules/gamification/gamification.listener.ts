import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { GamificationService } from './gamification.service';
import { PrismaService } from '../../infra/prisma.service';

interface LessonCompletedEventPayload {
  payload: {
    userId: string;
    xpGained: number;
    outcome: string;
  };
}

@Injectable()
export class GamificationListener {
  private readonly logger = new Logger('GamificationListener');

  constructor(
    private readonly service: GamificationService,
    private readonly prisma: PrismaService,
  ) {}

  @OnEvent('learning.lesson.completed')
  async onLessonCompleted(evt: LessonCompletedEventPayload) {
    const { userId, xpGained, outcome } = evt.payload;
    if (outcome !== 'pass') return;

    // Bump the "complete N lessons" quest and the "earn N XP" quest.
    await this.service.tickQuests(userId, 'complete_lessons', 1);
    await this.service.tickQuests(userId, 'earn_xp', xpGained);

    // Update weekly leaderboard XP for the user's current league entry.
    await this.bumpLeagueXp(userId, xpGained);
  }

  private async bumpLeagueXp(userId: string, delta: number) {
    const weekStart = startOfWeek(new Date());
    // Find the user's entry for this week (assigned by a scheduler in prod; here
    // we lazily assign to bronze if none exists).
    let entry = await this.prisma.leaderboardEntry.findFirst({
      where: { userId, group: { weekStart } },
      include: { group: true },
    });
    if (!entry) {
      const group = await this.prisma.leagueGroup.findFirst({
        where: { tier: 'bronze', weekStart, status: 'active' },
      }) ?? await this.prisma.leagueGroup.create({
        data: { tier: 'bronze', weekStart, status: 'active' },
      });
      entry = await this.prisma.leaderboardEntry.create({
        data: { groupId: group.id, userId, weeklyXp: 0, rank: 0 },
        include: { group: true },
      });
    }
    await this.prisma.leaderboardEntry.update({
      where: { groupId_userId: { groupId: entry.groupId, userId } },
      data: { weeklyXp: { increment: delta } },
    });
  }
}

function startOfWeek(d: Date): Date {
  const day = d.getUTCDay(); // 0 = Sun
  const diff = (day + 6) % 7; // back to Monday
  const result = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate() - diff));
  return result;
}
