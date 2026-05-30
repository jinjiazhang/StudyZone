import { useState } from 'react';
import { Text, TextInput, View } from 'react-native';
import type { NumericInputPrompt } from '@studyzone/shared-types';
import { colors } from '@/lib/theme';
import { exerciseStyles as s } from './styles';
import { SubmitButton } from './SubmitButton';

export function NumericInputExercise({
  prompt,
  onSubmit,
  disabled,
}: {
  prompt: NumericInputPrompt;
  onSubmit: (payload: { value: number }) => void;
  disabled?: boolean;
}) {
  const [text, setText] = useState('');

  return (
    <View style={s.container}>
      <Text style={s.labelSmall}>计算</Text>
      <View style={s.promptCard}>
        <Text style={s.mathStatement}>{prompt.statement}</Text>
      </View>
      <TextInput
        value={text}
        onChangeText={(v) => setText(v.replace(/[^0-9.\-]/g, ''))}
        keyboardType="numeric"
        style={[s.textInput, { textAlign: 'center', fontSize: 28 }]}
        placeholder="输入答案…"
        placeholderTextColor={colors.inkSoft}
        editable={!disabled}
      />
      <SubmitButton
        onPress={() => onSubmit({ value: Number(text) })}
        disabled={text === '' || disabled}
      />
    </View>
  );
}
