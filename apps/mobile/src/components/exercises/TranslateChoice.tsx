import { useState } from 'react';
import { Text, View } from 'react-native';
import type { TranslateChoicePrompt } from '@studyzone/shared-types';
import { exerciseStyles as s } from './styles';
import { OptionList } from './OptionList';
import { SubmitButton } from './SubmitButton';

export function TranslateChoiceExercise({
  prompt,
  onSubmit,
  disabled,
}: {
  prompt: TranslateChoicePrompt;
  onSubmit: (payload: { correctIndex: number }) => void;
  disabled?: boolean;
}) {
  const [pick, setPick] = useState<number | null>(null);

  return (
    <View style={s.container}>
      <Text style={s.labelSmall}>翻译此句</Text>
      <View style={s.promptCard}>
        <Text style={s.promptBold}>{prompt.source}</Text>
      </View>
      <OptionList options={prompt.options} pick={pick} onPick={setPick} disabled={disabled} />
      <SubmitButton
        onPress={() => pick !== null && onSubmit({ correctIndex: pick })}
        disabled={pick === null || disabled}
      />
    </View>
  );
}
