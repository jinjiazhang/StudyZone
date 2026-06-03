'use client';

import { useState } from 'react';
import type { ExpressionInputPrompt } from '@studyzone/shared-types';
import { CheckButton, MathShell, type ExerciseProps } from './MathShared';

export function ExpressionInputExercise({
  prompt,
  onSubmit,
  disabled,
}: ExerciseProps<ExpressionInputPrompt, { accepted: string[] }>) {
  const [text, setText] = useState('');
  return (
    <MathShell label="算式输入" title={prompt.statement}>
      <input
        value={text}
        onChange={(event) => setText(event.target.value)}
        disabled={disabled}
        placeholder={prompt.placeholder ?? '输入算式'}
        className="input p-6 text-center text-3xl font-heavy"
      />
      <CheckButton disabled={text.trim() === '' || disabled} onClick={() => onSubmit({ accepted: [text] })} />
    </MathShell>
  );
}
