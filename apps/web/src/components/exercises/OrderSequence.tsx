'use client';

import { useMemo, useState } from 'react';
import type { OrderSequencePrompt } from '@studyzone/shared-types';
import { CheckButton, MathShell, TokenAnswerBank, TokenButton, type ExerciseProps } from './MathShared';

export function OrderSequenceExercise({
  prompt,
  onSubmit,
  disabled,
}: ExerciseProps<OrderSequencePrompt, { orderedIds: string[] }>) {
  const [picked, setPicked] = useState<number[]>([]);
  const remaining = useMemo(
    () => prompt.items.map((_, index) => index).filter((index) => !picked.includes(index)),
    [picked, prompt.items],
  );
  return (
    <MathShell label="排序" title={prompt.instruction}>
      <TokenAnswerBank placeholder="点击下方项目排序">
        {picked.map((itemIndex, order) => (
          <TokenButton
            key={`${itemIndex}-${order}`}
            disabled={disabled}
            picked
            onClick={() => setPicked(picked.filter((_, index) => index !== order))}
          >
            {prompt.items[itemIndex]?.text}
          </TokenButton>
        ))}
      </TokenAnswerBank>
      <div className="flex flex-wrap gap-2">
        {remaining.map((itemIndex) => (
          <TokenButton key={itemIndex} disabled={disabled} onClick={() => setPicked([...picked, itemIndex])}>
            {prompt.items[itemIndex]?.text}
          </TokenButton>
        ))}
      </div>
      <CheckButton
        disabled={picked.length !== prompt.items.length || disabled}
        onClick={() => onSubmit({ orderedIds: picked.map((index) => prompt.items[index]!.id) })}
      />
    </MathShell>
  );
}
