import { describe, expect, it } from 'vitest';
import { ExerciseType } from '@studyzone/shared-types';
import type { ExercisePrompt } from '@studyzone/shared-types';

import { judge, levenshtein } from './judge';

describe('judge', () => {
  it('judges choice exercises by selected index', () => {
    const result = judge(
      {
        type: ExerciseType.SINGLE_CHOICE,
        question: '3 + 4 = ?',
        options: ['5', '7', '9'],
      },
      { correctIndex: 1 },
      { correctIndex: 1 },
    );

    expect(result).toEqual({ correct: true, canonicalAnswer: '7' });
  });

  it('accepts text input within configured typo tolerance', () => {
    const result = judge(
      {
        type: ExerciseType.TRANSLATE_INPUT,
        source: '我喜欢苹果。',
        sourceLocale: 'zh-CN',
      },
      { accepted: ['I like apples'], tolerance: 1 },
      { accepted: ['i like apple'] },
    );

    expect(result.correct).toBe(true);
    expect(result.canonicalAnswer).toBe('I like apples');
  });

  it('judges pair matching by exact left-to-right map', () => {
    expect(
      judge(
        {
          type: ExerciseType.MATCH_PAIRS,
          left: [
            { id: 'cat', text: 'cat' },
            { id: 'dog', text: 'dog' },
          ],
          right: [
            { id: 'mao', text: 'mao' },
            { id: 'gou', text: 'gou' },
          ],
        },
        { pairs: { cat: 'mao', dog: 'gou' } },
        { pairs: { cat: 'mao', dog: 'gou' } },
      ).correct,
    ).toBe(true);
  });

  it('judges word bank order exactly', () => {
    expect(
      judge(
        {
          type: ExerciseType.WORD_BANK,
          source: 'Arrange the sentence',
          tokens: ['I', 'like', 'apples'],
        },
        { ordered: ['I', 'like', 'apples'] },
        { ordered: ['I', 'apples', 'like'] },
      ),
    ).toEqual({ correct: false, canonicalAnswer: 'I like apples' });
  });

  it('judges numeric input using optional tolerance', () => {
    expect(
      judge(
        {
          type: ExerciseType.NUMERIC_INPUT,
          statement: '3.14 rounded to 1 decimal place',
        },
        { value: 3.1, tolerance: 0.05 },
        { value: 3.14 },
      ).correct,
    ).toBe(true);
  });

  it('judges pinyin-to-character WRITE by completion + mistake budget', () => {
    const prompt: ExercisePrompt = {
      type: ExerciseType.PINYIN_TO_CHARACTER_WRITE,
      pinyin: 'shī',
      sentence: '老__在黑板上写字。',
      blankPlaceholder: '__',
      character: '师',
      allowedMistakes: 3,
    };
    const answer = { character: '师' };

    // perfect write
    expect(
      judge(prompt, answer, { character: '师', mistakes: 0, completed: true }),
    ).toEqual({ correct: true, canonicalAnswer: '师' });

    // mistakes within budget → still pass
    expect(
      judge(prompt, answer, { character: '师', mistakes: 3, completed: true }).correct,
    ).toBe(true);

    // mistakes over budget → fail
    expect(
      judge(prompt, answer, { character: '师', mistakes: 4, completed: true }).correct,
    ).toBe(false);

    // gave up without completing → fail
    expect(
      judge(prompt, answer, { character: '师', mistakes: 1, completed: false }).correct,
    ).toBe(false);

    // wrong character echoed back (data tampering / desync) → fail
    expect(
      judge(prompt, answer, { character: '诗', mistakes: 0, completed: true }).correct,
    ).toBe(false);
  });

  it('judges pinyin-to-character assemble by slot+component', () => {
    const prompt: ExercisePrompt = {
      type: ExerciseType.PINYIN_TO_CHARACTER_ASSEMBLE,
      pinyin: 'liǔ',
      structure: 'horizontal' as const,
      slots: [{ id: 'left' }, { id: 'right' }],
      candidates: ['木', '卯', '禾', '印'],
      target: '柳',
    };
    const answer = { slotFills: { left: '木', right: '卯' } };

    // exact match
    expect(judge(prompt, answer, { slotFills: { left: '木', right: '卯' } })).toEqual({
      correct: true,
      canonicalAnswer: '柳',
    });

    // components correct but positions swapped → wrong
    expect(
      judge(prompt, answer, { slotFills: { left: '卯', right: '木' } }).correct,
    ).toBe(false);

    // missing one slot → wrong
    expect(judge(prompt, answer, { slotFills: { left: '木' } }).correct).toBe(false);

    // distractor → wrong
    expect(
      judge(prompt, answer, { slotFills: { left: '禾', right: '卯' } }).correct,
    ).toBe(false);
  });
});

describe('levenshtein', () => {
  it('counts insertions, deletions, and substitutions', () => {
    expect(levenshtein('kitten', 'sitting')).toBe(3);
    expect(levenshtein('', 'abc')).toBe(3);
  });
});
