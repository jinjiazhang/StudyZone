import { useState } from 'react';
import { Text, View } from 'react-native';
import type { ClockInputPrompt } from '@studyzone/shared-types';
import { SubmitButton } from './SubmitButton';
import { ClockFace, MathShell, NumberField, mathStyles, type ExerciseProps } from './MathShared';

export function ClockInputExercise({
  prompt,
  onSubmit,
  disabled,
}: ExerciseProps<ClockInputPrompt, { hour: number; minute: number }>) {
  const [hour, setHour] = useState(prompt.clock ? String(prompt.clock.hour) : '');
  const [minute, setMinute] = useState(prompt.clock ? String(prompt.clock.minute) : '');
  return (
    <MathShell label="钟表" title={prompt.statement}>
      {prompt.clock && <ClockFace hour={prompt.clock.hour} minute={prompt.clock.minute} />}
      <View style={mathStyles.inlineRow}>
        <NumberField label="时" value={hour} onChange={setHour} disabled={disabled} />
        <Text style={mathStyles.colon}>:</Text>
        <NumberField label="分" value={minute} onChange={setMinute} disabled={disabled} />
      </View>
      <SubmitButton
        disabled={hour === '' || minute === '' || disabled}
        onPress={() => onSubmit({ hour: Number(hour), minute: Number(minute) })}
      />
    </MathShell>
  );
}
