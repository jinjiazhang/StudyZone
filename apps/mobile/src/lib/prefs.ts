import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import * as SecureStore from 'expo-secure-store';

interface PrefsState {
  /** Auto-play "念题" narration when each exercise opens. Default off. */
  autoNarrate: boolean;
  setAutoNarrate: (on: boolean) => void;
  /** Haptic feedback on answers, taps and celebrations. Default on. */
  haptics: boolean;
  setHaptics: (on: boolean) => void;
}

const secureStorage = {
  getItem: (name: string) => SecureStore.getItemAsync(name),
  setItem: (name: string, value: string) => SecureStore.setItemAsync(name, value),
  removeItem: (name: string) => SecureStore.deleteItemAsync(name),
};

export const usePrefs = create<PrefsState>()(
  persist(
    (set) => ({
      autoNarrate: false,
      setAutoNarrate: (autoNarrate) => set({ autoNarrate }),
      haptics: true,
      setHaptics: (haptics) => set({ haptics }),
    }),
    {
      name: 'studyzone-prefs',
      storage: createJSONStorage(() => secureStorage),
    },
  ),
);
