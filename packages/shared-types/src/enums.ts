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
  /** Type a mathematical expression, such as a formula or equation. */
  EXPRESSION_INPUT = 'expression_input',
  /** Fill several numeric blanks in one exercise. */
  MULTI_NUMERIC_INPUT = 'multi_numeric_input',
  /** Arrange numbers, times, lengths, or other math items in order. */
  ORDER_SEQUENCE = 'order_sequence',
  /** Fill in a comparison operator: <, >, or =. */
  COMPARE_INPUT = 'compare_input',
  /** Drag numbers, units, or symbols into math blanks. */
  MATH_DRAG_FILL = 'math_drag_fill',
  /** Choose from visual geometry options. */
  GEOMETRY_CHOICE = 'geometry_choice',
  /** Read or set a clock time. */
  CLOCK_INPUT = 'clock_input',
  /** Convert a value into another measurement unit. */
  UNIT_CONVERSION = 'unit_conversion',
  /** Enter a fraction as numerator and denominator. */
  FRACTION_INPUT = 'fraction_input',
  /** Answer a question by reading a table. */
  TABLE_READ = 'table_read',
  /** Locate a number on a number line. */
  NUMBER_LINE = 'number_line',
  /** Draw or mark geometry elements. */
  GEOMETRY_DRAW = 'geometry_draw',
  /** Pick the correct pinyin for a Chinese character (Chinese subject). */
  PINYIN_CHOICE = 'pinyin_choice',
  /** Fill in the blank of a classical poem line (Chinese subject). */
  POEM_COMPLETE = 'poem_complete',
  /**
   * Given a sentence with a blank and the missing character's pinyin,
   * the learner must hand-write the character stroke-by-stroke on a canvas.
   * Stroke order and shape are graded by HanziWriter.
   */
  PINYIN_TO_WORD = 'pinyin_to_word',
  /**
   * Classical poem cloze with MULTIPLE blanks, each with its own option set.
   * Generalized form of POEM_COMPLETE.
   */
  POEM_MULTI_BLANK = 'poem_multi_blank',
  /**
   * Pick N tokens from a pool that combine with a central character to form
   * valid words (e.g. 中心字 "明" + 选 ["白","天","光"] → 明白/明天/光明).
   * Unordered selection; multiple accepted answer sets are allowed.
   */
  WORD_BUILD = 'word_build',

  // ---------------------------------------------------------------------------
  // English (英语) — listening, judgment, dialogue, reading & sequencing
  // ---------------------------------------------------------------------------
  /**
   * Listen to audio and pick the matching option (picture or text).
   * Covers textbook "Listen and tick / Listen, then point" activities.
   */
  LISTEN_CHOICE = 'listen_choice',
  /**
   * Decide whether a statement (optionally with an image/audio) is true or
   * false. Covers textbook "Read and check / tick" judgment activities.
   */
  TRUE_FALSE = 'true_false',
  /**
   * Complete a short dialogue by choosing the appropriate missing line.
   * Covers textbook "Look and talk / Role-play" conversational activities.
   */
  DIALOGUE_COMPLETE = 'dialogue_complete',
  /**
   * Read (or listen to) a passage / short story and answer one or more
   * multiple-choice sub-questions. All sub-questions must be correct.
   */
  READING_COMPREHENSION = 'reading_comprehension',
  /**
   * Order picture / text / audio cards into the correct sequence. Covers
   * textbook "Read and order" and "Listen and number" story sequencing.
   */
  PICTURE_ORDER = 'picture_order',
}

export enum LessonOutcome {
  PASS = 'pass',
  FAIL = 'fail',
  ABANDONED = 'abandoned',
}

/** @deprecated The follow model has no pending/blocked states. */
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
  LEAGUE_REWARD = 'league_reward',
  STREAK_BONUS = 'streak_bonus',
  PRACTICE = 'practice',
}
