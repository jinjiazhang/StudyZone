'use client';

import { useState } from 'react';
import type { NumericInputPrompt } from '@studyzone/shared-types';

export function NumericInputExercise({
  prompt,
  onSubmit,
  disabled,
}: {
  prompt: NumericInputPrompt;
  onSubmit: (payload: { value: number }) => void;
  disabled?: boolean;
}) {
  const [text, setText] = useState('');

  return (
    <div className="flex flex-col gap-6">
      <div className="text-xs font-heavy uppercase tracking-widest text-sz-ink-soft">计算</div>
      <h2 className="text-2xl font-heavy text-sz-ink md:text-3xl">算一算</h2>

      <div className="rounded-3xl border-2 border-b-[6px] border-sz-line bg-white p-8 text-center text-5xl font-heavy text-sz-ink md:text-6xl">
        {prompt.statement}
      </div>
      <input
        value={text}
        onChange={(e) => setText(e.target.value.replace(/[^0-9.\-]/g, ''))}
        disabled={disabled}
        inputMode="numeric"
        placeholder="输入答案"
        className="input p-6 text-center text-3xl font-heavy"
      />
      <button
        disabled={text === '' || disabled}
        onClick={() => onSubmit({ value: Number(text) })}
        className="btn-primary mt-2"
      >
        检 查
      </button>
    </div>
  );
}
