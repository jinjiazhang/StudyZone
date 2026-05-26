'use client';

import { useMemo, useState } from 'react';
import clsx from 'clsx';
import type { WordBankPrompt } from '@studyzone/shared-types';

export function WordBankExercise({
  prompt,
  onSubmit,
  disabled,
}: {
  prompt: WordBankPrompt;
  onSubmit: (payload: { ordered: string[] }) => void;
  disabled?: boolean;
}) {
  const [picked, setPicked] = useState<number[]>([]); // indices into prompt.tokens

  const remaining = useMemo(
    () => prompt.tokens.map((_, i) => i).filter((i) => !picked.includes(i)),
    [picked, prompt.tokens],
  );

  return (
    <div className="flex flex-col gap-6">
      <h2 className="text-xl font-extrabold text-sz-ink">把单词排成一句话</h2>
      <div className="rounded-chunky border-2 border-sz-ink/10 bg-white p-6 text-2xl font-bold">
        {prompt.source}
      </div>

      <div className="min-h-[80px] rounded-chunky border-b-4 border-dashed border-sz-ink/20 p-3">
        <div className="flex flex-wrap gap-2">
          {picked.map((idx, i) => (
            <button
              key={`p-${i}`}
              disabled={disabled}
              onClick={() => setPicked(picked.filter((_, k) => k !== i))}
              className="rounded-chunky border-2 border-sz-green bg-white px-4 py-2 font-bold text-sz-green shadow-pop"
            >
              {prompt.tokens[idx]}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {remaining.map((idx) => (
          <button
            key={idx}
            disabled={disabled}
            onClick={() => setPicked([...picked, idx])}
            className={clsx(
              'rounded-chunky border-2 border-sz-ink/10 bg-white px-4 py-2 font-bold text-sz-ink shadow-pop transition hover:-translate-y-0.5',
            )}
          >
            {prompt.tokens[idx]}
          </button>
        ))}
      </div>

      <button
        disabled={picked.length === 0 || disabled}
        onClick={() => onSubmit({ ordered: picked.map((i) => prompt.tokens[i]!).filter(Boolean) })}
        className="btn-primary disabled:opacity-40"
      >
        检查答案
      </button>
    </div>
  );
}
