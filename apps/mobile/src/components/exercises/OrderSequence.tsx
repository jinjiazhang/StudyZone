import { useMemo, useState } from 'react';
import { View } from 'react-native';
import type { OrderSequencePrompt } from '@studyzone/shared-types';
import { SubmitButton } from './SubmitButton';
import { MathShell, Token, TokenBank, mathStyles, type ExerciseProps } from './MathShared';

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
      <TokenBank placeholder="点击下方项目排序">
        {picked.map((itemIndex, order) => (
          <Token
            key={`${itemIndex}-${order}`}
            picked
            disabled={disabled}
            onPress={() => setPicked(picked.filter((_, index) => index !== order))}
          >
            {prompt.items[itemIndex]?.text}
          </Token>
        ))}
      </TokenBank>
      <View style={mathStyles.tokenPool}>
        {remaining.map((itemIndex) => (
          <Token key={itemIndex} disabled={disabled} onPress={() => setPicked([...picked, itemIndex])}>
            {prompt.items[itemIndex]?.text}
          </Token>
        ))}
      </View>
      <SubmitButton
        disabled={picked.length !== prompt.items.length || disabled}
        onPress={() => onSubmit({ orderedIds: picked.map((index) => prompt.items[index]!.id) })}
      />
    </MathShell>
  );
}
