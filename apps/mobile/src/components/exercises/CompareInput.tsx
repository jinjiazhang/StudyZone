import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import type { CompareInputPrompt } from '@studyzone/shared-types';
import { exerciseStyles as s } from './styles';
import { SubmitButton } from './SubmitButton';
import { MathShell, mathStyles, type ExerciseProps } from './MathShared';

export function CompareInputExercise({
  prompt,
  onSubmit,
  disabled,
}: ExerciseProps<CompareInputPrompt, { operator: '<' | '>' | '=' }>) {
  const operators = prompt.operators ?? ['<', '>', '='];
  const [pick, setPick] = useState<'<' | '>' | '=' | null>(null);
  return (
    <MathShell label="比较大小" title="选择正确的比较符号">
      <View style={mathStyles.compareCard}>
        <Text style={mathStyles.compareText}>{prompt.left}</Text>
        <Text style={mathStyles.compareOperator}>{pick ?? '?'}</Text>
        <Text style={mathStyles.compareText}>{prompt.right}</Text>
      </View>
      <View style={mathStyles.operatorRow}>
        {operators.map((operator) => (
          <Pressable
            key={operator}
            disabled={disabled}
            onPress={() => setPick(operator)}
            style={[s.optionTile, mathStyles.operatorTile, pick === operator && s.optionTileActive]}
          >
            <Text style={mathStyles.operatorText}>{operator}</Text>
          </Pressable>
        ))}
      </View>
      <SubmitButton disabled={!pick || disabled} onPress={() => pick && onSubmit({ operator: pick })} />
    </MathShell>
  );
}
