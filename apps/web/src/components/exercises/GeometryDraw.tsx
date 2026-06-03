'use client';

import { useState } from 'react';
import type { GeometryDrawPrompt } from '@studyzone/shared-types';
import { CheckButton, MathShell, parseJsonOrText, type ExerciseProps } from './MathShared';

export function GeometryDrawExercise({
  prompt,
  onSubmit,
  disabled,
}: ExerciseProps<GeometryDrawPrompt, { drawing: unknown }>) {
  const [text, setText] = useState('');
  return (
    <MathShell label="几何作图" title={prompt.instruction}>
      <textarea
        value={text}
        onChange={(event) => setText(event.target.value)}
        disabled={disabled}
        className="input min-h-32 font-mono text-sm"
        placeholder='输入作图数据，例如 {"lines":[{"from":"A","to":"B"}]}'
      />
      <CheckButton disabled={text.trim() === '' || disabled} onClick={() => onSubmit({ drawing: parseJsonOrText(text) })} />
    </MathShell>
  );
}
