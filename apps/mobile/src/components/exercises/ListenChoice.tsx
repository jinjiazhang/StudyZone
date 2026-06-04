import { useState } from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { Volume2 } from 'lucide-react-native';
import type { ListenChoicePrompt } from '@studyzone/shared-types';
import { colors, fonts, radius } from '@/lib/theme';
import { resolveAssetUrl } from '@/lib/assets';
import { useAudio } from '@/lib/audio';
import { exerciseStyles as s } from './styles';
import { SubmitButton } from './SubmitButton';

export function ListenChoiceExercise({
  prompt,
  onSubmit,
  disabled,
}: {
  prompt: ListenChoicePrompt;
  onSubmit: (payload: { correctOptionId: string }) => void;
  disabled?: boolean;
}) {
  const [pick, setPick] = useState<string | null>(null);
  const { play, playingUrl } = useAudio();
  const hasImages = prompt.options.some((opt) => !!opt.imageUrl);

  return (
    <View style={s.container}>
      <Text style={s.labelSmall}>听音频，选出正确答案</Text>
      {prompt.question && (
        <View style={s.promptCard}>
          <Text style={s.promptBold}>{prompt.question}</Text>
        </View>
      )}

      <View style={{ flexDirection: 'row', gap: 8 }}>
        <Pressable
          onPress={() => play(prompt.audioUrl)}
          style={[s.audioBtn, playingUrl === prompt.audioUrl && s.audioBtnActive]}
        >
          <Volume2 size={20} color={playingUrl === prompt.audioUrl ? colors.white : colors.sky} />
          <Text style={[s.audioBtnText, playingUrl === prompt.audioUrl && s.audioBtnTextActive]}>
            播放
          </Text>
        </Pressable>
        {prompt.audioUrlSlow && (
          <Pressable
            onPress={() => play(prompt.audioUrlSlow!)}
            style={[s.audioBtn, playingUrl === prompt.audioUrlSlow && s.audioBtnActive]}
          >
            <Text style={[s.audioBtnText, playingUrl === prompt.audioUrlSlow && s.audioBtnTextActive]}>
              🐢 慢速
            </Text>
          </Pressable>
        )}
      </View>

      {hasImages ? (
        <View style={local.grid}>
          {prompt.options.map((option) => {
            const selected = pick === option.id;
            return (
              <Pressable
                key={option.id}
                onPress={() => !disabled && setPick(option.id)}
                style={[local.tile, selected && { borderColor: colors.sky }]}
              >
                {option.imageUrl && (
                  <Image source={{ uri: resolveAssetUrl(option.imageUrl) }} style={local.image} />
                )}
                {(option.text || option.label) && (
                  <Text
                    style={[
                      local.label,
                      selected && { backgroundColor: '#EFF6FF', color: colors.skyDark },
                    ]}
                  >
                    {option.text ?? option.label}
                  </Text>
                )}
              </Pressable>
            );
          })}
        </View>
      ) : (
        <View style={{ gap: 8 }}>
          {prompt.options.map((option) => {
            const selected = pick === option.id;
            return (
              <Pressable
                key={option.id}
                onPress={() => !disabled && setPick(option.id)}
                style={[s.optionTile, selected && s.optionTileActive]}
              >
                <Text style={[s.optionText, selected && s.optionTextActive]}>
                  {option.text ?? option.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      )}

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
