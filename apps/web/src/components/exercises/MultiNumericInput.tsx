'use client';

import { useState } from 'react';
import type { MultiNumericInputPrompt } from '@studyzone/shared-types';
import { CheckButton, MathShell, updateAt, type ExerciseProps } from './MathShared';

export function MultiNumericInputExercise({
  prompt,
  onSubmit,
  disabled,
}: ExerciseProps<MultiNumericInputPrompt, { values: number[] }>) {
  const [values, setValues] = useState(() => prompt.blanks.map(() => ''));
  const ready = values.every((value) => value.trim() !== '');
  return (
    <MathShell label="多空填数" title={prompt.statement}>
      <div className="grid gap-3 sm:grid-cols-2">
        {prompt.blanks.map((blank, index) => (
          <label key={blank.id} className="flex flex-col gap-2 text-sm font-heavy text-sz-ink-soft">
            {blank.label ?? `第 ${index + 1} 空`}
            <div className="flex items-center gap-2">
              <input
                value={values[index] ?? ''}
                onChange={(event) => updateAt(setValues, values, index, event.target.value.replace(/[^0-9.\-]/g, ''))}
                disabled={disabled}
                inputMode="decimal"
                className="input text-center text-2xl"
              />
              {blank.suffix && <span className="font-heavy text-sz-ink">{blank.suffix}</span>}
            </div>
          </label>
        ))}
      </div>
      <CheckButton disabled={!ready || disabled} onClick={() => onSubmit({ values: values.map(Number) })} />
    </MathShell>
  );
}
