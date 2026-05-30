import { useState } from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { Volume2 } from 'lucide-react-native';
import type { ImageChoicePrompt } from '@studyzone/shared-types';
import { colors, fonts, radius } from '@/lib/theme';
import { resolveAssetUrl } from '@/lib/assets';
import { useAudioPlayer } from '@/lib/use-audio-player';
import { exerciseStyles as s } from './styles';
import { SubmitButton } from './SubmitButton';

export function ImageChoiceExercise({
  prompt,
  onSubmit,
  disabled,
}: {
  prompt: ImageChoicePrompt;
  onSubmit: (payload: { correctOptionId: string }) => void;
  disabled?: boolean;
}) {
  const [pick, setPick] = useState<string | null>(null);
  const { play, playingUrl } = useAudioPlayer();

  return (
    <View style={s.container}>
      <Text style={s.labelSmall}>选择图片</Text>
      <View style={s.promptCard}>
        <Text style={s.promptBold}>{prompt.word}</Text>
        {prompt.audioUrl && (
          <Pressable onPress={() => play(prompt.audioUrl!)} style={{ marginTop: 8 }}>
            <Volume2
              size={20}
              color={playingUrl === prompt.audioUrl ? colors.skyDark : colors.sky}
            />
          </Pressable>
        )}
      </View>

      <View style={local.grid}>
        {prompt.options.map((option) => {
          const selected = pick === option.id;
          return (
            <Pressable
              key={option.id}
              onPress={() => !disabled && setPick(option.id)}
              style={[local.tile, selected && { borderColor: colors.sky }]}
            >
              <Image source={{ uri: resolveAssetUrl(option.imageUrl) }} style={local.image} />
              <Text
                style={[
                  local.label,
                  selected && { backgroundColor: '#EFF6FF', color: colors.skyDark },
                ]}
              >
                {option.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <SubmitButton
        onPress={() => pick && onSubmit({ correctOptionId: pick })}
        disabled={!pick || disabled}
      />
    </View>
  );
}

const local = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  tile: {
    width: '47%',
    overflow: 'hidden',
    borderRadius: radius.lg,
    borderWidth: 2,
    borderColor: colors.line,
  },
  image: { width: '100%', aspectRatio: 4 / 3, backgroundColor: colors.mist },
  label: {
    padding: 10,
    fontFamily: fonts.heavy,
    fontSize: 14,
    color: colors.ink,
    textAlign: 'center',
  },
});
