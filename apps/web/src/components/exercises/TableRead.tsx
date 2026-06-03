'use client';

import { useState } from 'react';
import type { TableReadPrompt } from '@studyzone/shared-types';
import { CheckButton, MathShell, type ExerciseProps } from './MathShared';

export function TableReadExercise({
  prompt,
  onSubmit,
  disabled,
}: ExerciseProps<TableReadPrompt, { accepted: string[]; value?: number }>) {
  const [text, setText] = useState('');
  const numeric = Number(text);
  return (
    <MathShell label="读表" title={prompt.question}>
      <div className="overflow-hidden rounded-2xl border-2 border-sz-line bg-white">
        <table className="w-full text-left font-bold text-sz-ink">
          <thead className="bg-sz-mist">
            <tr>{prompt.columns.map((column) => <th key={column} className="px-4 py-3">{column}</th>)}</tr>
          </thead>
          <tbody>
            {prompt.rows.map((row, rowIndex) => (
              <tr key={rowIndex} className="border-t-2 border-sz-line">
                {prompt.columns.map((column) => <td key={column} className="px-4 py-3">{String(row[column] ?? '')}</td>)}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <input value={text} onChange={(event) => setText(event.target.value)} disabled={disabled} className="input p-5 text-center text-2xl font-heavy" placeholder="输入答案" />
      <CheckButton
        disabled={text.trim() === '' || disabled}
        onClick={() => onSubmit({ accepted: [text], value: Number.isFinite(numeric) ? numeric : undefined })}
      />
    </MathShell>
  );
}
