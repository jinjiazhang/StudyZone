import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { WordBuildPrompt } from '@studyzone/shared-types';
import { colors, fonts, radius } from '@/lib/theme';
import { exerciseStyles as s } from './styles';
import { SubmitButton } from './SubmitButton';

export function WordBuildExercise({
  prompt,
  onSubmit,
  disabled,
}: {
  prompt: WordBuildPrompt;
  onSubmit: (payload: { selected: string[] }) => void;
  disabled?: boolean;
}) {
  const [picked, setPicked] = useState<number[]>([]);
  const remaining = useMemo(
    () => prompt.tokens.map((_, i) => i).filter((i) => !picked.includes(i)),
    [picked, prompt.tokens],
  );

  const atLimit = picked.length >= prompt.targetCount;
  const canSubmit = picked.length === prompt.targetCount;
  const instruction =
    prompt.instruction ??
    `从下面选 ${prompt.targetCount} 个能与「${prompt.character}」组词的字`;

  return (
    <View style={s.container}>
      <Text style={s.labelSmall}>组词</Text>
      <Text style={local.instruction}>{instruction}</Text>

      <View style={[s.promptCard, local.charCard]}>
        <Text style={local.bigChar}>{prompt.character}</Text>
        <Text style={local.counter}>
          已选 {picked.length} / {prompt.targetCount}
        </Text>
      </View>

      {/* Answer slot */}
      <View style={local.answerBank}>
        {picked.length === 0 && (
          <Text style={local.answerPlaceholder}>点击下方汉字开始组词</Text>
        )}
        {picked.map((idx, order) => (
          <Pressable
            key={`${idx}-${order}`}
            onPress={() =>
              !disabled && setPicked(picked.filter((_, i) => i !== order))
            }
            style={[local.tokenChip, local.tokenChipPicked]}
          >
            <Text style={[local.tokenText, { color: colors.skyDark }]}>
              {prompt.tokens[idx]}
            </Text>
          </Pressable>
        ))}
      </View>

      {/* Token pool */}
      <View style={local.tokenPool}>
        {remaining.map((idx) => {
          const dim = atLimit;
          return (
            <Pressable
              key={idx}
              disabled={disabled || dim}
              onPress={() => setPicked([...picked, idx])}
              style={[local.tokenChip, dim && { opacity: 0.4 }]}
            >
              <Text style={local.tokenText}>{prompt.tokens[idx]}</Text>
            </Pressable>
          );
        })}
      </View>

      <SubmitButton
        onPress={() =>
          canSubmit &&
          onSubmit({
            selected: picked.map((i) => prompt.tokens[i]!).filter(Boolean),
          })
        }
        disabled={!canSubmit || disabled}
      />
    </View>
  );
}

const local = StyleSheet.create({
  instruction: { fontFamily: fonts.heavy, fontSize: 18, color: colors.ink },
  charCard: { alignItems: 'center', backgroundColor: colors.bgSoft, paddingVertical: 24 },
  bigChar: { fontFamily: fonts.heavy, fontSize: 72, color: colors.ink },
  counter: {
    fontFamily: fonts.heavy,
    fontSize: 11,
    color: colors.inkSoft,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginTop: 4,
  },
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
  tokenText: { fontFamily: fonts.heavy, fontSize: 18, color: colors.ink },
});
