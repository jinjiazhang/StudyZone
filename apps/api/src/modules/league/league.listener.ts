import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { LeagueService } from './league.service';

interface LessonCompletedEventPayload {
  payload: {
    userId: string;
    xpGained: number;
    outcome: string;
  };
}

@Injectable()
export class LeagueListener {
  constructor(private readonly league: LeagueService) {}

  @OnEvent('learning.lesson.completed')
  async onLessonCompleted(evt: LessonCompletedEventPayload) {
    const { userId, xpGained, outcome } = evt.payload;
    if (outcome !== 'pass') return;

    // Update weekly leaderboard XP (assigns a group + recomputes ranks).
    await this.league.addWeeklyXp(userId, xpGained);
  }
}
