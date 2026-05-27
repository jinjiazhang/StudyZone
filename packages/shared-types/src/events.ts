import { LessonOutcome, XPReason } from './enums';

/**
 * Internal domain events published on the bus.
 * Each event must be serializable JSON.
 */

export interface BaseEvent {
  /** Unique event id (uuid). */
  id: string;
  /** ISO timestamp. */
  occurredAt: string;
  /** Producing module, e.g. "learning". */
  source: string;
}

export interface LessonCompletedEvent extends BaseEvent {
  type: 'learning.lesson.completed';
  payload: {
    userId: string;
    sessionId: string;
    lessonId: string;
    outcome: LessonOutcome;
    correctCount: number;
    totalCount: number;
    xpGained: number;
    timeSpentMs: number;
  };
}

export interface XPAwardedEvent extends BaseEvent {
  type: 'gamification.xp.awarded';
  payload: {
    userId: string;
    delta: number;
    reason: XPReason;
    refId: string | null;
    xpTotal: number;
  };
}

export interface StreakChangedEvent extends BaseEvent {
  type: 'gamification.streak.changed';
  payload: {
    userId: string;
    previousStreak: number;
    newStreak: number;
    advanced: boolean;
  };
}

export interface UserRegisteredEvent extends BaseEvent {
  type: 'account.user.registered';
  payload: {
    userId: string;
    email: string;
  };
}

export type DomainEvent =
  | LessonCompletedEvent
  | XPAwardedEvent
  | StreakChangedEvent
  | UserRegisteredEvent;
