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
    case ExerciseType.SINGLE_CHOICE:
    case ExerciseType.PINYIN_CHOICE:
    case ExerciseType.POEM_COMPLETE: {
      const a = answer as { correctIndex: number };
      const u = attempt as { correctIndex: number };
      const correct = u.correctIndex === a.correctIndex;
      return {
        correct,
        canonicalAnswer: prompt.options[a.correctIndex],
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

    case ExerciseType.GEOMETRY_CHOICE: {
      const a = answer as { correctOptionId: string };
      const u = attempt as { correctOptionId: string };
      const p = prompt as { options: Array<{ id: string; label?: string }> };
      const correct = a.correctOptionId === u.correctOptionId;
      const canonicalAnswer =
        p.options.find((option) => option.id === a.correctOptionId)?.label ?? a.correctOptionId;
      return { correct, canonicalAnswer };
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
      const correct = withinTolerance(u.value, a.value, tolerance);
      return { correct, canonicalAnswer: String(a.value) };
    }

    case ExerciseType.EXPRESSION_INPUT: {
      const a = answer as { accepted: string[] };
      const u = attempt as { accepted: string[] };
      const userExpression = normalizeExpression(u.accepted?.[0] ?? '');
      const correct = a.accepted.some((expression) => {
        return normalizeExpression(expression) === userExpression;
      });
      return { correct, canonicalAnswer: a.accepted[0] };
    }

    case ExerciseType.MULTI_NUMERIC_INPUT: {
      const a = answer as { values: number[]; tolerances?: number[] };
      const u = attempt as { values: number[] };
      const correct =
        Array.isArray(u.values) &&
        a.values.length === u.values.length &&
        a.values.every((value, i) => {
          const tolerance = a.tolerances?.[i] ?? 0;
          return withinTolerance(u.values[i] ?? Number.NaN, value, tolerance);
        });
      return { correct, canonicalAnswer: a.values.join(' / ') };
    }

    case ExerciseType.ORDER_SEQUENCE: {
      const a = answer as { orderedIds: string[] };
      const u = attempt as { orderedIds: string[] };
      const correct =
        Array.isArray(u.orderedIds) &&
        a.orderedIds.length === u.orderedIds.length &&
        a.orderedIds.every((id, i) => id === u.orderedIds[i]);
      return { correct, canonicalAnswer: a.orderedIds.join(' / ') };
    }

    case ExerciseType.COMPARE_INPUT: {
      const a = answer as { operator: '<' | '>' | '=' };
      const u = attempt as { operator: '<' | '>' | '=' };
      return { correct: a.operator === u.operator, canonicalAnswer: a.operator };
    }

    case ExerciseType.MATH_DRAG_FILL: {
      const a = answer as { fills: string[] };
      const u = attempt as { fills: string[] };
      const correct =
        Array.isArray(u.fills) &&
        a.fills.length === u.fills.length &&
        a.fills.every((fill, i) => fill === u.fills[i]);
      return { correct, canonicalAnswer: a.fills.join(' / ') };
    }

    case ExerciseType.CLOCK_INPUT: {
      const a = answer as { hour: number; minute: number };
      const u = attempt as { hour: number; minute: number };
      const correct = normalizeHour(a.hour) === normalizeHour(u.hour) && a.minute === u.minute;
      return { correct, canonicalAnswer: formatClock(a.hour, a.minute) };
    }

    case ExerciseType.UNIT_CONVERSION: {
      const a = answer as { value: number; unit: string; tolerance?: number };
      const u = attempt as { value: number; unit: string };
      const tolerance = a.tolerance ?? 0;
      const correct =
        withinTolerance(u.value, a.value, tolerance) && normalizeUnit(u.unit) === normalizeUnit(a.unit);
      return { correct, canonicalAnswer: `${a.value}${a.unit}` };
    }

    case ExerciseType.FRACTION_INPUT: {
      const a = answer as {
        numerator: number;
        denominator: number;
        allowEquivalent?: boolean;
      };
      const u = attempt as { numerator: number; denominator: number };
      const correct = a.allowEquivalent
        ? u.denominator !== 0 && a.denominator !== 0 &&
          u.numerator * a.denominator === a.numerator * u.denominator
        : u.numerator === a.numerator && u.denominator === a.denominator;
      return { correct, canonicalAnswer: `${a.numerator}/${a.denominator}` };
    }

    case ExerciseType.TABLE_READ: {
      const a = answer as { accepted?: string[]; value?: number; tolerance?: number };
      const u = attempt as { accepted?: string[]; value?: number };
      if (typeof a.value === 'number') {
        const tolerance = a.tolerance ?? 0;
        const correct = typeof u.value === 'number' && withinTolerance(u.value, a.value, tolerance);
        return { correct, canonicalAnswer: String(a.value) };
      }
      const userText = (u.accepted?.[0] ?? '').trim().toLowerCase();
      const correct =
        Array.isArray(a.accepted) &&
        a.accepted.some((accepted) => accepted.trim().toLowerCase() === userText);
      return { correct, canonicalAnswer: a.accepted?.[0] };
    }

    case ExerciseType.NUMBER_LINE: {
      const a = answer as { value: number; tolerance?: number };
      const u = attempt as { value: number };
      const tolerance = a.tolerance ?? 0;
      const correct = withinTolerance(u.value, a.value, tolerance);
      return { correct, canonicalAnswer: String(a.value) };
    }

    case ExerciseType.GEOMETRY_DRAW: {
      const a = answer as { expected: unknown };
      const u = attempt as { drawing: unknown };
      const correct = stableStringify(u.drawing) === stableStringify(a.expected);
      return { correct };
    }

    case ExerciseType.PINYIN_TO_WORD: {
      // HanziWriter judges each stroke on the client. The server's job is to
      // sanity-check the summary the client submits: the right character was
      // practiced, the user actually finished it, and they stayed within the
      // mistake budget.
      const p = prompt as { character: string; allowedMistakes?: number };
      const u = attempt as { character: string; mistakes: number; completed: boolean };
      const allowed = p.allowedMistakes ?? 3;
      const correct =
        !!u.completed &&
        u.character === p.character &&
        typeof u.mistakes === 'number' &&
        u.mistakes <= allowed;
      return { correct, canonicalAnswer: p.character };
    }

    case ExerciseType.POEM_MULTI_BLANK: {
      // Multi-blank cloze: every blank must match its expected option index.
      // No partial credit — all-or-nothing, mirroring single-blank POEM_COMPLETE.
      const p = prompt as { blanks: Array<{ options: string[] }> };
      const a = answer as { correctIndices: number[] };
      const u = attempt as { correctIndices: number[] };
      const correct =
        Array.isArray(u.correctIndices) &&
        a.correctIndices.length === u.correctIndices.length &&
        a.correctIndices.every((idx, i) => idx === u.correctIndices[i]);
      const canonicalAnswer = a.correctIndices
        .map((idx, i) => p.blanks[i]?.options[idx])
        .filter((s): s is string => typeof s === 'string')
        .join(' / ');
      return { correct, canonicalAnswer };
    }

    case ExerciseType.WORD_BUILD: {
      // Unordered set match: user wins if their selected tokens equal (as a
      // multiset) any one of the accepted answer sets.
      const a = answer as { acceptedSets: string[][] };
      const u = attempt as { selected: string[] };
      const userSorted = [...(u.selected ?? [])].sort();
      const correct = a.acceptedSets.some((set) => {
        if (set.length !== userSorted.length) return false;
        const setSorted = [...set].sort();
        return setSorted.every((t, i) => t === userSorted[i]);
      });
      const canonicalAnswer = a.acceptedSets[0]?.join('、');
      return { correct, canonicalAnswer };
    }

    default:
      // Exhaustiveness check
      return { correct: false };
  }
}

function normalizeExpression(value: string): string {
  return value.replace(/\s+/g, '').toLowerCase();
}

function withinTolerance(actual: number, expected: number, tolerance: number): boolean {
  return Math.abs(actual - expected) <= tolerance + Number.EPSILON;
}

function normalizeHour(hour: number): number {
  return ((hour % 12) + 12) % 12;
}

function formatClock(hour: number, minute: number): string {
  return `${hour}:${String(minute).padStart(2, '0')}`;
}

function normalizeUnit(unit: string): string {
  return unit.trim().toLowerCase();
}

function stableStringify(value: unknown): string {
  if (Array.isArray(value)) {
    return `[${value.map(stableStringify).join(',')}]`;
  }
  if (value && typeof value === 'object') {
    return `{${Object.entries(value)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, child]) => `${JSON.stringify(key)}:${stableStringify(child)}`)
      .join(',')}}`;
  }
  return JSON.stringify(value);
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
