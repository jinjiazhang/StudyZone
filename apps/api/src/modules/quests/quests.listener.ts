import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { QuestsService } from './quests.service';

interface LessonCompletedEventPayload {
  payload: {
    userId: string;
    xpGained: number;
    outcome: string;
  };
}

@Injectable()
export class QuestsListener {
  private readonly logger = new Logger('QuestsListener');

  constructor(private readonly service: QuestsService) {}

  @OnEvent('learning.lesson.completed')
  async onLessonCompleted(evt: LessonCompletedEventPayload) {
    const { userId, xpGained, outcome } = evt.payload;
    if (outcome !== 'pass') return;

    // Bump the "complete N lessons" quest and the "earn N XP" quest.
    await this.service.tickQuests(userId, 'complete_lessons', 1);
    await this.service.tickQuests(userId, 'earn_xp', xpGained);
  }
}
