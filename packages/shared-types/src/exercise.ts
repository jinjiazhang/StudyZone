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
 * Assemble a Chinese character from its components, given a pinyin prompt.
 * The UI shows structural slots (e.g. top/bottom for 上下结构, left/right for
 * 左右结构) and a pool of component candidates (correct components + distractors).
 * The user fills each slot with the right component — both *which* component and
 * *where* it goes are checked.
 *
 * Example for 李 (lǐ):
 *   pinyin: "lǐ",
 *   hint: "桃 ___ 满天下",
 *   structure: "vertical",
 *   slots: [{ id: "top" }, { id: "bottom" }],
 *   candidates: ["木", "子", "禾", "立", "田", "了"],
 *   target: "李",
 *   answer.slotFills: { top: "木", bottom: "子" }
 */
export interface PinyinToCharacterAssemblePrompt {
  type: ExerciseType.PINYIN_TO_CHARACTER_ASSEMBLE;
  /** Pinyin with tone, e.g. "lǐ". */
  pinyin: string;
  /** Optional context word, e.g. "桃 ___ 满天下". */
  hint?: string;
  /** Layout of the structural template. */
  structure: 'horizontal' | 'vertical';
  /**
   * Ordered list of slots. Order matches reading order:
   * - horizontal: left → right
   * - vertical:   top  → bottom
   */
  slots: { id: string; label?: string }[];
  /** Pool of component candidates (correct + distractors), shown shuffled. */
  candidates: string[];
  /** The target composite character — used for the reveal animation / feedback. */
  target: string;
  /** Optional audio of the standard pronunciation. */
  audioUrl?: string;
}

export interface PinyinToCharacterAssembleAnswer {
  /** Map from slot.id → component string. Every slot must be present. */
  slotFills: Record<string, string>;
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
export interface PinyinToCharacterWritePrompt {
  type: ExerciseType.PINYIN_TO_CHARACTER_WRITE;
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

export interface PinyinToCharacterWriteAnswer {
  /**
   * The canonical character — mirrors prompt.character but kept here so the
   * `answer` JSON column remains self-describing.
   */
  character: string;
}

export interface PinyinToCharacterWriteAttemptPayload {
  /** Echoes prompt.character (lets the server cross-check it). */
  character: string;
  /** How many wrong strokes HanziWriter recorded during the quiz. */
  mistakes: number;
  /** Did the learner complete every stroke of the character? */
  completed: boolean;
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
  | PinyinToCharacterAssemblePrompt
  | PinyinToCharacterWritePrompt;

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
  | PinyinToCharacterAssembleAnswer
  | PinyinToCharacterWriteAnswer;

export type ChoiceAttemptPayload = Pick<TranslateChoiceAnswer, 'correctIndex'>;
export type TextAttemptPayload = Pick<TranslateInputAnswer, 'accepted'>;
export type MatchPairsAttemptPayload = MatchPairsAnswer;
export type ImageChoiceAttemptPayload = ImageChoiceAnswer;
export type WordBankAttemptPayload = WordBankAnswer;
export type NumericInputAttemptPayload = NumericInputAnswer;
export type PinyinToCharacterAssembleAttemptPayload = PinyinToCharacterAssembleAnswer;

/** What the user submits for an attempt. Server-only grading fields are omitted. */
export type UserAttemptPayload =
  | ChoiceAttemptPayload
  | TextAttemptPayload
  | MatchPairsAttemptPayload
  | ImageChoiceAttemptPayload
  | WordBankAttemptPayload
  | NumericInputAttemptPayload
  | PinyinToCharacterAssembleAttemptPayload
  | PinyinToCharacterWriteAttemptPayload;
