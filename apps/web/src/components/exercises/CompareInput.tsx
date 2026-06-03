'use client';

import { useState } from 'react';
import clsx from 'clsx';
import type { CompareInputPrompt } from '@studyzone/shared-types';
import { CheckButton, MathShell, type ExerciseProps } from './MathShared';

export function CompareInputExercise({
  prompt,
  onSubmit,
  disabled,
}: ExerciseProps<CompareInputPrompt, { operator: '<' | '>' | '=' }>) {
  const operators = prompt.operators ?? ['<', '>', '='];
  const [pick, setPick] = useState<'<' | '>' | '=' | null>(null);
  return (
    <MathShell label="比较大小" title="选择正确的比较符号">
      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3 rounded-2xl border-2 border-sz-line bg-white p-5 text-center font-heavy text-sz-ink">
        <div className="text-2xl">{prompt.left}</div>
        <div className="min-w-16 text-4xl text-sz-sky-dark">{pick ?? '?'}</div>
        <div className="text-2xl">{prompt.right}</div>
      </div>
      <div className="grid grid-cols-3 gap-3">
        {operators.map((operator) => (
          <button
            key={operator}
            disabled={disabled}
            onClick={() => setPick(operator)}
            className={clsx('option-tile text-center text-3xl', pick === operator && 'option-tile-active')}
          >
            {operator}
          </button>
        ))}
      </div>
      <CheckButton disabled={!pick || disabled} onClick={() => pick && onSubmit({ operator: pick })} />
    </MathShell>
  );
}
