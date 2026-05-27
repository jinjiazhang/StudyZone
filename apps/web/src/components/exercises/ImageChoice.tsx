'use client';

import { useRef, useState } from 'react';
import clsx from 'clsx';
import { Volume2 } from 'lucide-react';
import type { ImageChoicePrompt } from '@studyzone/shared-types';

export function ImageChoiceExercise({
  prompt,
  onSubmit,
  disabled,
}: {
  prompt: ImageChoicePrompt;
  onSubmit: (payload: { correctOptionId: string }) => void;
  disabled?: boolean;
}) {
  const [pick, setPick] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  return (
    <div className="flex flex-col gap-6">
      <div className="text-xs font-heavy uppercase tracking-widest text-sz-ink-soft">看图选择</div>
      <h2 className="text-2xl font-heavy text-sz-ink md:text-3xl">这是哪一个？</h2>

      <div className="flex items-center gap-3 rounded-2xl border-2 border-sz-line bg-white px-5 py-4">
        {prompt.audioUrl && (
          <>
            <button
              type="button"
              onClick={() => {
                if (audioRef.current) {
                  audioRef.current.currentTime = 0;
                  audioRef.current.play();
                }
              }}
              className="flex h-12 w-12 items-center justify-center rounded-full bg-sz-sky text-white shadow-pop-sky"
            >
              <Volume2 className="h-6 w-6" />
            </button>
            <audio ref={audioRef} src={prompt.audioUrl} preload="auto" className="hidden" />
          </>
        )}
        <div className="text-3xl font-heavy text-sz-ink md:text-4xl">{prompt.word}</div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {prompt.options.map((opt) => (
          <button
            key={opt.id}
            disabled={disabled}
            onClick={() => setPick(opt.id)}
            className={clsx(
              'overflow-hidden rounded-2xl border-2 border-b-[4px] bg-white text-left font-heavy text-sz-ink transition-transform duration-100 active:translate-y-[2px] active:border-b-2',
              pick === opt.id
                ? 'border-sz-sky bg-sky-50 text-sz-sky-dark'
                : 'border-sz-line hover:bg-sz-mist',
            )}
          >
            <div className="aspect-[4/3] bg-sz-mist">
              <img src={opt.imageUrl} alt={opt.label} className="h-full w-full object-cover" />
            </div>
            <div className="px-4 py-3">{opt.label}</div>
          </button>
        ))}
      </div>
      <button
        disabled={!pick || disabled}
        onClick={() => pick && onSubmit({ correctOptionId: pick })}
        className="btn-primary mt-2"
      >
        检 查
      </button>
    </div>
  );
}
