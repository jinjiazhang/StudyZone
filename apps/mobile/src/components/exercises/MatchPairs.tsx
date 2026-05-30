import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { MatchPairsPrompt } from '@studyzone/shared-types';
import { colors } from '@/lib/theme';
import { exerciseStyles as s } from './styles';
import { SubmitButton } from './SubmitButton';

export function MatchPairsExercise({
  prompt,
  onSubmit,
  disabled,
}: {
  prompt: MatchPairsPrompt;
  onSubmit: (payload: { pairs: Record<string, string> }) => void;
  disabled?: boolean;
}) {
  const [pairs, setPairs] = useState<Record<string, string>>({});
  const [pickedLeft, setPickedLeft] = useState<string | null>(null);
  const usedRight = new Set(Object.values(pairs));

  function toggleLeft(id: string) {
    if (disabled) return;
    if (pairs[id]) {
      const { [id]: _, ...rest } = pairs;
      setPairs(rest);
      return;
    }
    setPickedLeft(id);
  }

  function pickRight(id: string) {
    if (disabled || !pickedLeft || usedRight.has(id)) return;
    setPairs({ ...pairs, [pickedLeft]: id });
    setPickedLeft(null);
  }

  return (
    <View style={s.container}>
      <Text style={s.labelSmall}>点击两侧组成配对</Text>

      <View style={local.columns}>
        <View style={local.column}>
          {prompt.left.map((item) => (
            <Pressable
              key={item.id}
              onPress={() => toggleLeft(item.id)}
              style={[
                s.optionTile,
                pairs[item.id] && local.matched,
                pickedLeft === item.id && local.picked,
              ]}
            >
              <Text style={s.optionText}>{item.text}</Text>
            </Pressable>
          ))}
        </View>
        <View style={local.column}>
          {prompt.right.map((item) => (
            <Pressable
              key={item.id}
              onPress={() => pickRight(item.id)}
              style={[s.optionTile, usedRight.has(item.id) && local.matched]}
            >
              <Text style={s.optionText}>{item.text}</Text>
            </Pressable>
          ))}
        </View>
      </View>

      <SubmitButton
        onPress={() => onSubmit({ pairs })}
        disabled={Object.keys(pairs).length !== prompt.left.length || disabled}
      />
    </View>
  );
}

const local = StyleSheet.create({
  columns: { flexDirection: 'row', gap: 10 },
  column: { flex: 1, gap: 8 },
  matched: { borderColor: colors.green, backgroundColor: '#F0FFF4' },
  picked: { borderColor: colors.gold, backgroundColor: colors.cream },
});
