'use client';

import { useState } from 'react';
import type { UnitConversionPrompt } from '@studyzone/shared-types';
import { CheckButton, MathShell, NumberField, type ExerciseProps } from './MathShared';

export function UnitConversionExercise({
  prompt,
  onSubmit,
  disabled,
}: ExerciseProps<UnitConversionPrompt, { value: number; unit: string }>) {
  const [value, setValue] = useState('');
  const [unit, setUnit] = useState(prompt.toUnit);
  return (
    <MathShell label="单位换算" title={prompt.statement}>
      <div className="grid grid-cols-[1fr_auto] gap-3">
        <NumberField label="数值" value={value} onChange={setValue} disabled={disabled} />
        <label className="flex flex-col gap-2 text-sm font-heavy text-sz-ink-soft">
          单位
          <input value={unit} onChange={(event) => setUnit(event.target.value)} disabled={disabled} className="input min-w-24 text-center text-xl" />
        </label>
      </div>
      <CheckButton disabled={value === '' || unit.trim() === '' || disabled} onClick={() => onSubmit({ value: Number(value), unit })} />
    </MathShell>
  );
}
