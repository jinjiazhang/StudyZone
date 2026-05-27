'use client';

import { useState } from 'react';
import type { TranslateInputPrompt } from '@studyzone/shared-types';
import { Mascot } from '@/components/Mascot';

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
      <div className="text-xs font-heavy uppercase tracking-widest text-sz-ink-soft">输入翻译</div>
      <h2 className="text-2xl font-heavy text-sz-ink md:text-3xl">写出下面这句话的英语</h2>

      <div className="flex items-end gap-3">
        <Mascot size={68} />
        <div className="relative flex-1 rounded-2xl border-2 border-sz-line bg-white px-5 py-4 text-xl font-heavy text-sz-ink md:text-2xl">
          {prompt.source}
          <span
            aria-hidden
            className="absolute -left-3 top-6 h-4 w-4 rotate-45 border-b-2 border-l-2 border-sz-line bg-white"
          />
        </div>
      </div>

      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        disabled={disabled}
        rows={3}
        placeholder="在这里输入英语..."
        className="input min-h-[120px] resize-none text-lg"
      />
      <button
        disabled={!text.trim() || disabled}
        onClick={() => onSubmit({ accepted: [text.trim()] })}
        className="btn-primary mt-2"
      >
        检 查
      </button>
    </div>
  );
}
