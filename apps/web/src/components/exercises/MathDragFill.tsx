'use client';

import { useState } from 'react';
import type { MathDragFillPrompt } from '@studyzone/shared-types';
import { CheckButton, MathShell, TokenButton, type ExerciseProps } from './MathShared';

export function MathDragFillExercise({
  prompt,
  onSubmit,
  disabled,
}: ExerciseProps<MathDragFillPrompt, { fills: string[] }>) {
  const blankCount = prompt.statement.filter((part) => part === null).length;
  const [picked, setPicked] = useState<number[]>([]);
  const remaining = prompt.tokens.map((_, index) => index).filter((index) => !picked.includes(index));
  let blankIndex = 0;
  return (
    <MathShell label="拖拽填空" title="补全算式">
      <div className="flex flex-wrap items-center gap-2 rounded-2xl border-2 border-sz-line bg-white p-5 text-2xl font-heavy text-sz-ink">
        {prompt.statement.map((part, index) => {
          if (part !== null) return <span key={index}>{part}</span>;
          const currentBlank = blankIndex++;
          const tokenIndex = picked[currentBlank];
          return (
            <button
              key={index}
              disabled={disabled || tokenIndex === undefined}
              onClick={() => setPicked(picked.filter((_, pickedIndex) => pickedIndex !== currentBlank))}
              className="min-h-12 min-w-20 rounded-xl border-2 border-dashed border-sz-line bg-sz-mist px-4 py-2 text-sz-sky-dark"
            >
              {tokenIndex === undefined ? '?' : prompt.tokens[tokenIndex]}
            </button>
          );
        })}
      </div>
      <div className="flex flex-wrap gap-2">
        {remaining.map((tokenIndex) => (
          <TokenButton
            key={tokenIndex}
            disabled={disabled || picked.length >= blankCount}
            onClick={() => setPicked([...picked, tokenIndex])}
          >
            {prompt.tokens[tokenIndex]}
          </TokenButton>
        ))}
      </div>
      <CheckButton
        disabled={picked.length !== blankCount || disabled}
        onClick={() => onSubmit({ fills: picked.map((index) => prompt.tokens[index]!).filter(Boolean) })}
      />
    </MathShell>
  );
}
