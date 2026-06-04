'use client';

import { useState } from 'react';
import clsx from 'clsx';
import type { DialogueCompletePrompt } from '@studyzone/shared-types';

export function DialogueCompleteExercise({
  prompt,
  onSubmit,
  disabled,
}: {
  prompt: DialogueCompletePrompt;
  onSubmit: (payload: { correctIndex: number }) => void;
  disabled?: boolean;
}) {
  const [pick, setPick] = useState<number | null>(null);

  return (
    <div className="flex flex-col gap-6">
      <div className="text-xs font-heavy uppercase tracking-widest text-sz-ink-soft">情景对话</div>
      <h2 className="text-2xl font-heavy text-sz-ink md:text-3xl">选出最合适的一句话补全对话</h2>

      {prompt.imageUrl && (
        <div className="overflow-hidden rounded-2xl border-2 border-sz-line bg-sz-mist">
          <img src={prompt.imageUrl} alt="" className="max-h-56 w-full object-contain" />
        </div>
      )}

      <div className="flex flex-col gap-3">
        {prompt.turns.map((turn, idx) => {
          const isBlank = idx === prompt.blankIndex;
          const left = idx % 2 === 0;
          return (
            <div key={idx} className={clsx('flex', left ? 'justify-start' : 'justify-end')}>
              <div className={clsx('max-w-[85%]', left ? 'text-left' : 'text-right')}>
                <div className="mb-1 text-xs font-heavy uppercase tracking-wide text-sz-ink-soft">{turn.speaker}</div>
                <div
                  className={clsx(
                    'rounded-2xl border-2 px-4 py-3 font-heavy',
                    isBlank
                      ? 'border-dashed border-sz-sky bg-sky-50 text-sz-sky-dark'
                      : left
                        ? 'border-sz-line bg-white text-sz-ink'
                        : 'border-sz-line bg-sz-mist text-sz-ink',
                  )}
                >
                  {isBlank ? (pick !== null ? prompt.options[pick] : '? ? ?') : turn.text}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {prompt.options.map((opt, idx) => (
          <button
            key={idx}
            disabled={disabled}
            onClick={() => setPick(idx)}
            className={clsx('option-tile flex items-center gap-3', pick === idx && 'option-tile-active')}
          >
            <span
              className={clsx(
                'flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border-2 text-sm font-heavy',
                pick === idx ? 'border-sz-sky bg-white text-sz-sky-dark' : 'border-sz-line bg-white text-sz-ink-soft',
              )}
            >
              {String.fromCharCode(65 + idx)}
            </span>
            <span className="flex-1 text-left">{opt}</span>
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
