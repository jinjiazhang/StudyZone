'use client';

import { useState } from 'react';
import type { ClockInputPrompt } from '@studyzone/shared-types';
import { CheckButton, ClockFace, MathShell, NumberField, type ExerciseProps } from './MathShared';

export function ClockInputExercise({
  prompt,
  onSubmit,
  disabled,
}: ExerciseProps<ClockInputPrompt, { hour: number; minute: number }>) {
  const [hour, setHour] = useState(prompt.clock ? String(prompt.clock.hour) : '');
  const [minute, setMinute] = useState(prompt.clock ? String(prompt.clock.minute) : '');
  return (
    <MathShell label="钟表" title={prompt.statement}>
      {prompt.clock && <ClockFace hour={prompt.clock.hour} minute={prompt.clock.minute} />}
      <div className="grid grid-cols-[1fr_auto_1fr] items-end gap-3">
        <NumberField label="时" value={hour} onChange={setHour} disabled={disabled} />
        <div className="pb-4 text-3xl font-heavy text-sz-ink-soft">:</div>
        <NumberField label="分" value={minute} onChange={setMinute} disabled={disabled} />
      </div>
      <CheckButton
        disabled={hour === '' || minute === '' || disabled}
        onClick={() => onSubmit({ hour: Number(hour), minute: Number(minute) })}
      />
    </MathShell>
  );
}
