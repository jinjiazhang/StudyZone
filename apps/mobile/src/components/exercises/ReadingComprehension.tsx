import { useState } from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { Volume2 } from 'lucide-react-native';
import type { ReadingComprehensionPrompt } from '@studyzone/shared-types';
import { colors, fonts, radius } from '@/lib/theme';
import { resolveAssetUrl } from '@/lib/assets';
import { useAudio } from '@/lib/audio';
import { exerciseStyles as s } from './styles';
import { OptionList } from './OptionList';
import { SubmitButton } from './SubmitButton';

export function ReadingComprehensionExercise({
  prompt,
  onSubmit,
  disabled,
}: {
  prompt: ReadingComprehensionPrompt;
  onSubmit: (payload: { correctIndices: number[] }) => void;
  disabled?: boolean;
}) {
  const [picks, setPicks] = useState<(number | null)[]>(() => prompt.questions.map(() => null));
  const { play, playingUrl } = useAudio();
  const allAnswered = picks.every((p) => p !== null);

  function setPick(qIdx: number, optIdx: number) {
    setPicks((prev) => prev.map((p, i) => (i === qIdx ? optIdx : p)));
  }

  return (
    <View style={s.container}>
      <Text style={s.labelSmall}>阅读理解</Text>
      {prompt.title && <Text style={s.promptBold}>{prompt.title}</Text>}

      {prompt.imageUrl && (
        <Image source={{ uri: resolveAssetUrl(prompt.imageUrl) }} style={local.image} />
      )}

      <View style={s.promptCard}>
        {prompt.audioUrl && (
          <Pressable onPress={() => play(prompt.audioUrl)} style={{ marginBottom: 8 }}>
            <Volume2 size={20} color={playingUrl === prompt.audioUrl ? colors.skyDark : colors.sky} />
          </Pressable>
        )}
        {prompt.passage.split('\n').map((para, i) => (
          <Text key={i} style={local.passage}>
            {para}
          </Text>
        ))}
      </View>

      {prompt.questions.map((q, qIdx) => (
        <View key={qIdx} style={{ gap: 8 }}>
          <Text style={local.question}>
            {qIdx + 1}. {q.question}
          </Text>
          <OptionList
            options={q.options}
            pick={picks[qIdx] ?? null}
            onPick={(optIdx) => setPick(qIdx, optIdx)}
            disabled={disabled}
          />
        </View>
      ))}

      <SubmitButton
        onPress={() => allAnswered && onSubmit({ correctIndices: picks as number[] })}
        disabled={!allAnswered || disabled}
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
  passage: { fontFamily: fonts.sansBold, fontSize: 15, color: colors.ink, lineHeight: 22, marginBottom: 6 },
  question: { fontFamily: fonts.heavy, fontSize: 15, color: colors.ink },
});
