'use client';

import { useState } from 'react';
import type { NumberLinePrompt } from '@studyzone/shared-types';
import { CheckButton, MathShell, type ExerciseProps } from './MathShared';

export function NumberLineExercise({
  prompt,
  onSubmit,
  disabled,
}: ExerciseProps<NumberLinePrompt, { value: number }>) {
  const [value, setValue] = useState((prompt.min + prompt.max) / 2);
  return (
    <MathShell label="数轴" title={prompt.statement}>
      <div className="rounded-2xl border-2 border-sz-line bg-white p-5">
        <div className="mb-3 flex justify-between font-heavy text-sz-ink-soft">
          <span>{prompt.min}</span>
          <span>{value}</span>
          <span>{prompt.max}</span>
        </div>
        <input
          type="range"
          min={prompt.min}
          max={prompt.max}
          step={prompt.step ?? (prompt.max - prompt.min) / 100}
          value={value}
          disabled={disabled}
          onChange={(event) => setValue(Number(event.target.value))}
          className="w-full"
        />
      </div>
      <CheckButton disabled={disabled} onClick={() => onSubmit({ value })} />
    </MathShell>
  );
}
