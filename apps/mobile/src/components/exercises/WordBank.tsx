import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { WordBankPrompt } from '@studyzone/shared-types';
import { colors, fonts, radius } from '@/lib/theme';
import { exerciseStyles as s } from './styles';
import { SubmitButton } from './SubmitButton';

export function WordBankExercise({
  prompt,
  onSubmit,
  disabled,
}: {
  prompt: WordBankPrompt;
  onSubmit: (payload: { ordered: string[] }) => void;
  disabled?: boolean;
}) {
  const [picked, setPicked] = useState<number[]>([]);
  const remaining = useMemo(
    () => prompt.tokens.map((_, i) => i).filter((i) => !picked.includes(i)),
    [picked, prompt.tokens],
  );

  return (
    <View style={s.container}>
      <Text style={s.labelSmall}>排列词语</Text>
      <View style={s.promptCard}>
        <Text style={s.promptBold}>{prompt.source}</Text>
      </View>

      {/* Answer slot */}
      <View style={local.answerBank}>
        {picked.length === 0 && (
          <Text style={local.answerPlaceholder}>点击下方词语组成句子</Text>
        )}
        {picked.map((idx, order) => (
          <Pressable
            key={`${idx}-${order}`}
            onPress={() => !disabled && setPicked(picked.filter((_, i) => i !== order))}
            style={[local.tokenChip, local.tokenChipPicked]}
          >
            <Text style={[local.tokenText, { color: colors.skyDark }]}>{prompt.tokens[idx]}</Text>
          </Pressable>
        ))}
      </View>

      {/* Word bank */}
      <View style={local.tokenPool}>
        {remaining.map((idx) => (
          <Pressable
            key={idx}
            onPress={() => !disabled && setPicked([...picked, idx])}
            style={local.tokenChip}
          >
            <Text style={local.tokenText}>{prompt.tokens[idx]}</Text>
          </Pressable>
        ))}
      </View>

      <SubmitButton
        onPress={() =>
          onSubmit({ ordered: picked.map((i) => prompt.tokens[i]!).filter(Boolean) })
        }
        disabled={picked.length === 0 || disabled}
      />
    </View>
  );
}

const local = StyleSheet.create({
  answerBank: {
    minHeight: 60,
    borderRadius: radius.lg,
    borderWidth: 2,
    borderColor: colors.line,
    borderStyle: 'dashed',
    backgroundColor: colors.mist,
    padding: 10,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  answerPlaceholder: { fontFamily: fonts.sansBold, color: colors.inkSoft, fontSize: 13 },
  tokenPool: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  tokenChip: {
    borderRadius: radius.md,
    borderWidth: 2,
    borderBottomWidth: 4,
    borderColor: colors.line,
    backgroundColor: colors.white,
    paddingVertical: 8,
    paddingHorizontal: 14,
  },
  tokenChipPicked: { borderColor: colors.sky },
  tokenText: { fontFamily: fonts.heavy, fontSize: 15, color: colors.ink },
});
