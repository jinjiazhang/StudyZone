'use client';

import { useState } from 'react';
import clsx from 'clsx';
import type { GeometryChoicePrompt } from '@studyzone/shared-types';
import { CheckButton, MathShell, type ExerciseProps } from './MathShared';

export function GeometryChoiceExercise({
  prompt,
  onSubmit,
  disabled,
}: ExerciseProps<GeometryChoicePrompt, { correctOptionId: string }>) {
  const [pick, setPick] = useState<string | null>(null);
  return (
    <MathShell label="图形选择" title={prompt.question}>
      <div className="grid gap-3 sm:grid-cols-2">
        {prompt.options.map((option) => (
          <button
            key={option.id}
            disabled={disabled}
            onClick={() => setPick(option.id)}
            className={clsx('option-tile flex min-h-36 flex-col items-center justify-center gap-3 text-center', pick === option.id && 'option-tile-active')}
          >
            {option.imageUrl && <img src={option.imageUrl} alt={option.label ?? option.id} className="h-24 w-full object-contain" />}
            {option.svg && <div className="grid h-24 w-full place-items-center [&>svg]:h-full [&>svg]:w-full" dangerouslySetInnerHTML={{ __html: option.svg }} />}
            {!option.imageUrl && !option.svg && <span>{option.label ?? option.id}</span>}
          </button>
        ))}
      </div>
      <CheckButton disabled={!pick || disabled} onClick={() => pick && onSubmit({ correctOptionId: pick })} />
    </MathShell>
  );
}
