import { useState } from 'react';
import { Text, TextInput, View } from 'react-native';
import type { MultiNumericInputPrompt } from '@studyzone/shared-types';
import { exerciseStyles as s } from './styles';
import { SubmitButton } from './SubmitButton';
import { MathShell, cleanNumber, mathStyles, updateAt, type ExerciseProps } from './MathShared';

export function MultiNumericInputExercise({
  prompt,
  onSubmit,
  disabled,
}: ExerciseProps<MultiNumericInputPrompt, { values: number[] }>) {
  const [values, setValues] = useState(() => prompt.blanks.map(() => ''));
  const ready = values.every((value) => value.trim() !== '');
  return (
    <MathShell label="多空填数" title={prompt.statement}>
      {prompt.blanks.map((blank, index) => (
        <View key={blank.id} style={mathStyles.fieldGroup}>
          <Text style={mathStyles.fieldLabel}>{blank.label ?? `第 ${index + 1} 空`}</Text>
          <View style={mathStyles.inlineRow}>
            <TextInput
              value={values[index] ?? ''}
              onChangeText={(value) => updateAt(setValues, values, index, cleanNumber(value))}
              editable={!disabled}
              keyboardType="numeric"
              style={[s.textInput, mathStyles.flexInput]}
            />
            {!!blank.suffix && <Text style={mathStyles.suffix}>{blank.suffix}</Text>}
          </View>
        </View>
      ))}
      <SubmitButton disabled={!ready || disabled} onPress={() => onSubmit({ values: values.map(Number) })} />
    </MathShell>
  );
}
