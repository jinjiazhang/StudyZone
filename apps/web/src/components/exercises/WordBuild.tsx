'use client';

import { useMemo, useState } from 'react';
import clsx from 'clsx';
import type { WordBuildPrompt } from '@studyzone/shared-types';

export function WordBuildExercise({
  prompt,
  onSubmit,
  disabled,
}: {
  prompt: WordBuildPrompt;
  onSubmit: (payload: { selected: string[] }) => void;
  disabled?: boolean;
}) {
  const [picked, setPicked] = useState<number[]>([]); // indices into prompt.tokens, click order

  const remaining = useMemo(
    () => prompt.tokens.map((_, i) => i).filter((i) => !picked.includes(i)),
    [picked, prompt.tokens],
  );

  const atLimit = picked.length >= prompt.targetCount;
  const canSubmit = picked.length === prompt.targetCount;
  const instruction =
    prompt.instruction ??
    `从下面选 ${prompt.targetCount} 个能与「${prompt.character}」组词的字`;

  return (
    <div className="flex flex-col gap-6">
      <div className="text-xs font-heavy uppercase tracking-widest text-sz-ink-soft">
        组词
      </div>
      <h2 className="text-2xl font-heavy text-sz-ink md:text-3xl">{instruction}</h2>

      {/* Center character */}
      <div className="flex flex-col items-center gap-2 rounded-2xl bg-sz-bg-soft px-6 py-8">
        <span className="text-7xl font-heavy text-sz-ink md:text-8xl">
          {prompt.character}
        </span>
        <span className="text-xs font-heavy uppercase tracking-wider text-sz-ink-soft">
          已选 {picked.length} / {prompt.targetCount}
        </span>
      </div>

      {/* Answer slot */}
      <div className="min-h-[88px] rounded-2xl border-b-2 border-dashed border-sz-line bg-sz-mist p-3">
        <div className="flex flex-wrap gap-2">
          {picked.length === 0 && (
            <div className="px-2 py-2 text-sm font-heavy uppercase tracking-wider text-sz-ink-soft">
              点下方汉字开始组词
            </div>
          )}
          {picked.map((idx, i) => (
            <button
              key={`p-${i}`}
              disabled={disabled}
              onClick={() => setPicked(picked.filter((_, k) => k !== i))}
              className="token-chip token-chip-picked"
            >
              {prompt.tokens[idx]}
            </button>
          ))}
        </div>
      </div>

      {/* Token pool */}
      <div className="flex flex-wrap gap-2">
        {remaining.map((idx) => (
          <button
            key={idx}
            disabled={disabled || atLimit}
            onClick={() => setPicked([...picked, idx])}
            className={clsx('token-chip', atLimit && 'opacity-40')}
          >
            {prompt.tokens[idx]}
          </button>
        ))}
      </div>

      <button
        disabled={!canSubmit || disabled}
        onClick={() =>
          canSubmit &&
          onSubmit({
            selected: picked.map((i) => prompt.tokens[i]!).filter(Boolean),
          })
        }
        className="btn-primary mt-2"
      >
        检 查
      </button>
    </div>
  );
}
