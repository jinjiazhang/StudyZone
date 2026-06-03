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

  it('judges expression input against accepted normalized expressions', () => {
    expect(
      judge(
        {
          type: ExerciseType.EXPRESSION_INPUT,
          statement: '看图列式',
        },
        { accepted: ['3+4', '4+3'] },
        { accepted: ['4 + 3'] },
      ),
    ).toEqual({ correct: true, canonicalAnswer: '3+4' });
  });

  it('judges multi numeric input by blank order and tolerance', () => {
    expect(
      judge(
        {
          type: ExerciseType.MULTI_NUMERIC_INPUT,
          statement: '17 ÷ 5 = __ ... __',
          blanks: [{ id: 'quotient' }, { id: 'remainder' }],
        },
        { values: [3, 2], tolerances: [0, 0] },
        { values: [3, 2] },
      ),
    ).toEqual({ correct: true, canonicalAnswer: '3 / 2' });
  });

  it('judges sequence ordering by item ids', () => {
    expect(
      judge(
        {
          type: ExerciseType.ORDER_SEQUENCE,
          instruction: '从小到大排列',
          items: [
            { id: 'n12', text: '12' },
            { id: 'n7', text: '7' },
            { id: 'n30', text: '30' },
          ],
        },
        { orderedIds: ['n7', 'n12', 'n30'] },
        { orderedIds: ['n7', 'n12', 'n30'] },
      ).correct,
    ).toBe(true);
  });

  it('judges compare, drag-fill, clock, unit, fraction, table, and number-line math', () => {
    expect(
      judge(
        { type: ExerciseType.COMPARE_INPUT, left: '3+4', right: '8' },
        { operator: '<' },
        { operator: '<' },
      ).correct,
    ).toBe(true);

    expect(
      judge(
        {
          type: ExerciseType.MATH_DRAG_FILL,
          statement: ['3', null, '4', null, '7'],
          tokens: ['+', '='],
        },
        { fills: ['+', '='] },
        { fills: ['+', '='] },
      ).correct,
    ).toBe(true);

    expect(
      judge(
        { type: ExerciseType.CLOCK_INPUT, statement: '钟面是几点？' },
        { hour: 15, minute: 30 },
        { hour: 3, minute: 30 },
      ).correct,
    ).toBe(true);

    expect(
      judge(
        {
          type: ExerciseType.UNIT_CONVERSION,
          statement: '2米 = ?厘米',
          fromUnit: '米',
          toUnit: '厘米',
        },
        { value: 200, unit: '厘米' },
        { value: 200, unit: '厘米' },
      ).canonicalAnswer,
    ).toBe('200厘米');

    expect(
      judge(
        { type: ExerciseType.FRACTION_INPUT, statement: '涂色部分是多少？' },
        { numerator: 1, denominator: 2, allowEquivalent: true },
        { numerator: 2, denominator: 4 },
      ).correct,
    ).toBe(true);

    expect(
      judge(
        {
          type: ExerciseType.TABLE_READ,
          question: '二班有多少人？',
          columns: ['班级', '人数'],
          rows: [{ 班级: '二班', 人数: 38 }],
        },
        { value: 38 },
        { value: 38 },
      ).correct,
    ).toBe(true);

    expect(
      judge(
        { type: ExerciseType.NUMBER_LINE, statement: '标出 0.5', min: 0, max: 1 },
        { value: 0.5, tolerance: 0.01 },
        { value: 0.49 },
      ).correct,
    ).toBe(true);
  });

  it('judges geometry choice and simple geometry drawing payloads', () => {
    expect(
      judge(
        {
          type: ExerciseType.GEOMETRY_CHOICE,
          question: '哪个是直角？',
          options: [
            { id: 'a', label: '锐角' },
            { id: 'b', label: '直角' },
          ],
        },
        { correctOptionId: 'b' },
        { correctOptionId: 'b' },
      ),
    ).toEqual({ correct: true, canonicalAnswer: '直角' });

    expect(
      judge(
        {
          type: ExerciseType.GEOMETRY_DRAW,
          instruction: '连接 A、B 两点',
        },
        { expected: { lines: [{ from: 'A', to: 'B' }] } },
        { drawing: { lines: [{ to: 'B', from: 'A' }] } },
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
