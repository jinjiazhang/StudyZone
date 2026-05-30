import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import type { PoemCompletePrompt } from '@studyzone/shared-types';
import { colors, fonts } from '@/lib/theme';
import { exerciseStyles as s } from './styles';
import { OptionList } from './OptionList';
import { SubmitButton } from './SubmitButton';

export function PoemCompleteExercise({
  prompt,
  onSubmit,
  disabled,
}: {
  prompt: PoemCompletePrompt;
  onSubmit: (payload: { correctIndex: number }) => void;
  disabled?: boolean;
}) {
  const [pick, setPick] = useState<number | null>(null);

  return (
    <View style={s.container}>
      <Text style={s.labelSmall}>诗词填空</Text>
      <View style={s.promptCard}>
        <Text style={s.promptBold}>《{prompt.title}》</Text>
        <Text style={local.author}>— {prompt.author}</Text>
      </View>
      <OptionList options={prompt.options} pick={pick} onPick={setPick} disabled={disabled} />
      <SubmitButton
        onPress={() => pick !== null && onSubmit({ correctIndex: pick })}
        disabled={pick === null || disabled}
      />
    </View>
  );
}

const local = StyleSheet.create({
  author: { fontFamily: fonts.regular, fontSize: 13, color: colors.inkSoft, marginTop: 4 },
});
