'use client';

import { useState } from 'react';
import clsx from 'clsx';
import type { PoemCompletePrompt } from '@studyzone/shared-types';

export function PoemCompleteExercise({
  prompt,
  onSubmit,
  disabled,
}: {
  prompt: PoemCompletePrompt;
  onSubmit: (payload: { correctIndex: number }) => void;
  disabled?: boolean;
}) {
  const [pick, setPick] = useState<number | null>(null);

  return (
    <div className="flex flex-col gap-6">
      <div className="text-xs font-heavy uppercase tracking-widest text-sz-ink-soft">
        古诗填空
      </div>

      <div className="flex flex-col items-center gap-3 rounded-2xl bg-sz-bg-soft px-6 py-6 text-center">
        <div className="text-xl font-heavy text-sz-ink">《{prompt.title}》</div>
        <div className="text-sm text-sz-ink-soft">— {prompt.author}</div>
        <div className="mt-3 flex flex-col gap-2">
          {prompt.lines.map((line, lineIdx) => (
            <div
              key={lineIdx}
              className="flex flex-wrap items-baseline justify-center gap-1 text-2xl font-heavy text-sz-ink md:text-3xl"
            >
              {line.map((segment, segIdx) =>
                segment === null ? (
                  <span
                    key={segIdx}
                    className={clsx(
                      'mx-1 inline-flex min-w-[3.5rem] items-center justify-center rounded-lg border-2 border-dashed border-sz-sky px-3 py-1 text-sz-sky-dark',
                      pick !== null && 'border-solid bg-sz-sky/10',
                    )}
                  >
                    {pick !== null ? prompt.options[pick] : '＿＿'}
                  </span>
                ) : (
                  <span key={segIdx}>{segment}</span>
                ),
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {prompt.options.map((opt, idx) => (
          <button
            key={idx}
            disabled={disabled}
            onClick={() => setPick(idx)}
            className={clsx(
              'option-tile flex items-center gap-3',
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
            <span className="flex-1 font-heavy">{opt}</span>
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
