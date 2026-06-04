import { useState } from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { Volume2, Check, X } from 'lucide-react-native';
import type { TrueFalsePrompt } from '@studyzone/shared-types';
import { colors, fonts, radius } from '@/lib/theme';
import { resolveAssetUrl } from '@/lib/assets';
import { useAudioPlayer } from '@/lib/use-audio-player';
import { exerciseStyles as s } from './styles';
import { SubmitButton } from './SubmitButton';

export function TrueFalseExercise({
  prompt,
  onSubmit,
  disabled,
}: {
  prompt: TrueFalsePrompt;
  onSubmit: (payload: { value: boolean }) => void;
  disabled?: boolean;
}) {
  const [pick, setPick] = useState<boolean | null>(null);
  const { play, playingUrl } = useAudioPlayer();

  return (
    <View style={s.container}>
      <Text style={s.labelSmall}>判断正误</Text>

      {prompt.imageUrl && (
        <Image source={{ uri: resolveAssetUrl(prompt.imageUrl) }} style={local.image} />
      )}

      <View style={s.promptCard}>
        {prompt.audioUrl && (
          <Pressable onPress={() => play(prompt.audioUrl)} style={{ marginBottom: 8 }}>
            <Volume2 size={20} color={playingUrl === prompt.audioUrl ? colors.skyDark : colors.sky} />
          </Pressable>
        )}
        <Text style={s.promptBold}>{prompt.statement}</Text>
      </View>

      <View style={{ flexDirection: 'row', gap: 10 }}>
        <Pressable
          onPress={() => !disabled && setPick(true)}
          style={[local.judgeBtn, pick === true && local.trueActive]}
        >
          <Check size={22} color={pick === true ? colors.greenDark : colors.inkSoft} />
          <Text style={[local.judgeText, pick === true && { color: colors.greenDark }]}>
            {prompt.trueLabel ?? '对'}
          </Text>
        </Pressable>
        <Pressable
          onPress={() => !disabled && setPick(false)}
          style={[local.judgeBtn, pick === false && local.falseActive]}
        >
          <X size={22} color={pick === false ? colors.roseDark : colors.inkSoft} />
          <Text style={[local.judgeText, pick === false && { color: colors.roseDark }]}>
            {prompt.falseLabel ?? '错'}
          </Text>
        </Pressable>
      </View>

      <SubmitButton
        onPress={() => pick !== null && onSubmit({ value: pick })}
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
  judgeBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 18,
    borderRadius: radius.lg,
    borderWidth: 2,
    borderBottomWidth: 4,
    borderColor: colors.line,
    backgroundColor: colors.white,
  },
  trueActive: { borderColor: colors.green, backgroundColor: colors.greenTint },
  falseActive: { borderColor: colors.rose, backgroundColor: '#FFF1F2' },
  judgeText: { fontFamily: fonts.heavy, fontSize: 18, color: colors.ink },
});
