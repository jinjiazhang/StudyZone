import { useState } from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import type { DialogueCompletePrompt } from '@studyzone/shared-types';
import { colors, fonts, radius } from '@/lib/theme';
import { resolveAssetUrl } from '@/lib/assets';
import { exerciseStyles as s } from './styles';
import { OptionList } from './OptionList';
import { SubmitButton } from './SubmitButton';

export function DialogueCompleteExercise({
  prompt,
  onSubmit,
  disabled,
}: {
  prompt: DialogueCompletePrompt;
  onSubmit: (payload: { correctIndex: number }) => void;
  disabled?: boolean;
}) {
  const [pick, setPick] = useState<number | null>(null);

  return (
    <View style={s.container}>
      <Text style={s.labelSmall}>选出最合适的一句话补全对话</Text>

      {prompt.imageUrl && (
        <Image source={{ uri: resolveAssetUrl(prompt.imageUrl) }} style={local.image} />
      )}

      <View style={{ gap: 8 }}>
        {prompt.turns.map((turn, idx) => {
          const isBlank = idx === prompt.blankIndex;
          const left = idx % 2 === 0;
          return (
            <View key={idx} style={[local.row, { alignItems: left ? 'flex-start' : 'flex-end' }]}>
              <Text style={local.speaker}>{turn.speaker}</Text>
              <View style={[local.bubble, isBlank ? local.bubbleBlank : left ? local.bubbleLeft : local.bubbleRight]}>
                <Text style={[local.bubbleText, isBlank && { color: colors.skyDark }]}>
                  {isBlank ? (pick !== null ? prompt.options[pick] : '? ? ?') : turn.text}
                </Text>
              </View>
            </View>
          );
        })}
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
  image: {
    width: '100%',
    aspectRatio: 16 / 9,
    borderRadius: radius.lg,
    borderWidth: 2,
    borderColor: colors.line,
    backgroundColor: colors.mist,
  },
  row: { gap: 2 },
  speaker: {
    fontFamily: fonts.heavy,
    fontSize: 10,
    color: colors.inkSoft,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  bubble: {
    maxWidth: '85%',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: radius.lg,
    borderWidth: 2,
  },
  bubbleLeft: { borderColor: colors.line, backgroundColor: colors.white },
  bubbleRight: { borderColor: colors.line, backgroundColor: colors.mist },
  bubbleBlank: { borderColor: colors.sky, borderStyle: 'dashed', backgroundColor: '#EFF6FF' },
  bubbleText: { fontFamily: fonts.heavy, fontSize: 15, color: colors.ink },
});
