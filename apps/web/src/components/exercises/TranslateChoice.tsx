'use client';

import { useState } from 'react';
import clsx from 'clsx';
import type { TranslateChoicePrompt } from '@studyzone/shared-types';
import { Mascot } from '@/components/Mascot';

export function TranslateChoiceExercise({
  prompt,
  onSubmit,
  disabled,
}: {
  prompt: TranslateChoicePrompt;
  onSubmit: (payload: { correctIndex: number }) => void;
  disabled?: boolean;
}) {
  const [pick, setPick] = useState<number | null>(null);

  return (
    <div className="flex flex-col gap-6">
      <div className="text-xs font-heavy uppercase tracking-widest text-sz-ink-soft">翻译这句话</div>
      <h2 className="text-2xl font-heavy text-sz-ink md:text-3xl">把它翻译成英语</h2>

      <div className="flex items-end gap-3">
        <Mascot size={80} />
        <div className="relative flex-1 rounded-2xl border-2 border-sz-line bg-white px-5 py-4 text-xl font-heavy text-sz-ink md:text-2xl">
          {prompt.source}
          <span
            aria-hidden
            className="absolute -left-3 top-6 h-4 w-4 rotate-45 border-b-2 border-l-2 border-sz-line bg-white"
          />
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {prompt.options.map((opt, idx) => (
          <button
            key={idx}
            disabled={disabled}
            onClick={() => setPick(idx)}
            className={clsx('option-tile flex items-center gap-3', pick === idx && 'option-tile-active')}
          >
            <span className={clsx(
              'flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border-2 text-sm font-heavy',
              pick === idx ? 'border-sz-sky bg-white text-sz-sky-dark' : 'border-sz-line bg-white text-sz-ink-soft',
            )}>
              {idx + 1}
            </span>
            <span className="flex-1">{opt}</span>
          </button>
        ))}
      </div>
      <button
        disabled={pick === null || disabled}
        onClick={() => pick !== null && onSubmit({ correctIndex: pick })}
        className="btn-primary mt-2"
      >
        检 查
      </button>
    </div>
  );
}
