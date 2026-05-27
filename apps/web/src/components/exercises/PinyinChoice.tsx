'use client';

import { useState } from 'react';
import clsx from 'clsx';
import type { PinyinChoicePrompt } from '@studyzone/shared-types';

export function PinyinChoiceExercise({
  prompt,
  onSubmit,
  disabled,
}: {
  prompt: PinyinChoicePrompt;
  onSubmit: (payload: { correctIndex: number }) => void;
  disabled?: boolean;
}) {
  const [pick, setPick] = useState<number | null>(null);

  return (
    <div className="flex flex-col gap-6">
      <div className="text-xs font-heavy uppercase tracking-widest text-sz-ink-soft">
        选出正确的拼音
      </div>
      <div className="flex flex-col items-center gap-2 py-4">
        <span className="text-7xl font-heavy text-sz-ink md:text-8xl">
          {prompt.character}
        </span>
        {prompt.hint ? (
          <span className="text-sm text-sz-ink-soft">{prompt.hint}</span>
        ) : null}
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        {prompt.options.map((opt, idx) => (
          <button
            key={idx}
            disabled={disabled}
            onClick={() => setPick(idx)}
            className={clsx(
              'option-tile flex items-center gap-3 text-lg',
              pick === idx && 'option-tile-active',
            )}
          >
            <span
              className={clsx(
                'flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border-2 text-sm font-heavy',
                pick === idx
                  ? 'border-sz-sky bg-white text-sz-sky-dark'
                  : 'border-sz-line bg-white text-sz-ink-soft',
              )}
            >
              {String.fromCharCode(65 + idx)}
            </span>
            <span className="flex-1 font-heavy tracking-wider">{opt}</span>
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
