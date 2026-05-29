import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { GamificationService } from './gamification.service';
import { LeagueService } from '../league/league.service';

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
    private readonly league: LeagueService,
  ) {}

  @OnEvent('learning.lesson.completed')
  async onLessonCompleted(evt: LessonCompletedEventPayload) {
    const { userId, xpGained, outcome } = evt.payload;
    if (outcome !== 'pass') return;

    // Bump the "complete N lessons" quest and the "earn N XP" quest.
    await this.service.tickQuests(userId, 'complete_lessons', 1);
    await this.service.tickQuests(userId, 'earn_xp', xpGained);

    // Update weekly leaderboard XP (assigns a group + recomputes ranks).
    await this.league.addWeeklyXp(userId, xpGained);
  }
}
