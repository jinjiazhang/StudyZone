'use client';

import { useState } from 'react';
import type { ListenInputPrompt } from '@studyzone/shared-types';

export function ListenInputExercise({
  prompt,
  onSubmit,
  disabled,
}: {
  prompt: ListenInputPrompt;
  onSubmit: (payload: { accepted: string[] }) => void;
  disabled?: boolean;
}) {
  const [text, setText] = useState('');

  return (
    <div className="flex flex-col gap-6">
      <h2 className="text-xl font-extrabold text-sz-ink">听音频，输入你听到的内容</h2>
      <div className="rounded-chunky border-2 border-sz-ink/10 bg-white p-5">
        <audio controls src={prompt.audioUrl} className="w-full" />
        {prompt.audioUrlSlow && (
          <div className="mt-4">
            <div className="mb-2 text-sm font-bold text-sz-ink/60">慢速播放</div>
            <audio controls src={prompt.audioUrlSlow} className="w-full" />
          </div>
        )}
      </div>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        disabled={disabled}
        rows={3}
        placeholder="输入你听到的句子..."
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
