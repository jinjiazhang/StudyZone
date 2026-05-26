import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../infra/prisma.service';

@Injectable()
export class GamificationService {
  constructor(private readonly prisma: PrismaService) {}

  async dailyQuests(userId: string) {
    const today = new Date().toISOString().slice(0, 10);
    const quests = await this.prisma.dailyQuest.findMany({ where: { active: true } });

    const progress = await this.prisma.userQuestProgress.findMany({
      where: { userId, date: today, questId: { in: quests.map((q) => q.id) } },
    });
    const progressMap = new Map(progress.map((p) => [p.questId, p]));

    return quests.map((q) => {
      const p = progressMap.get(q.id);
      return {
        id: q.id,
        code: q.code,
        title: q.title,
        targetValue: q.targetValue,
        currentValue: p?.currentValue ?? 0,
        xpReward: q.xpReward,
        gemsReward: q.gemsReward,
        completed: !!p?.completedAt,
      };
    });
  }

  /** Tick all active quests for the day for a user with the given progress delta. */
  async tickQuests(userId: string, code: string, increment: number) {
    const today = new Date().toISOString().slice(0, 10);
    const quests = await this.prisma.dailyQuest.findMany({ where: { active: true, code } });
    for (const q of quests) {
      const existing = await this.prisma.userQuestProgress.findUnique({
        where: { userId_questId_date: { userId, questId: q.id, date: today } },
      });
      const newValue = (existing?.currentValue ?? 0) + increment;
      const justCompleted = !existing?.completedAt && newValue >= q.targetValue;
      await this.prisma.userQuestProgress.upsert({
        where: { userId_questId_date: { userId, questId: q.id, date: today } },
        create: {
          userId,
          questId: q.id,
          date: today,
          currentValue: newValue,
          completedAt: justCompleted ? new Date() : null,
        },
        update: {
          currentValue: newValue,
          completedAt: justCompleted ? new Date() : existing?.completedAt,
        },
      });

      if (justCompleted) {
        // Reward.
        await this.prisma.userWallet.update({
          where: { userId },
          data: {
            xpTotal: { increment: q.xpReward },
            gems: { increment: q.gemsReward },
          },
        });
        await this.prisma.xPLedger.create({
          data: { userId, delta: q.xpReward, reason: 'daily_quest', refId: q.id },
        });
      }
    }
  }
}
