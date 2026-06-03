import { useState } from 'react';
import { Text, TextInput, View } from 'react-native';
import type { UnitConversionPrompt } from '@studyzone/shared-types';
import { exerciseStyles as s } from './styles';
import { SubmitButton } from './SubmitButton';
import { MathShell, NumberField, mathStyles, type ExerciseProps } from './MathShared';

export function UnitConversionExercise({
  prompt,
  onSubmit,
  disabled,
}: ExerciseProps<UnitConversionPrompt, { value: number; unit: string }>) {
  const [value, setValue] = useState('');
  const [unit, setUnit] = useState(prompt.toUnit);
  return (
    <MathShell label="单位换算" title={prompt.statement}>
      <View style={mathStyles.inlineRow}>
        <NumberField label="数值" value={value} onChange={setValue} disabled={disabled} />
        <View style={mathStyles.fieldGroup}>
          <Text style={mathStyles.fieldLabel}>单位</Text>
          <TextInput value={unit} onChangeText={setUnit} editable={!disabled} style={[s.textInput, mathStyles.unitInput]} />
        </View>
      </View>
      <SubmitButton disabled={value === '' || unit.trim() === '' || disabled} onPress={() => onSubmit({ value: Number(value), unit })} />
    </MathShell>
  );
}
