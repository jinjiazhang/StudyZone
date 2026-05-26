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
      <h2 className="text-xl font-extrabold text-sz-ink">算一算</h2>
      <div className="rounded-chunky border-2 border-sz-ink/10 bg-white p-8 text-center text-4xl font-extrabold">
        {prompt.statement}
      </div>
      <input
        value={text}
        onChange={(e) => setText(e.target.value.replace(/[^0-9.\-]/g, ''))}
        disabled={disabled}
        inputMode="numeric"
        placeholder="输入答案"
        className="rounded-chunky border-2 border-sz-ink/10 bg-white p-4 text-center text-3xl font-extrabold focus:border-sz-green focus:outline-none"
      />
      <button
        disabled={text === '' || disabled}
        onClick={() => onSubmit({ value: Number(text) })}
        className="btn-primary disabled:opacity-40"
      >
        检查答案
      </button>
    </div>
  );
}
