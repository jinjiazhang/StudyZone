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

  it('judges pinyin-to-word by completion + mistake budget', () => {
    const prompt: ExercisePrompt = {
      type: ExerciseType.PINYIN_TO_WORD,
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

  it('judges multi-blank poem when all blanks correct', () => {
    const prompt: ExercisePrompt = {
      type: ExerciseType.POEM_MULTI_BLANK,
      title: '静夜思',
      author: '李白',
      lines: [
        ['床前', null, '光'],
        ['疑是地上', null],
      ],
      blanks: [
        { options: ['明月', '白雪', '灯火', '彩霞'] },
        { options: ['霜', '雪', '雨', '云'] },
      ],
    };
    const answer = { correctIndices: [0, 0] };

    expect(
      judge(prompt, answer, { correctIndices: [0, 0] }),
    ).toEqual({ correct: true, canonicalAnswer: '明月 / 霜' });
  });

  it('judges multi-blank poem wrong when any blank wrong', () => {
    const prompt: ExercisePrompt = {
      type: ExerciseType.POEM_MULTI_BLANK,
      title: '静夜思',
      author: '李白',
      lines: [['床前', null, '光'], ['疑是地上', null]],
      blanks: [
        { options: ['明月', '白雪'] },
        { options: ['霜', '雪'] },
      ],
    };
    const answer = { correctIndices: [0, 0] };

    const r = judge(prompt, answer, { correctIndices: [0, 1] });
    expect(r.correct).toBe(false);
    expect(r.canonicalAnswer).toBe('明月 / 霜');
  });

  it('judges word build by unordered set match', () => {
    const prompt: ExercisePrompt = {
      type: ExerciseType.WORD_BUILD,
      character: '明',
      tokens: ['白', '天', '光', '亮', '星', '暗'],
      targetCount: 3,
    };
    const answer = {
      acceptedSets: [
        ['白', '天', '光'],
        ['白', '天', '亮'],
      ],
    };

    // user picked an accepted set in a different click order → still correct
    expect(
      judge(prompt, answer, { selected: ['天', '白', '光'] }),
    ).toEqual({ correct: true, canonicalAnswer: '白、天、光' });

    // user picked the second accepted set
    expect(
      judge(prompt, answer, { selected: ['亮', '天', '白'] }).correct,
    ).toBe(true);
  });

  it('rejects word build when token count mismatches or token wrong', () => {
    const prompt: ExercisePrompt = {
      type: ExerciseType.WORD_BUILD,
      character: '明',
      tokens: ['白', '天', '光', '亮', '星', '暗'],
      targetCount: 3,
    };
    const answer = { acceptedSets: [['白', '天', '光']] };

    // too few
    expect(
      judge(prompt, answer, { selected: ['白', '天'] }).correct,
    ).toBe(false);
    // too many
    expect(
      judge(prompt, answer, { selected: ['白', '天', '光', '亮'] }).correct,
    ).toBe(false);
    // right count but wrong token
    expect(
      judge(prompt, answer, { selected: ['白', '天', '星'] }).correct,
    ).toBe(false);
  });
});

describe('levenshtein', () => {
  it('counts insertions, deletions, and substitutions', () => {
    expect(levenshtein('kitten', 'sitting')).toBe(3);
    expect(levenshtein('', 'abc')).toBe(3);
  });
});
