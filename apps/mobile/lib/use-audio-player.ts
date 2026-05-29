import { useCallback, useEffect, useRef, useState } from 'react';
import { Audio } from 'expo-av';

/**
 * In-app playback for remote exercise audio (listen-input, image-choice, …).
 *
 * Mirrors the web app, which plays prompt audio inline via an <audio> element
 * rather than handing the URL off to the OS. On mobile we use expo-av and keep
 * a single Sound instance around, swapping its source when the URL changes so
 * we never leak loaded sounds. Playback restarts from the beginning on each
 * call (like clicking the web play button again).
 */
export function useAudioPlayer() {
  const soundRef = useRef<Audio.Sound | null>(null);
  const currentUrlRef = useRef<string | null>(null);
  const [playingUrl, setPlayingUrl] = useState<string | null>(null);

  useEffect(() => {
    void Audio.setAudioModeAsync({ playsInSilentModeIOS: true }).catch(() => {
      // Playback should degrade gracefully if the device can't set the mode.
    });
    return () => {
      const sound = soundRef.current;
      soundRef.current = null;
      currentUrlRef.current = null;
      void sound?.unloadAsync();
    };
  }, []);

  const play = useCallback(async (url?: string) => {
    if (!url) return;
    try {
      // Reuse the loaded sound when replaying the same clip; otherwise unload
      // the previous one and load the new URL.
      if (soundRef.current && currentUrlRef.current === url) {
        await soundRef.current.replayAsync();
      } else {
        await soundRef.current?.unloadAsync();
        const { sound } = await Audio.Sound.createAsync(
          { uri: url },
          { shouldPlay: true },
        );
        soundRef.current = sound;
        currentUrlRef.current = url;
        sound.setOnPlaybackStatusUpdate((status) => {
          if (status.isLoaded && status.didJustFinish) {
            setPlayingUrl((prev) => (prev === url ? null : prev));
          }
        });
      }
      setPlayingUrl(url);
    } catch {
      // Swallow playback errors so a bad/unreachable URL never breaks the lesson.
      setPlayingUrl(null);
    }
  }, []);

  return { play, playingUrl };
}
