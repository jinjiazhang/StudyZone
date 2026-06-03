import { useState } from 'react';
import { Image, Pressable, Text, View } from 'react-native';
import { SvgXml } from 'react-native-svg';
import type { GeometryChoicePrompt } from '@studyzone/shared-types';
import { exerciseStyles as s } from './styles';
import { SubmitButton } from './SubmitButton';
import { MathShell, mathStyles, type ExerciseProps } from './MathShared';

export function GeometryChoiceExercise({
  prompt,
  onSubmit,
  disabled,
}: ExerciseProps<GeometryChoicePrompt, { correctOptionId: string }>) {
  const [pick, setPick] = useState<string | null>(null);
  return (
    <MathShell label="图形选择" title={prompt.question}>
      <View style={mathStyles.optionGrid}>
        {prompt.options.map((option) => (
          <Pressable
            key={option.id}
            disabled={disabled}
            onPress={() => setPick(option.id)}
            style={[s.optionTile, mathStyles.geometryTile, pick === option.id && s.optionTileActive]}
          >
            {option.imageUrl && <Image source={{ uri: option.imageUrl }} style={mathStyles.geometryImage} resizeMode="contain" />}
            {option.svg && <SvgXml xml={option.svg} width="100%" height={80} />}
            <Text style={s.optionText}>{option.label ?? option.id}</Text>
          </Pressable>
        ))}
      </View>
      <SubmitButton disabled={!pick || disabled} onPress={() => pick && onSubmit({ correctOptionId: pick })} />
    </MathShell>
  );
}
