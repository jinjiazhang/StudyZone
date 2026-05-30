import { useEffect, useRef } from 'react';
import { Audio } from 'expo-av';

type AnswerResult = 'correct' | 'wrong';

export function useAnswerSounds() {
  const correctSound = useRef<Audio.Sound | null>(null);
  const wrongSound = useRef<Audio.Sound | null>(null);

  useEffect(() => {
    let mounted = true;

    async function loadSounds() {
      await Audio.setAudioModeAsync({ playsInSilentModeIOS: true });
      const [correct, wrong] = await Promise.all([
        Audio.Sound.createAsync(require('../assets/sounds/answer-correct.wav')),
        Audio.Sound.createAsync(require('../assets/sounds/answer-wrong.wav')),
      ]);

      if (!mounted) {
        await Promise.all([correct.sound.unloadAsync(), wrong.sound.unloadAsync()]);
        return;
      }

      correctSound.current = correct.sound;
      wrongSound.current = wrong.sound;
    }

    void loadSounds().catch(() => {
      // Lesson feedback should keep working even if a device cannot initialize audio.
    });

    return () => {
      mounted = false;
      const loadedSounds = [correctSound.current, wrongSound.current];
      correctSound.current = null;
      wrongSound.current = null;
      void Promise.all(loadedSounds.map((sound) => sound?.unloadAsync()));
    };
  }, []);

  async function playAnswerSound(result: AnswerResult) {
    const sound = result === 'correct' ? correctSound.current : wrongSound.current;
    await sound?.replayAsync();
  }

  return { playAnswerSound };
}
