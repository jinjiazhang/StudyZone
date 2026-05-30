import { Pressable, Text, View } from 'react-native';
import { exerciseStyles as s } from './styles';

/**
 * Reusable A/B/C/D option list rendered by every choice-style exercise
 * (translate-choice / single-choice / pinyin-choice / poem-complete). Mirrors
 * the web `option-tile` Tailwind class.
 */
export function OptionList({
  options,
  pick,
  onPick,
  disabled,
}: {
  options: string[];
  pick: number | null;
  onPick: (index: number) => void;
  disabled?: boolean;
}) {
  return (
    <View style={{ gap: 8 }}>
      {options.map((opt, i) => {
        const selected = pick === i;
        return (
          <Pressable
            key={i}
            onPress={() => !disabled && onPick(i)}
            style={[s.optionTile, selected && s.optionTileActive]}
          >
            <View style={[s.optionBadge, selected && s.optionBadgeActive]}>
              <Text style={[s.optionBadgeText, selected && s.optionBadgeTextActive]}>
                {i + 1}
              </Text>
            </View>
            <Text style={[s.optionText, selected && s.optionTextActive]}>{opt}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}
