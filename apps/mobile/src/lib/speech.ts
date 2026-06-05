import { useCallback, useEffect, useState } from 'react';
import * as Speech from 'expo-speech';
import type { ExercisePrompt } from '@studyzone/shared-types';
import { resolveAssetUrl } from './assets';
import { useAudio } from './audio';

/**
 * "念题" (read-aloud) for low-grade learners who can't yet read the prompt.
 *
 * Two-tier fallback (a third tier — synthesizing text from the prompt shape —
 * is planned and will plug into the same `speak` entry point):
 *   1. `narrationUrl`: play the pre-recorded clip.
 *   2. `narrationText`: speak it via on-device TTS.
 * If neither is present there's nothing to read; `hasNarration` lets the UI
 * hide/disable the button.
 */

/** Pick a TTS language from the text itself: any CJK char => Chinese. */
function detectLanguage(text: string): string {
  return /[一-鿿]/.test(text) ? 'zh-CN' : 'en-US';
}

export function hasNarration(prompt: ExercisePrompt): boolean {
  return !!(prompt.narrationUrl || prompt.narrationText);
}

export function useSpeech() {
  const { play, stop: stopAudio, playingUrl } = useAudio();
  const [speakingText, setSpeakingText] = useState(false);

  // Make sure TTS is silenced if the component unmounts mid-utterance.
  useEffect(() => {
    return () => {
      void Speech.stop();
    };
  }, []);

  const stop = useCallback(() => {
    void Speech.stop();
    setSpeakingText(false);
    void stopAudio();
  }, [stopAudio]);

  const speak = useCallback(
    (prompt: ExercisePrompt) => {
      // Tier 1: pre-recorded narration clip.
      if (prompt.narrationUrl) {
        void Speech.stop();
        setSpeakingText(false);
        void play(resolveAssetUrl(prompt.narrationUrl));
        return;
      }
      // Tier 2: device TTS over prompt text.
      if (prompt.narrationText) {
        const text = prompt.narrationText;
        void stopAudio();
        Speech.stop();
        setSpeakingText(true);
        Speech.speak(text, {
          language: detectLanguage(text),
          onDone: () => setSpeakingText(false),
          onStopped: () => setSpeakingText(false),
          onError: () => setSpeakingText(false),
        });
      }
    },
    [play, stopAudio],
  );

  const speaking = speakingText || playingUrl != null;

  return { speak, stop, speaking };
}
