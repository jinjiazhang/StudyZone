import { useState } from 'react';
import { Text, TextInput, View } from 'react-native';
import type { TranslateInputPrompt } from '@studyzone/shared-types';
import { colors } from '@/lib/theme';
import { exerciseStyles as s } from './styles';
import { SubmitButton } from './SubmitButton';

export function TranslateInputExercise({
  prompt,
  onSubmit,
  disabled,
}: {
  prompt: TranslateInputPrompt;
  onSubmit: (payload: { accepted: string[] }) => void;
  disabled?: boolean;
}) {
  const [text, setText] = useState('');

  return (
    <View style={s.container}>
      <Text style={s.labelSmall}>翻译此句</Text>
      <View style={s.promptCard}>
        <Text style={s.promptBold}>{prompt.source}</Text>
      </View>
      <TextInput
        value={text}
        onChangeText={setText}
        style={s.textInput}
        placeholder="输入翻译…"
        placeholderTextColor={colors.inkSoft}
        multiline
        editable={!disabled}
      />
      <SubmitButton
        onPress={() => onSubmit({ accepted: [text.trim()] })}
        disabled={!text.trim() || disabled}
      />
    </View>
  );
}
