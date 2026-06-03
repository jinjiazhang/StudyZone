import { useState } from 'react';
import { TextInput } from 'react-native';
import type { ExpressionInputPrompt } from '@studyzone/shared-types';
import { colors } from '@/lib/theme';
import { exerciseStyles as s } from './styles';
import { SubmitButton } from './SubmitButton';
import { MathShell, mathStyles, type ExerciseProps } from './MathShared';

export function ExpressionInputExercise({
  prompt,
  onSubmit,
  disabled,
}: ExerciseProps<ExpressionInputPrompt, { accepted: string[] }>) {
  const [text, setText] = useState('');
  return (
    <MathShell label="算式输入" title={prompt.statement}>
      <TextInput
        value={text}
        onChangeText={setText}
        editable={!disabled}
        style={[s.textInput, mathStyles.centerInput]}
        placeholder={prompt.placeholder ?? '输入算式'}
        placeholderTextColor={colors.inkSoft}
      />
      <SubmitButton disabled={text.trim() === '' || disabled} onPress={() => onSubmit({ accepted: [text] })} />
    </MathShell>
  );
}
