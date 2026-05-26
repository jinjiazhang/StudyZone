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

export type ExercisePrompt =
  | TranslateChoicePrompt
  | TranslateInputPrompt
  | ListenInputPrompt
  | MatchPairsPrompt
  | ImageChoicePrompt
  | WordBankPrompt
  | NumericInputPrompt
  | SingleChoicePrompt;

export type ExerciseAnswer =
  | TranslateChoiceAnswer
  | TranslateInputAnswer
  | ListenInputAnswer
  | MatchPairsAnswer
  | ImageChoiceAnswer
  | WordBankAnswer
  | NumericInputAnswer
  | SingleChoiceAnswer;

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
  | NumericInputAttemptPayload;
