import { useState } from 'react';
import { Text, View } from 'react-native';
import type { PinyinChoicePrompt } from '@studyzone/shared-types';
import { exerciseStyles as s } from './styles';
import { OptionList } from './OptionList';
import { SubmitButton } from './SubmitButton';

export function PinyinChoiceExercise({
  prompt,
  onSubmit,
  disabled,
}: {
  prompt: PinyinChoicePrompt;
  onSubmit: (payload: { correctIndex: number }) => void;
  disabled?: boolean;
}) {
  const [pick, setPick] = useState<number | null>(null);

  return (
    <View style={s.container}>
      <Text style={s.labelSmall}>选择拼音</Text>
      <View style={s.promptCard}>
        <Text style={s.giantChar}>{prompt.character}</Text>
      </View>
      <OptionList options={prompt.options} pick={pick} onPick={setPick} disabled={disabled} />
      <SubmitButton
        onPress={() => pick !== null && onSubmit({ correctIndex: pick })}
        disabled={pick === null || disabled}
      />
    </View>
  );
}
