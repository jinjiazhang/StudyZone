'use client';

import { useState } from 'react';
import clsx from 'clsx';
import type { SingleChoicePrompt } from '@studyzone/shared-types';

export function SingleChoiceExercise({
  prompt,
  onSubmit,
  disabled,
}: {
  prompt: SingleChoicePrompt;
  onSubmit: (payload: { correctIndex: number }) => void;
  disabled?: boolean;
}) {
  const [pick, setPick] = useState<number | null>(null);

  return (
    <div className="flex flex-col gap-6">
      <div className="text-xs font-heavy uppercase tracking-widest text-sz-ink-soft">单项选择</div>
      <h2 className="text-2xl font-heavy text-sz-ink md:text-3xl">{prompt.question}</h2>
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
              {String.fromCharCode(65 + idx)}
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
