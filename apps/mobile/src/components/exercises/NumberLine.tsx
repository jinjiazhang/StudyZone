import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import type { NumberLinePrompt } from '@studyzone/shared-types';
import { SubmitButton } from './SubmitButton';
import { MathShell, mathStyles, roundStep, type ExerciseProps } from './MathShared';

export function NumberLineExercise({
  prompt,
  onSubmit,
  disabled,
}: ExerciseProps<NumberLinePrompt, { value: number }>) {
  const [value, setValue] = useState((prompt.min + prompt.max) / 2);
  const step = prompt.step ?? (prompt.max - prompt.min) / 10;
  return (
    <MathShell label="数轴" title={prompt.statement}>
      <View style={mathStyles.numberLineCard}>
        <View style={mathStyles.numberLineLabels}>
          <Text style={mathStyles.fieldLabel}>{prompt.min}</Text>
          <Text style={mathStyles.numberLineValue}>{value}</Text>
          <Text style={mathStyles.fieldLabel}>{prompt.max}</Text>
        </View>
        <View style={mathStyles.numberLineControls}>
          <Pressable disabled={disabled} onPress={() => setValue(Math.max(prompt.min, roundStep(value - step)))} style={mathStyles.stepButton}>
            <Text style={mathStyles.stepButtonText}>-</Text>
          </Pressable>
          <View style={mathStyles.numberLineTrack}>
            <View style={[mathStyles.numberLineFill, { width: `${((value - prompt.min) / (prompt.max - prompt.min)) * 100}%` }]} />
          </View>
          <Pressable disabled={disabled} onPress={() => setValue(Math.min(prompt.max, roundStep(value + step)))} style={mathStyles.stepButton}>
            <Text style={mathStyles.stepButtonText}>+</Text>
          </Pressable>
        </View>
      </View>
      <SubmitButton disabled={disabled} onPress={() => onSubmit({ value })} />
    </MathShell>
  );
}
