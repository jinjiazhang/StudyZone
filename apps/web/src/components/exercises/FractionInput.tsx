'use client';

import { useState } from 'react';
import type { FractionInputPrompt } from '@studyzone/shared-types';
import { CheckButton, MathShell, NumberField, type ExerciseProps } from './MathShared';

export function FractionInputExercise({
  prompt,
  onSubmit,
  disabled,
}: ExerciseProps<FractionInputPrompt, { numerator: number; denominator: number }>) {
  const [numerator, setNumerator] = useState('');
  const [denominator, setDenominator] = useState('');
  return (
    <MathShell label="分数" title={prompt.statement}>
      <div className="mx-auto grid max-w-xs gap-2">
        <NumberField label="分子" value={numerator} onChange={setNumerator} disabled={disabled} />
        <div className="h-1 rounded-full bg-sz-ink" />
        <NumberField label="分母" value={denominator} onChange={setDenominator} disabled={disabled} />
      </div>
      <CheckButton
        disabled={numerator === '' || denominator === '' || disabled}
        onClick={() => onSubmit({ numerator: Number(numerator), denominator: Number(denominator) })}
      />
    </MathShell>
  );
}
