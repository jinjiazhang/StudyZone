import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { PoemMultiBlankPrompt } from '@studyzone/shared-types';
import { colors, fonts, radius } from '@/lib/theme';
import { exerciseStyles as s } from './styles';
import { SubmitButton } from './SubmitButton';

export function PoemMultiBlankExercise({
  prompt,
  onSubmit,
  disabled,
}: {
  prompt: PoemMultiBlankPrompt;
  onSubmit: (payload: { correctIndices: number[] }) => void;
  disabled?: boolean;
}) {
  const blankCount = prompt.blanks.length;
  const [picks, setPicks] = useState<(number | null)[]>(() =>
    Array.from({ length: blankCount }, () => null),
  );
  const [activeBlank, setActiveBlank] = useState(0);

  // Tag each null token in `lines` with its blank index, so rendering doesn't
  // need a side counter.
  const flat = useMemo(() => {
    let blankIdx = 0;
    return prompt.lines.map((line) =>
      line.map((segment) => {
        if (segment === null) return { kind: 'blank' as const, index: blankIdx++ };
        return { kind: 'text' as const, value: segment };
      }),
    );
  }, [prompt.lines]);

  const allFilled = picks.every((p) => p !== null);
  const activeOptions = prompt.blanks[activeBlank]?.options ?? [];

  const handlePick = (optionIdx: number) => {
    const next = picks.slice();
    next[activeBlank] = optionIdx;
    setPicks(next);
    const nextEmpty = next.findIndex((p, i) => p === null && i > activeBlank);
    if (nextEmpty !== -1) setActiveBlank(nextEmpty);
    else {
      const anyEmpty = next.findIndex((p) => p === null);
      if (anyEmpty !== -1) setActiveBlank(anyEmpty);
    }
  };

  return (
    <View style={s.container}>
      <Text style={s.labelSmall}>古诗多空填空</Text>

      <View style={[s.promptCard, local.poemCard]}>
        <Text style={s.promptBold}>《{prompt.title}》</Text>
        <Text style={local.author}>— {prompt.author}</Text>
        <View style={local.linesWrap}>
          {flat.map((line, lineIdx) => (
            <View key={lineIdx} style={local.line}>
              {line.map((seg, segIdx) => {
                if (seg.kind === 'text') {
                  return (
                    <Text key={segIdx} style={local.lineText}>
                      {seg.value}
                    </Text>
                  );
                }
                const pick = picks[seg.index];
                const isActive = activeBlank === seg.index;
                const filled = pick !== null;
                return (
                  <Pressable
                    key={segIdx}
                    disabled={disabled}
                    onPress={() => setActiveBlank(seg.index)}
                    style={[
                      local.blank,
                      filled && local.blankFilled,
                      isActive && local.blankActive,
                    ]}
                  >
                    <Text style={local.blankText}>
                      {filled
                        ? prompt.blanks[seg.index]?.options[pick as number]
                        : '＿＿'}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          ))}
        </View>
      </View>

      <Text style={s.labelSmall}>
        第 {activeBlank + 1} / {blankCount} 空
      </Text>

      <View style={{ gap: 8 }}>
        {activeOptions.map((opt, i) => {
          const selected = picks[activeBlank] === i;
          return (
            <Pressable
              key={i}
              onPress={() => !disabled && handlePick(i)}
              style={[s.optionTile, selected && s.optionTileActive]}
            >
              <View style={[s.optionBadge, selected && s.optionBadgeActive]}>
                <Text
                  style={[s.optionBadgeText, selected && s.optionBadgeTextActive]}
                >
                  {String.fromCharCode(65 + i)}
                </Text>
              </View>
              <Text style={[s.optionText, selected && s.optionTextActive]}>
                {opt}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <SubmitButton
        onPress={() =>
          allFilled && onSubmit({ correctIndices: picks as number[] })
        }
        disabled={!allFilled || disabled}
      />
    </View>
  );
}

const local = StyleSheet.create({
  poemCard: { alignItems: 'center', backgroundColor: colors.bgSoft },
  author: {
    fontFamily: fonts.regular,
    fontSize: 13,
    color: colors.inkSoft,
    marginTop: 4,
  },
  linesWrap: { marginTop: 12, gap: 8 },
  line: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    alignItems: 'baseline',
    gap: 2,
  },
  lineText: { fontFamily: fonts.heavy, fontSize: 22, color: colors.ink },
  blank: {
    minWidth: 56,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginHorizontal: 4,
    borderRadius: radius.md,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: colors.sky,
    alignItems: 'center',
    justifyContent: 'center',
  },
  blankFilled: {
    borderStyle: 'solid',
    backgroundColor: '#EFF6FF',
  },
  blankActive: {
    borderColor: colors.skyDark,
    borderWidth: 3,
  },
  blankText: { fontFamily: fonts.heavy, fontSize: 20, color: colors.skyDark },
});
