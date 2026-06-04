'use client';

import { useRef, useState } from 'react';
import clsx from 'clsx';
import { Volume2, Turtle } from 'lucide-react';
import type { ListenChoicePrompt } from '@studyzone/shared-types';

export function ListenChoiceExercise({
  prompt,
  onSubmit,
  disabled,
}: {
  prompt: ListenChoicePrompt;
  onSubmit: (payload: { correctOptionId: string }) => void;
  disabled?: boolean;
}) {
  const [pick, setPick] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const slowAudioRef = useRef<HTMLAudioElement | null>(null);

  function play(slow = false) {
    const el = slow ? slowAudioRef.current : audioRef.current;
    if (!el) return;
    el.currentTime = 0;
    el.play();
  }

  const hasImages = prompt.options.some((opt) => !!opt.imageUrl);

  return (
    <div className="flex flex-col gap-6">
      <div className="text-xs font-heavy uppercase tracking-widest text-sz-ink-soft">听力选择</div>
      <h2 className="text-2xl font-heavy text-sz-ink md:text-3xl">{prompt.question ?? '听音频，选出正确答案'}</h2>

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

      <div className={clsx('grid gap-3', hasImages ? 'sm:grid-cols-2' : 'grid-cols-1')}>
        {prompt.options.map((opt) => (
          <button
            key={opt.id}
            disabled={disabled}
            onClick={() => setPick(opt.id)}
            className={clsx(
              'overflow-hidden rounded-2xl border-2 border-b-[4px] bg-white text-left font-heavy text-sz-ink transition-transform duration-100 active:translate-y-[2px] active:border-b-2',
              pick === opt.id ? 'border-sz-sky bg-sky-50 text-sz-sky-dark' : 'border-sz-line hover:bg-sz-mist',
            )}
          >
            {opt.imageUrl && (
              <div className="aspect-[4/3] bg-sz-mist">
                <img src={opt.imageUrl} alt={opt.label ?? opt.text ?? ''} className="h-full w-full object-cover" />
              </div>
            )}
            {(opt.text || opt.label) && <div className="px-4 py-3">{opt.text ?? opt.label}</div>}
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
