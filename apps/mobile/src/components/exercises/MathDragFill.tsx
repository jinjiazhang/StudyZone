import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import type { MathDragFillPrompt } from '@studyzone/shared-types';
import { SubmitButton } from './SubmitButton';
import { MathShell, Token, mathStyles, type ExerciseProps } from './MathShared';

export function MathDragFillExercise({
  prompt,
  onSubmit,
  disabled,
}: ExerciseProps<MathDragFillPrompt, { fills: string[] }>) {
  const blankCount = prompt.statement.filter((part) => part === null).length;
  const [picked, setPicked] = useState<number[]>([]);
  const remaining = prompt.tokens.map((_, index) => index).filter((index) => !picked.includes(index));
  let blankIndex = 0;
  return (
    <MathShell label="拖拽填空" title="补全算式">
      <View style={mathStyles.statementWrap}>
        {prompt.statement.map((part, index) => {
          if (part !== null) return <Text key={index} style={mathStyles.statementToken}>{part}</Text>;
          const currentBlank = blankIndex++;
          const tokenIndex = picked[currentBlank];
          return (
            <Pressable
              key={index}
              disabled={disabled || tokenIndex === undefined}
              onPress={() => setPicked(picked.filter((_, pickedIndex) => pickedIndex !== currentBlank))}
              style={mathStyles.blankSlot}
            >
              <Text style={mathStyles.blankText}>{tokenIndex === undefined ? '?' : prompt.tokens[tokenIndex]}</Text>
            </Pressable>
          );
        })}
      </View>
      <View style={mathStyles.tokenPool}>
        {remaining.map((tokenIndex) => (
          <Token
            key={tokenIndex}
            disabled={disabled || picked.length >= blankCount}
            onPress={() => setPicked([...picked, tokenIndex])}
          >
            {prompt.tokens[tokenIndex]}
          </Token>
        ))}
      </View>
      <SubmitButton
        disabled={picked.length !== blankCount || disabled}
        onPress={() => onSubmit({ fills: picked.map((index) => prompt.tokens[index]!).filter(Boolean) })}
      />
    </MathShell>
  );
}
