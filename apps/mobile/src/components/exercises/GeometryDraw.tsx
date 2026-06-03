import { useState } from 'react';
import { TextInput } from 'react-native';
import type { GeometryDrawPrompt } from '@studyzone/shared-types';
import { colors } from '@/lib/theme';
import { exerciseStyles as s } from './styles';
import { SubmitButton } from './SubmitButton';
import { MathShell, mathStyles, parseJsonOrText, type ExerciseProps } from './MathShared';

export function GeometryDrawExercise({
  prompt,
  onSubmit,
  disabled,
}: ExerciseProps<GeometryDrawPrompt, { drawing: unknown }>) {
  const [text, setText] = useState('');
  return (
    <MathShell label="几何作图" title={prompt.instruction}>
      <TextInput
        value={text}
        onChangeText={setText}
        editable={!disabled}
        multiline
        style={[s.textInput, mathStyles.drawInput]}
        placeholder='输入作图数据，例如 {"lines":[{"from":"A","to":"B"}]}'
        placeholderTextColor={colors.inkSoft}
      />
      <SubmitButton disabled={text.trim() === '' || disabled} onPress={() => onSubmit({ drawing: parseJsonOrText(text) })} />
    </MathShell>
  );
}
