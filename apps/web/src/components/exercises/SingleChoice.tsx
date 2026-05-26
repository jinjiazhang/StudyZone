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
      <h2 className="text-xl font-extrabold text-sz-ink">{prompt.question}</h2>
      <div className="grid gap-3 sm:grid-cols-2">
        {prompt.options.map((opt, idx) => (
          <button
            key={idx}
            disabled={disabled}
            onClick={() => setPick(idx)}
            className={clsx(
              'rounded-chunky border-2 px-4 py-4 text-left text-lg font-bold transition',
              pick === idx
                ? 'border-sz-green bg-sz-green/10 text-sz-green'
                : 'border-sz-ink/10 bg-white hover:border-sz-ink/20',
            )}
          >
            {opt}
          </button>
        ))}
      </div>
      <button
        disabled={pick === null || disabled}
        onClick={() => pick !== null && onSubmit({ correctIndex: pick })}
        className="btn-primary disabled:opacity-40"
      >
        检查答案
      </button>
    </div>
  );
}
