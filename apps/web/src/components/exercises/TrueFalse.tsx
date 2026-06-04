'use client';

import { useRef, useState } from 'react';
import clsx from 'clsx';
import { Volume2, Check, X } from 'lucide-react';
import type { TrueFalsePrompt } from '@studyzone/shared-types';

export function TrueFalseExercise({
  prompt,
  onSubmit,
  disabled,
}: {
  prompt: TrueFalsePrompt;
  onSubmit: (payload: { value: boolean }) => void;
  disabled?: boolean;
}) {
  const [pick, setPick] = useState<boolean | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  return (
    <div className="flex flex-col gap-6">
      <div className="text-xs font-heavy uppercase tracking-widest text-sz-ink-soft">判断正误</div>

      {prompt.imageUrl && (
        <div className="overflow-hidden rounded-2xl border-2 border-sz-line bg-sz-mist">
          <img src={prompt.imageUrl} alt="" className="max-h-64 w-full object-contain" />
        </div>
      )}

      <div className="flex items-center gap-3">
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
              className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-sz-sky text-white shadow-pop-sky"
            >
              <Volume2 className="h-6 w-6" />
            </button>
            <audio ref={audioRef} src={prompt.audioUrl} preload="auto" className="hidden" />
          </>
        )}
        <h2 className="text-2xl font-heavy text-sz-ink md:text-3xl">{prompt.statement}</h2>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <button
          disabled={disabled}
          onClick={() => setPick(true)}
          className={clsx(
            'flex items-center justify-center gap-2 rounded-2xl border-2 border-b-[4px] bg-white py-6 text-xl font-heavy transition-transform duration-100 active:translate-y-[2px] active:border-b-2',
            pick === true ? 'border-sz-green bg-green-50 text-sz-green-dark' : 'border-sz-line text-sz-ink hover:bg-sz-mist',
          )}
        >
          <Check className="h-6 w-6" />
          {prompt.trueLabel ?? '对'}
        </button>
        <button
          disabled={disabled}
          onClick={() => setPick(false)}
          className={clsx(
            'flex items-center justify-center gap-2 rounded-2xl border-2 border-b-[4px] bg-white py-6 text-xl font-heavy transition-transform duration-100 active:translate-y-[2px] active:border-b-2',
            pick === false ? 'border-sz-rose bg-rose-50 text-sz-rose-dark' : 'border-sz-line text-sz-ink hover:bg-sz-mist',
          )}
        >
          <X className="h-6 w-6" />
          {prompt.falseLabel ?? '错'}
        </button>
      </div>

      <button
        disabled={pick === null || disabled}
        onClick={() => pick !== null && onSubmit({ value: pick })}
        className="btn-primary mt-2"
      >
        检 查
      </button>
    </div>
  );
}
