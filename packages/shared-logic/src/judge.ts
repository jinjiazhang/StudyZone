import {
  ExerciseType,
  type ExerciseAnswer,
  type ExercisePrompt,
  type UserAttemptPayload,
} from '@studyzone/shared-types';

/**
 * Authoritative answer judging. Lives here (not server-only) so the client
 * can do optimistic UI but the server's verdict is still final.
 */

export interface JudgeResult {
  correct: boolean;
  /** Canonical correct answer surface form (for revealing on wrong). */
  canonicalAnswer?: string;
}

export function judge(
  prompt: ExercisePrompt,
  answer: ExerciseAnswer,
  attempt: UserAttemptPayload,
): JudgeResult {
  switch (prompt.type) {
    case ExerciseType.TRANSLATE_CHOICE:
    case ExerciseType.SINGLE_CHOICE: {
      const a = answer as { correctIndex: number };
      const u = attempt as { correctIndex: number };
      const correct = u.correctIndex === a.correctIndex;
      return {
        correct,
        canonicalAnswer:
          prompt.type === ExerciseType.SINGLE_CHOICE
            ? prompt.options[a.correctIndex]
            : prompt.options[a.correctIndex],
      };
    }

    case ExerciseType.TRANSLATE_INPUT:
    case ExerciseType.LISTEN_INPUT: {
      const a = answer as { accepted: string[]; tolerance: number };
      const u = attempt as { accepted: string[] };
      const userText = (u.accepted[0] ?? '').trim().toLowerCase();
      const correct = a.accepted.some(
        (acc) => levenshtein(userText, acc.trim().toLowerCase()) <= a.tolerance,
      );
      return { correct, canonicalAnswer: a.accepted[0] };
    }

    case ExerciseType.MATCH_PAIRS: {
      const a = answer as { pairs: Record<string, string> };
      const u = attempt as { pairs: Record<string, string> };
      const correct =
        Object.keys(a.pairs).length === Object.keys(u.pairs).length &&
        Object.entries(a.pairs).every(([k, v]) => u.pairs[k] === v);
      return { correct };
    }

    case ExerciseType.IMAGE_CHOICE: {
      const a = answer as { correctOptionId: string };
      const u = attempt as { correctOptionId: string };
      return {
        correct: a.correctOptionId === u.correctOptionId,
        canonicalAnswer: a.correctOptionId,
      };
    }

    case ExerciseType.WORD_BANK: {
      const a = answer as { ordered: string[] };
      const u = attempt as { ordered: string[] };
      const correct =
        a.ordered.length === u.ordered.length &&
        a.ordered.every((tok, i) => tok === u.ordered[i]);
      return { correct, canonicalAnswer: a.ordered.join(' ') };
    }

    case ExerciseType.NUMERIC_INPUT: {
      const a = answer as { value: number; tolerance?: number };
      const u = attempt as { value: number };
      const tolerance = a.tolerance ?? 0;
      const correct = Math.abs(u.value - a.value) <= tolerance;
      return { correct, canonicalAnswer: String(a.value) };
    }

    default:
      // Exhaustiveness check
      return { correct: false };
  }
}

/** Classic iterative Levenshtein distance. */
export function levenshtein(a: string, b: string): number {
  if (a === b) return 0;
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;

  let prev = new Array<number>(b.length + 1);
  let curr = new Array<number>(b.length + 1);
  for (let j = 0; j <= b.length; j++) prev[j] = j;

  for (let i = 1; i <= a.length; i++) {
    curr[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      curr[j] = Math.min(
        (curr[j - 1] ?? 0) + 1,
        (prev[j] ?? 0) + 1,
        (prev[j - 1] ?? 0) + cost,
      );
    }
    [prev, curr] = [curr, prev];
  }
  return prev[b.length] ?? 0;
}
