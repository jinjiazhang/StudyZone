'use client';

import { useMemo, useState } from 'react';
import clsx from 'clsx';
import type { PoemMultiBlankPrompt } from '@studyzone/shared-types';

export function PoemMultiBlankExercise({
  prompt,
  onSubmit,
  disabled,
}: {
  prompt: PoemMultiBlankPrompt;
  onSubmit: (payload: { correctIndices: number[] }) => void;
  disabled?: boolean;
}) {
  const blankCount = prompt.blanks.length;
  const [picks, setPicks] = useState<(number | null)[]>(() =>
    Array.from({ length: blankCount }, () => null),
  );
  const [activeBlank, setActiveBlank] = useState(0);

  // Flatten lines and tag each null with its blank index, so rendering can pull
  // the right options/state without a separate counter.
  const flat = useMemo(() => {
    let blankIdx = 0;
    return prompt.lines.map((line) =>
      line.map((segment) => {
        if (segment === null) return { kind: 'blank' as const, index: blankIdx++ };
        return { kind: 'text' as const, value: segment };
      }),
    );
  }, [prompt.lines]);

  const allFilled = picks.every((p) => p !== null);
  const activeOptions = prompt.blanks[activeBlank]?.options ?? [];

  const handlePick = (optionIdx: number) => {
    const next = picks.slice();
    next[activeBlank] = optionIdx;
    setPicks(next);
    // Auto-advance to the next still-empty blank, if any.
    const nextEmpty = next.findIndex((p, i) => p === null && i > activeBlank);
    if (nextEmpty !== -1) setActiveBlank(nextEmpty);
    else {
      const anyEmpty = next.findIndex((p) => p === null);
      if (anyEmpty !== -1) setActiveBlank(anyEmpty);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="text-xs font-heavy uppercase tracking-widest text-sz-ink-soft">
        古诗多空填空
      </div>

      <div className="flex flex-col items-center gap-3 rounded-2xl bg-sz-bg-soft px-6 py-6 text-center">
        <div className="text-xl font-heavy text-sz-ink">《{prompt.title}》</div>
        <div className="text-sm text-sz-ink-soft">— {prompt.author}</div>
        <div className="mt-3 flex flex-col gap-2">
          {flat.map((line, lineIdx) => (
            <div
              key={lineIdx}
              className="flex flex-wrap items-baseline justify-center gap-1 text-2xl font-heavy text-sz-ink md:text-3xl"
            >
              {line.map((seg, segIdx) => {
                if (seg.kind === 'text') {
                  return <span key={segIdx}>{seg.value}</span>;
                }
                const pick = picks[seg.index];
                const isActive = activeBlank === seg.index;
                const filled = pick !== null;
                return (
                  <button
                    key={segIdx}
                    type="button"
                    disabled={disabled}
                    onClick={() => setActiveBlank(seg.index)}
                    className={clsx(
                      'mx-1 inline-flex min-w-[3.5rem] items-center justify-center rounded-lg border-2 px-3 py-1 transition',
                      filled
                        ? 'border-solid border-sz-sky bg-sz-sky/10 text-sz-sky-dark'
                        : 'border-dashed border-sz-sky text-sz-sky-dark',
                      isActive && 'ring-2 ring-sz-sky ring-offset-2',
                    )}
                  >
                    {filled
                      ? prompt.blanks[seg.index]?.options[pick as number]
                      : '＿＿'}
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      <div className="text-xs font-heavy uppercase tracking-wider text-sz-ink-soft">
        第 {activeBlank + 1} / {blankCount} 空
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {activeOptions.map((opt, idx) => {
          const selected = picks[activeBlank] === idx;
          return (
            <button
              key={idx}
              disabled={disabled}
              onClick={() => handlePick(idx)}
              className={clsx(
                'option-tile flex items-center gap-3',
                selected && 'option-tile-active',
              )}
            >
              <span
                className={clsx(
                  'flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border-2 text-sm font-heavy',
                  selected
                    ? 'border-sz-sky bg-white text-sz-sky-dark'
                    : 'border-sz-line bg-white text-sz-ink-soft',
                )}
              >
                {String.fromCharCode(65 + idx)}
              </span>
              <span className="flex-1 font-heavy">{opt}</span>
            </button>
          );
        })}
      </div>

      <button
        disabled={!allFilled || disabled}
        onClick={() =>
          allFilled && onSubmit({ correctIndices: picks as number[] })
        }
        className="btn-primary mt-2"
      >
        检 查
      </button>
    </div>
  );
}
