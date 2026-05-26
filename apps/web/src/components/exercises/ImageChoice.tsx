'use client';

import { useState } from 'react';
import clsx from 'clsx';
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

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-xl font-extrabold text-sz-ink">选择匹配的图片</h2>
        <div className="mt-2 text-3xl font-extrabold text-sz-ink">{prompt.word}</div>
        {prompt.audioUrl && <audio controls src={prompt.audioUrl} className="mt-4 w-full" />}
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        {prompt.options.map((opt) => (
          <button
            key={opt.id}
            disabled={disabled}
            onClick={() => setPick(opt.id)}
            className={clsx(
              'overflow-hidden rounded-chunky border-2 bg-white text-left font-bold transition',
              pick === opt.id
                ? 'border-sz-green bg-sz-green/10 text-sz-green'
                : 'border-sz-ink/10 hover:border-sz-ink/20',
            )}
          >
            <div className="aspect-[4/3] bg-sz-ink/5">
              <img src={opt.imageUrl} alt={opt.label} className="h-full w-full object-cover" />
            </div>
            <div className="p-3">{opt.label}</div>
          </button>
        ))}
      </div>
      <button
        disabled={!pick || disabled}
        onClick={() => pick && onSubmit({ correctOptionId: pick })}
        className="btn-primary disabled:opacity-40"
      >
        检查答案
      </button>
    </div>
  );
}
