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
      <div className="text-xs font-heavy uppercase tracking-widest text-sz-ink-soft">配对</div>
      <h2 className="text-2xl font-heavy text-sz-ink md:text-3xl">点击两侧组成配对</h2>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-2">
          {prompt.left.map((item) => {
            const matched = !!pairs[item.id];
            const picked = pickedLeft === item.id;
            return (
              <button
                key={item.id}
                disabled={disabled}
                onClick={() => toggleLeft(item.id)}
                className={clsx(
                  'option-tile',
                  matched && 'option-tile-correct',
                  picked && 'border-sz-gold bg-yellow-50 text-sz-gold-dark',
                )}
              >
                {item.text}
              </button>
            );
          })}
        </div>
        <div className="flex flex-col gap-2">
          {prompt.right.map((item) => (
            <button
              key={item.id}
              disabled={disabled || usedRight.has(item.id)}
              onClick={() => pickRight(item.id)}
              className={clsx(
                'option-tile',
                usedRight.has(item.id) && 'option-tile-correct',
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
        className="btn-primary mt-2"
      >
        检 查
      </button>
    </div>
  );
}
