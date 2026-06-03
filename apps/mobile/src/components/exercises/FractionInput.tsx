import { useState } from 'react';
import { View } from 'react-native';
import type { FractionInputPrompt } from '@studyzone/shared-types';
import { SubmitButton } from './SubmitButton';
import { MathShell, NumberField, mathStyles, type ExerciseProps } from './MathShared';

export function FractionInputExercise({
  prompt,
  onSubmit,
  disabled,
}: ExerciseProps<FractionInputPrompt, { numerator: number; denominator: number }>) {
  const [numerator, setNumerator] = useState('');
  const [denominator, setDenominator] = useState('');
  return (
    <MathShell label="分数" title={prompt.statement}>
      <View style={mathStyles.fractionBox}>
        <NumberField label="分子" value={numerator} onChange={setNumerator} disabled={disabled} />
        <View style={mathStyles.fractionLine} />
        <NumberField label="分母" value={denominator} onChange={setDenominator} disabled={disabled} />
      </View>
      <SubmitButton
        disabled={numerator === '' || denominator === '' || disabled}
        onPress={() => onSubmit({ numerator: Number(numerator), denominator: Number(denominator) })}
      />
    </MathShell>
  );
}
