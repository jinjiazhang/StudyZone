import { ExerciseType } from './enums';

/**
 * Each exercise type has its own typed prompt/answer shape.
 * The DB stores prompt/answer as JSONB; this file is the source of truth
 * for what those JSONB blobs look like.
 */

export interface TranslateChoicePrompt {
  type: ExerciseType.TRANSLATE_CHOICE;
  /** Source sentence, e.g. "我喜欢苹果。" */
  source: string;
  /** Locale of the source. */
  sourceLocale: string;
  /** 4 candidate translations. */
  options: string[];
  /** Optional audio of the source sentence. */
  audioUrl?: string;
}

export interface TranslateChoiceAnswer {
  /** Index into options. */
  correctIndex: number;
}

export interface TranslateInputPrompt {
  type: ExerciseType.TRANSLATE_INPUT;
  source: string;
  sourceLocale: string;
  hint?: string;
}

export interface TranslateInputAnswer {
  /** Accepted answers; the first is canonical. */
  accepted: string[];
  /** Levenshtein tolerance (e.g. 1 typo allowed). */
  tolerance: number;
}

export interface ListenInputPrompt {
  type: ExerciseType.LISTEN_INPUT;
  audioUrl: string;
  /** Slower audio for replay button. */
  audioUrlSlow?: string;
}

export interface ListenInputAnswer {
  accepted: string[];
  tolerance: number;
}

export interface MatchPairsPrompt {
  type: ExerciseType.MATCH_PAIRS;
  /** Left column items. */
  left: { id: string; text: string; audioUrl?: string }[];
  /** Right column items. */
  right: { id: string; text: string }[];
}

export interface MatchPairsAnswer {
  /** Map from left.id -> right.id. */
  pairs: Record<string, string>;
}

export interface ImageChoicePrompt {
  type: ExerciseType.IMAGE_CHOICE;
  /** Word to pick image for. */
  word: string;
  audioUrl?: string;
  options: { id: string; imageUrl: string; label: string }[];
}

export interface ImageChoiceAnswer {
  correctOptionId: string;
}

export interface WordBankPrompt {
  type: ExerciseType.WORD_BANK;
  source: string;
  /** Tokens shown to user (shuffled, may contain distractors). */
  tokens: string[];
}

export interface WordBankAnswer {
  /** Ordered list of token strings forming the correct sentence. */
  ordered: string[];
}

export interface NumericInputPrompt {
  type: ExerciseType.NUMERIC_INPUT;
  /** LaTeX-friendly statement, e.g. "3 + 4 = ?". */
  statement: string;
}

export interface NumericInputAnswer {
  value: number;
  /** Allowed absolute tolerance (default 0). */
  tolerance?: number;
}

export interface SingleChoicePrompt {
  type: ExerciseType.SINGLE_CHOICE;
  question: string;
  options: string[];
}

export interface SingleChoiceAnswer {
  correctIndex: number;
}

// -----------------------------------------------------------------------------
// Chinese (语文) — pinyin & poem types
// -----------------------------------------------------------------------------

/**
 * Pick the correct pinyin (with tone) for a displayed Chinese character / word.
 * Renders the character in a large glyph and 4 pinyin options.
 */
export interface PinyinChoicePrompt {
  type: ExerciseType.PINYIN_CHOICE;
  /** The Chinese character or word, e.g. "妈". */
  character: string;
  /** Optional gloss / hint, e.g. "妈妈的妈". */
  hint?: string;
  /** 4 candidate pinyin strings, e.g. ["mā", "má", "mǎ", "mà"]. */
  options: string[];
  /** Optional audio of the standard pronunciation. */
  audioUrl?: string;
}

export interface PinyinChoiceAnswer {
  /** Index into options. */
  correctIndex: number;
}

/**
 * Classical-poem cloze deletion. The line is split into segments; one segment
 * is `null` (the blank) and the user picks the correct token from `options`.
 *
 * Example for 《静夜思》line 1:
 *   title: "静夜思",  author: "李白",
 *   lines: [
 *     ["床前", null, "光"],      // blank in the middle
 *     ["疑是地上霜"],
 *   ],
 *   options: ["明月", "白雪", "灯火", "彩霞"],
 *   answer.correctIndex: 0
 */
export interface PoemCompletePrompt {
  type: ExerciseType.POEM_COMPLETE;
  title: string;
  author: string;
  /** Each entry is a row of the poem; tokens are strings, the blank is `null`. */
  lines: Array<Array<string | null>>;
  options: string[];
}

export interface PoemCompleteAnswer {
  correctIndex: number;
}

/**
 * 看拼音写字 — show a sentence with a blank and the missing character's pinyin;
 * the learner hand-writes the target character on a canvas. HanziWriter checks
 * each stroke against the canonical stroke order/shape.
 *
 * Example:
 *   pinyin: "shī",
 *   sentence: "老__在黑板上写字。",
 *   blankPlaceholder: "__",
 *   character: "师",
 *   allowedMistakes: 3,
 *   leniency: 1.0
 */
