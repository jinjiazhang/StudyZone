'use client';

import { useState } from 'react';
import type { TranslateInputPrompt } from '@studyzone/shared-types';

export function TranslateInputExercise({
  prompt,
  onSubmit,
  disabled,
}: {
  prompt: TranslateInputPrompt;
  onSubmit: (payload: { accepted: string[] }) => void;
  disabled?: boolean;
}) {
  const [text, setText] = useState('');

  return (
    <div className="flex flex-col gap-6">
      <h2 className="text-xl font-extrabold text-sz-ink">输入下面这句话的英语</h2>
      <div className="rounded-chunky border-2 border-sz-ink/10 bg-white p-6 text-2xl font-bold">
        {prompt.source}
      </div>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        disabled={disabled}
        rows={3}
        placeholder="在这里输入英语..."
        className="rounded-chunky border-2 border-sz-ink/10 bg-white p-4 text-lg focus:border-sz-green focus:outline-none"
      />
      <button
        disabled={!text.trim() || disabled}
        onClick={() => onSubmit({ accepted: [text.trim()] })}
        className="btn-primary disabled:opacity-40"
      >
        检查答案
      </button>
    </div>
  );
}
