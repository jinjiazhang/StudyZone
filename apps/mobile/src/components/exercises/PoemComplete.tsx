import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import type { PoemCompletePrompt } from '@studyzone/shared-types';
import { colors, fonts, radius } from '@/lib/theme';
import { exerciseStyles as s } from './styles';
import { OptionList } from './OptionList';
import { SubmitButton } from './SubmitButton';

export function PoemCompleteExercise({
  prompt,
  onSubmit,
  disabled,
}: {
  prompt: PoemCompletePrompt;
  onSubmit: (payload: { correctIndex: number }) => void;
  disabled?: boolean;
}) {
  const [pick, setPick] = useState<number | null>(null);

  return (
    <View style={s.container}>
      <Text style={s.labelSmall}>诗词填空</Text>
      <View style={[s.promptCard, local.poemCard]}>
        <Text style={s.promptBold}>《{prompt.title}》</Text>
        <Text style={local.author}>— {prompt.author}</Text>
        <View style={local.linesWrap}>
          {prompt.lines.map((line, lineIdx) => (
            <View key={lineIdx} style={local.line}>
              {line.map((segment, segIdx) =>
                segment === null ? (
                  <View key={segIdx} style={[local.blank, pick !== null && local.blankFilled]}>
                    <Text style={local.blankText}>
                      {pick !== null ? prompt.options[pick] : '＿＿'}
                    </Text>
                  </View>
                ) : (
                  <Text key={segIdx} style={local.lineText}>
                    {segment}
                  </Text>
                ),
              )}
            </View>
          ))}
        </View>
      </View>
      <OptionList options={prompt.options} pick={pick} onPick={setPick} disabled={disabled} />
      <SubmitButton
        onPress={() => pick !== null && onSubmit({ correctIndex: pick })}
        disabled={pick === null || disabled}
      />
    </View>
  );
}

const local = StyleSheet.create({
  poemCard: { alignItems: 'center', backgroundColor: colors.bgSoft },
  author: { fontFamily: fonts.regular, fontSize: 13, color: colors.inkSoft, marginTop: 4 },
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
  blankText: { fontFamily: fonts.heavy, fontSize: 20, color: colors.skyDark },
});
