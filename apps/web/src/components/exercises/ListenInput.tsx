'use client';

import { useRef, useState } from 'react';
import { Volume2, Turtle } from 'lucide-react';
import type { ListenInputPrompt } from '@studyzone/shared-types';

export function ListenInputExercise({
  prompt,
  onSubmit,
  disabled,
}: {
  prompt: ListenInputPrompt;
  onSubmit: (payload: { accepted: string[] }) => void;
  disabled?: boolean;
}) {
  const [text, setText] = useState('');
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const slowAudioRef = useRef<HTMLAudioElement | null>(null);

  function play(slow = false) {
    const el = slow ? slowAudioRef.current : audioRef.current;
    if (!el) return;
    el.currentTime = 0;
    el.play();
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="text-xs font-heavy uppercase tracking-widest text-sz-ink-soft">听力</div>
      <h2 className="text-2xl font-heavy text-sz-ink md:text-3xl">听音频，写出你听到的内容</h2>

      <div className="flex gap-3">
        <button
          type="button"
          onClick={() => play(false)}
          className="btn-sky flex h-20 flex-1 items-center justify-center gap-3 text-2xl"
        >
          <Volume2 className="h-8 w-8" />
          播 放
        </button>
        {prompt.audioUrlSlow && (
          <button
            type="button"
            onClick={() => play(true)}
            className="btn-secondary flex h-20 w-24 flex-col items-center justify-center gap-1 px-2"
          >
            <Turtle className="h-6 w-6" />
            <span className="text-xs">慢速</span>
          </button>
        )}
      </div>
      <audio ref={audioRef} src={prompt.audioUrl} preload="auto" className="hidden" />
      {prompt.audioUrlSlow && (
        <audio ref={slowAudioRef} src={prompt.audioUrlSlow} preload="auto" className="hidden" />
      )}

      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        disabled={disabled}
        rows={3}
        placeholder="输入你听到的句子..."
        className="input min-h-[120px] resize-none text-lg"
      />
      <button
        disabled={!text.trim() || disabled}
        onClick={() => onSubmit({ accepted: [text.trim()] })}
        className="btn-primary mt-2"
      >
        检 查
      </button>
    </div>
  );
}
