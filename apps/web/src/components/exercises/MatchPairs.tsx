'use client';

import { useState } from 'react';
import clsx from 'clsx';
import type { MatchPairsPrompt } from '@studyzone/shared-types';

export function MatchPairsExercise({
  prompt,
  onSubmit,
  disabled,
}: {
  prompt: MatchPairsPrompt;
  onSubmit: (payload: { pairs: Record<string, string> }) => void;
  disabled?: boolean;
}) {
  const [pairs, setPairs] = useState<Record<string, string>>({});
  const [pickedLeft, setPickedLeft] = useState<string | null>(null);

  const usedRight = new Set(Object.values(pairs));

  function toggleLeft(id: string) {
    if (pairs[id]) {
      // unpair
      const { [id]: _, ...rest } = pairs;
      setPairs(rest);
      return;
    }
    setPickedLeft(id);
  }

  function pickRight(id: string) {
    if (!pickedLeft || usedRight.has(id)) return;
    setPairs({ ...pairs, [pickedLeft]: id });
    setPickedLeft(null);
  }

  return (
    <div className="flex flex-col gap-6">
      <h2 className="text-xl font-extrabold text-sz-ink">把左右两列配对</h2>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-2">
          {prompt.left.map((item) => (
            <button
              key={item.id}
              disabled={disabled}
              onClick={() => toggleLeft(item.id)}
              className={clsx(
                'rounded-chunky border-2 px-4 py-3 text-left font-bold transition',
                pairs[item.id]
                  ? 'border-sz-green bg-sz-green/10 text-sz-green'
                  : pickedLeft === item.id
                    ? 'border-sz-gold bg-yellow-50'
                    : 'border-sz-ink/10 bg-white',
              )}
            >
              {item.text}
            </button>
          ))}
        </div>
        <div className="flex flex-col gap-2">
          {prompt.right.map((item) => (
            <button
              key={item.id}
              disabled={disabled || usedRight.has(item.id)}
              onClick={() => pickRight(item.id)}
              className={clsx(
                'rounded-chunky border-2 px-4 py-3 text-left font-bold transition',
                usedRight.has(item.id)
                  ? 'border-sz-green bg-sz-green/10 text-sz-green'
                  : 'border-sz-ink/10 bg-white hover:border-sz-ink/20',
              )}
            >
              {item.text}
            </button>
          ))}
        </div>
      </div>
      <button
        disabled={Object.keys(pairs).length !== prompt.left.length || disabled}
        onClick={() => onSubmit({ pairs })}
        className="btn-primary disabled:opacity-40"
      >
        检查答案
      </button>
    </div>
  );
}
