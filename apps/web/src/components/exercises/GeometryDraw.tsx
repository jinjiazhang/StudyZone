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
  const [selected, setSelected] = useState<string[]>([]);
  const points = prompt.canvas?.points ?? [];
  const hasPointCanvas = points.length >= 2;

  if (hasPointCanvas) {
    const width = prompt.canvas?.width ?? 320;
    const height = prompt.canvas?.height ?? 200;
    const [from, to] = selected;
    const fromPoint = points.find((point) => point.id === from);
    const toPoint = points.find((point) => point.id === to);
    return (
      <MathShell label="几何作图" title={prompt.instruction}>
        <div
          className="relative mx-auto w-full max-w-md rounded-2xl border-2 border-sz-line bg-white"
          style={{ aspectRatio: `${width} / ${height}` }}
        >
          {fromPoint && toPoint && (
            <svg className="pointer-events-none absolute inset-0 h-full w-full" viewBox={`0 0 ${width} ${height}`}>
              <line x1={fromPoint.x} y1={fromPoint.y} x2={toPoint.x} y2={toPoint.y} stroke="#1CB0F6" strokeWidth="6" strokeLinecap="round" />
            </svg>
          )}
          {points.map((point) => {
            const active = selected.includes(point.id);
            return (
              <button
                key={point.id}
                disabled={disabled}
                onClick={() => setSelected((current) => nextPointSelection(current, point.id))}
                className={`absolute grid h-11 w-11 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border-2 border-b-[4px] font-heavy ${
                  active
                    ? 'border-sz-sky-dark bg-sz-sky text-white'
                    : 'border-sz-line bg-sz-mist text-sz-ink'
                }`}
                style={{ left: `${(point.x / width) * 100}%`, top: `${(point.y / height) * 100}%` }}
              >
                {point.label ?? point.id}
              </button>
            );
          })}
        </div>
        <CheckButton
          disabled={selected.length !== 2 || disabled}
          onClick={() => onSubmit({ drawing: { lines: [{ from: selected[0], to: selected[1] }] } })}
        />
      </MathShell>
    );
  }

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

function nextPointSelection(current: string[], id: string): string[] {
  if (current.includes(id)) return current.filter((pointId) => pointId !== id);
  if (current.length >= 2) return [current[1]!, id];
  return [...current, id];
}
