'use client';

import { useEffect, useRef, useState } from 'react';
import clsx from 'clsx';
import { Volume2, Square } from 'lucide-react';
import type { ExercisePrompt } from '@studyzone/shared-types';
import { usePrefsStore } from '@/lib/prefs-store';

/**
 * "念题" (read-aloud) control shown above the exercise body. Two-tier fallback
 * (a third tier — synthesizing text from the prompt shape — is planned and will
 * plug into the same entry point):
 *   1. `narrationUrl`: play the recorded clip via <audio>.
 *   2. `narrationText`: speak it via the Web Speech API.
 * Renders nothing when the prompt has no narration.
 */

function hasNarration(prompt: ExercisePrompt): boolean {
  return !!(prompt.narrationUrl || prompt.narrationText);
}

/** Pick a TTS language from the text itself: any CJK char => Chinese. */
function detectLanguage(text: string): string {
  return /[一-鿿]/.test(text) ? 'zh-CN' : 'en-US';
}

export function NarrateButton({ prompt }: { prompt: ExercisePrompt }) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [speaking, setSpeaking] = useState(false);
  const autoNarrate = usePrefsStore((s) => s.autoNarrate);

  function stop() {
    if (typeof window !== 'undefined') window.speechSynthesis?.cancel();
    const el = audioRef.current;
    if (el) {
      el.pause();
      el.currentTime = 0;
    }
    setSpeaking(false);
  }

  function speak() {
    // Tier 1: pre-recorded narration clip.
    if (prompt.narrationUrl) {
      window.speechSynthesis?.cancel();
      const el = audioRef.current;
      if (!el) return;
      el.currentTime = 0;
      void el.play().catch(() => setSpeaking(false));
      setSpeaking(true);
      return;
    }
    // Tier 2: device TTS over prompt text.
    if (prompt.narrationText && typeof window !== 'undefined' && window.speechSynthesis) {
      const text = prompt.narrationText;
      window.speechSynthesis.cancel();
      const utter = new SpeechSynthesisUtterance(text);
      utter.lang = detectLanguage(text);
      utter.onend = () => setSpeaking(false);
      utter.onerror = () => setSpeaking(false);
      setSpeaking(true);
      window.speechSynthesis.speak(utter);
    }
  }

  // Auto-play (and reset) whenever the prompt changes.
  useEffect(() => {
    if (autoNarrate && hasNarration(prompt)) speak();
    return () => stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prompt]);

  if (!hasNarration(prompt)) return null;

  return (
    <>
      <button
        type="button"
        onClick={() => (speaking ? stop() : speak())}
        className={clsx(
          'mb-3 inline-flex items-center gap-1.5 rounded-full border-2 px-4 py-2 text-sm font-bold transition-colors',
          speaking
            ? 'border-sz-sky-dark bg-sz-sky text-white'
            : 'border-sz-sky bg-sz-sky/10 text-sz-sky-dark',
        )}
      >
        {speaking ? <Square size={16} className="fill-current" /> : <Volume2 size={16} />}
        {speaking ? '停止' : '念题'}
      </button>
      {prompt.narrationUrl && (
        <audio
          ref={audioRef}
          src={prompt.narrationUrl}
          preload="auto"
          className="hidden"
          onEnded={() => setSpeaking(false)}
        />
      )}
    </>
  );
}
