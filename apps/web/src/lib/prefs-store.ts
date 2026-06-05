'use client';

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

interface PrefsState {
  /** Auto-play "念题" narration when each exercise opens. Default off. */
  autoNarrate: boolean;
  setAutoNarrate: (on: boolean) => void;
}

export const usePrefsStore = create<PrefsState>()(
  persist(
    (set) => ({
      autoNarrate: false,
      setAutoNarrate: (autoNarrate) => set({ autoNarrate }),
    }),
    {
      name: 'studyzone-prefs',
      storage: createJSONStorage(() => localStorage),
    },
  ),
);