export interface PinyinToWordPrompt {
  type: ExerciseType.PINYIN_TO_WORD;
  /** Pinyin with tone, e.g. "shī". */
  pinyin: string;
  /** Sentence containing the blank, e.g. "老__在黑板上写字。". */
  sentence: string;
  /**
   * Substring inside `sentence` that marks the blank to be filled.
   * Defaults to "__" (two underscores) when omitted by the data file.
   */
  blankPlaceholder?: string;
  /**
   * The target Chinese character, e.g. "师". Sent to HanziWriter to load
   * stroke data and judge each stroke against it.
   */
  character: string;
  /**
   * Maximum wrong strokes still considered a pass. Default 3.
   * (A "wrong stroke" = user drew a stroke that didn't match the next
   * expected one in HanziWriter's quiz mode.)
   */
  allowedMistakes?: number;
  /**
   * HanziWriter leniency factor; 1.0 is the library default.
   * Lower = stricter shape matching. Recommended 0.8–1.3.
   */
  leniency?: number;
}

export interface PinyinToWordAnswer {
  /**
   * The canonical character — mirrors prompt.character but kept here so the
   * `answer` JSON column remains self-describing.
   */
  character: string;
}

export interface PinyinToWordAttemptPayload {
  /** Echoes prompt.character (lets the server cross-check it). */
  character: string;
  /** How many wrong strokes HanziWriter recorded during the quiz. */
  mistakes: number;
  /** Did the learner complete every stroke of the character? */
  completed: boolean;
}

/**
 * Multi-blank classical poem cloze. Generalization of POEM_COMPLETE: every
 * `null` in `lines` is a separate blank with its own option set, and the
 * answer is an array of indices — one per blank, in the order they appear.
 *
 * Example for 《静夜思》:
 *   title: "静夜思", author: "李白",
 *   lines: [
 *     ["床前", null, "光"],         // blank 0
 *     ["疑是地上", null],            // blank 1
 *   ],
 *   blanks: [
 *     { options: ["明月", "白雪", "灯火", "彩霞"] },
 *     { options: ["霜", "雪", "雨", "云"] },
 *   ],
 *   answer.correctIndices: [0, 0]
 */
export interface PoemMultiBlankPrompt {
  type: ExerciseType.POEM_MULTI_BLANK;
  title: string;
  author: string;
  /** Each entry is a row of the poem; tokens are strings, blanks are `null`. */
  lines: Array<Array<string | null>>;
  /**
   * One entry per blank. blanks[i] corresponds to the i-th `null` encountered
   * when iterating `lines` left-to-right, top-to-bottom.
   */
  blanks: Array<{ options: string[] }>;
}

export interface PoemMultiBlankAnswer {
  /** Same length as prompt.blanks; each entry is the correct option index. */
  correctIndices: number[];
}

export type PoemMultiBlankAttemptPayload = PoemMultiBlankAnswer;

/**
 * 组词 — pick N tokens from a pool that pair with a central Chinese character
 * to form valid 2-character words. Selection is UNORDERED, and any token set
 * matching one of `acceptedSets` is correct.
 *
 * Example:
 *   character: "明",
 *   tokens: ["白", "天", "光", "亮", "星", "暗"],
 *   targetCount: 3,
 *   answer.acceptedSets: [["白","天","光"], ["白","天","亮"]]
 */
export interface WordBuildPrompt {
  type: ExerciseType.WORD_BUILD;
  /** Central character displayed prominently in the UI. */
  character: string;
  /** Candidate tokens shown to the learner (includes distractors). */
  tokens: string[];
  /** How many tokens the learner must pick. */
  targetCount: number;
  /** Optional override for the prompt copy above the token pool. */
  instruction?: string;
}

export interface WordBuildAnswer {
  /**
   * Each entry is one acceptable solution as an unordered set of token
   * strings. The user wins if their selection equals (as a set) ANY entry.
   */
  acceptedSets: string[][];
}

export interface WordBuildAttemptPayload {
  /** The tokens the learner picked, in click order (server compares as a set). */
  selected: string[];
}

export type ExercisePrompt =
  | TranslateChoicePrompt
  | TranslateInputPrompt
  | ListenInputPrompt
  | MatchPairsPrompt
  | ImageChoicePrompt
  | WordBankPrompt
  | NumericInputPrompt
  | SingleChoicePrompt
  | PinyinChoicePrompt
  | PoemCompletePrompt
  | PinyinToWordPrompt
  | PoemMultiBlankPrompt
  | WordBuildPrompt;

export type ExerciseAnswer =
  | TranslateChoiceAnswer
  | TranslateInputAnswer
  | ListenInputAnswer
  | MatchPairsAnswer
  | ImageChoiceAnswer
  | WordBankAnswer
  | NumericInputAnswer
  | SingleChoiceAnswer
  | PinyinChoiceAnswer
  | PoemCompleteAnswer
  | PinyinToWordAnswer
  | PoemMultiBlankAnswer
  | WordBuildAnswer;

export type ChoiceAttemptPayload = Pick<TranslateChoiceAnswer, 'correctIndex'>;
export type TextAttemptPayload = Pick<TranslateInputAnswer, 'accepted'>;
export type MatchPairsAttemptPayload = MatchPairsAnswer;
export type ImageChoiceAttemptPayload = ImageChoiceAnswer;
export type WordBankAttemptPayload = WordBankAnswer;
export type NumericInputAttemptPayload = NumericInputAnswer;

/** What the user submits for an attempt. Server-only grading fields are omitted. */
export type UserAttemptPayload =
  | ChoiceAttemptPayload
  | TextAttemptPayload
  | MatchPairsAttemptPayload
  | ImageChoiceAttemptPayload
  | WordBankAttemptPayload
  | NumericInputAttemptPayload
  | PinyinToWordAttemptPayload
  | PoemMultiBlankAttemptPayload
  | WordBuildAttemptPayload;
