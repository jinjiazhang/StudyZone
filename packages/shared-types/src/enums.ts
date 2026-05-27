// Centralized enums shared between client and server.

export enum SubjectCode {
  ENGLISH = 'english',
  MATH = 'math',
  MUSIC = 'music',
  CHINESE = 'chinese',
}

export enum Locale {
  ZH_CN = 'zh-CN',
  EN_US = 'en-US',
  JA_JP = 'ja-JP',
}

export enum ExerciseType {
  /** Choose the matching translation from 4 options. */
  TRANSLATE_CHOICE = 'translate_choice',
  /** Type the translation. */
  TRANSLATE_INPUT = 'translate_input',
  /** Listen to audio and type what you hear. */
  LISTEN_INPUT = 'listen_input',
  /** Match pairs (e.g. word ↔ translation). */
  MATCH_PAIRS = 'match_pairs',
  /** Pick the image that matches the prompt. */
  IMAGE_CHOICE = 'image_choice',
  /** Arrange tokens to form the correct sentence. */
  WORD_BANK = 'word_bank',
  /** Numeric answer (math). */
  NUMERIC_INPUT = 'numeric_input',
  /** Single-choice multiple choice (math). */
  SINGLE_CHOICE = 'single_choice',
  /** Pick the correct pinyin for a Chinese character (Chinese subject). */
  PINYIN_CHOICE = 'pinyin_choice',
  /** Fill in the blank of a classical poem line (Chinese subject). */
  POEM_COMPLETE = 'poem_complete',
  /**
   * Given a pinyin, assemble the target Chinese character by dragging
   * components into structural slots (e.g. 上/下 or 左/右).
   */
  PINYIN_TO_CHARACTER_ASSEMBLE = 'pinyin_to_character_assemble',
}

export enum LessonOutcome {
  PASS = 'pass',
  FAIL = 'fail',
  ABANDONED = 'abandoned',
}

export enum FriendshipStatus {
  PENDING = 'pending',
  ACCEPTED = 'accepted',
  BLOCKED = 'blocked',
}

export enum LeagueTier {
  BRONZE = 'bronze',
  SILVER = 'silver',
  GOLD = 'gold',
  SAPPHIRE = 'sapphire',
  RUBY = 'ruby',
  EMERALD = 'emerald',
  DIAMOND = 'diamond',
}

export const LEAGUE_TIER_ORDER: LeagueTier[] = [
  LeagueTier.BRONZE,
  LeagueTier.SILVER,
  LeagueTier.GOLD,
  LeagueTier.SAPPHIRE,
  LeagueTier.RUBY,
  LeagueTier.EMERALD,
  LeagueTier.DIAMOND,
];

export enum XPReason {
  LESSON_COMPLETED = 'lesson_completed',
  PERFECT_LESSON_BONUS = 'perfect_lesson_bonus',
  DAILY_QUEST = 'daily_quest',
  STREAK_BONUS = 'streak_bonus',
  PRACTICE = 'practice',
}
