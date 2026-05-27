'use client';

import { useMemo, useState } from 'react';
import type { WordBankPrompt } from '@studyzone/shared-types';
import { Mascot } from '@/components/Mascot';

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
      <div className="text-xs font-heavy uppercase tracking-widest text-sz-ink-soft">单词排序</div>
      <h2 className="text-2xl font-heavy text-sz-ink md:text-3xl">把单词排成一句话</h2>

      <div className="flex items-end gap-3">
        <Mascot size={80} />
        <div className="relative flex-1 rounded-2xl border-2 border-sz-line bg-white px-5 py-4 text-xl font-heavy text-sz-ink md:text-2xl">
          {prompt.source}
          <span
            aria-hidden
            className="absolute -left-3 top-6 h-4 w-4 rotate-45 border-b-2 border-l-2 border-sz-line bg-white"
          />
        </div>
      </div>

      {/* Answer slot */}
      <div className="min-h-[88px] rounded-2xl border-b-2 border-dashed border-sz-line bg-sz-mist p-3">
        <div className="flex flex-wrap gap-2">
          {picked.length === 0 && (
            <div className="px-2 py-2 text-sm font-heavy uppercase tracking-wider text-sz-ink-soft">
              点下方单词组成句子
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

      {/* Word bank */}
      <div className="flex flex-wrap gap-2">
        {remaining.map((idx) => (
          <button
            key={idx}
            disabled={disabled}
            onClick={() => setPicked([...picked, idx])}
            className="token-chip"
          >
            {prompt.tokens[idx]}
          </button>
        ))}
      </div>

      <button
        disabled={picked.length === 0 || disabled}
        onClick={() => onSubmit({ ordered: picked.map((i) => prompt.tokens[i]!).filter(Boolean) })}
        className="btn-primary mt-2"
      >
        检 查
      </button>
    </div>
  );
}
