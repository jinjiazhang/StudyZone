import { useEffect } from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import { Volume2, Square } from 'lucide-react-native';
import type { ExercisePrompt } from '@studyzone/shared-types';
import { colors, fonts, radius } from '@/lib/theme';
import { useSpeech, hasNarration } from '@/lib/speech';
import { usePrefs } from '@/lib/prefs';

/**
 * "念题" control shown above the exercise body. Reads the prompt aloud
 * (recorded clip first, else device TTS over `narrationText`). Auto-plays once
 * per exercise when the learner has enabled auto-narrate. Renders nothing when
 * the prompt has no narration to read.
 */
export function NarrateButton({ prompt }: { prompt: ExercisePrompt }) {
  const { speak, stop, speaking } = useSpeech();
  const autoNarrate = usePrefs((s) => s.autoNarrate);

  // Auto-play (and reset) whenever the prompt changes.
  useEffect(() => {
    if (autoNarrate && hasNarration(prompt)) {
      speak(prompt);
    }
    return () => stop();
    // Re-run per exercise; `speak`/`stop` are stable per hook instance.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prompt]);

  if (!hasNarration(prompt)) return null;

  return (
    <Pressable
      onPress={() => (speaking ? stop() : speak(prompt))}
      style={[styles.btn, speaking && styles.btnActive]}
    >
      {speaking ? (
        <Square size={18} color={colors.white} fill={colors.white} />
      ) : (
        <Volume2 size={18} color={colors.skyDark} />
      )}
      <Text style={[styles.text, speaking && styles.textActive]}>
        {speaking ? '停止' : '念题'}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  btn: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: radius.full,
    backgroundColor: '#EFF6FF',
    borderWidth: 2,
    borderColor: colors.sky,
    marginBottom: 12,
  },
  btnActive: { backgroundColor: colors.sky, borderColor: colors.skyDark },
  text: { fontFamily: fonts.heavy, fontSize: 14, color: colors.skyDark },
  textActive: { color: colors.white },
});
