import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Check } from 'lucide-react-native';
import type { MatchPairsPrompt } from '@studyzone/shared-types';
import { colors, fonts, radius, withAlpha } from '@/lib/theme';
import { exerciseStyles as s } from './styles';
import { SubmitButton } from './SubmitButton';

/**
 * 配对题 — tap a left item, then its match on the right. Redesigned for
 * colour-blind accessibility: every matched pair gets BOTH a distinct colour
 * AND a shape (left = rounded square, right = circle) plus a ✓, so pairing is
 * never conveyed by colour alone.
 */
const PALETTE = ['#EC4899', '#2D9CDB', '#12B886', '#9B6DFF', '#FF9D00'];

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
  const [flash, setFlash] = useState<string | null>(null);
  const usedRight = new Set(Object.values(pairs));

  const colorForLeft = (id: string) =>
    PALETTE[prompt.left.findIndex((l) => l.id === id) % PALETTE.length];
  const leftForRight = (rid: string) =>
    Object.keys(pairs).find((lid) => pairs[lid] === rid) ?? null;

  function toggleLeft(id: string) {
    if (disabled) return;
    if (pairs[id]) {
      const { [id]: _removed, ...rest } = pairs;
      setPairs(rest);
      return;
    }
    setPickedLeft(id);
  }

  function pickRight(id: string) {
    if (disabled || usedRight.has(id)) return;
    if (!pickedLeft) return;
    setPairs({ ...pairs, [pickedLeft]: id });
    setPickedLeft(null);
  }

  return (
    <View style={s.container}>
      <Text style={s.labelSmall}>点击两侧组成配对</Text>

      <View style={local.columns}>
        {/* left column */}
        <View style={local.column}>
          {prompt.left.map((item) => {
            const matched = !!pairs[item.id];
            const picked = pickedLeft === item.id;
            const c = matched ? colorForLeft(item.id) : picked ? colors.sky : colors.cardLine;
            return (
              <Pressable
                key={item.id}
                onPress={() => toggleLeft(item.id)}
                style={[
                  local.tile,
                  {
                    borderColor: c,
                    backgroundColor: matched ? withAlpha(colorForLeft(item.id), 0.08) : colors.white,
                  },
                ]}
              >
                <View
                  style={[
                    local.shapeSquare,
                    { borderColor: c, backgroundColor: matched ? colorForLeft(item.id) : 'transparent' },
                  ]}
                />
                <Text style={local.tileText}>{item.text}</Text>
                {matched && <Check size={15} color={colorForLeft(item.id)} strokeWidth={3.5} />}
              </Pressable>
            );
          })}
        </View>

        {/* right column */}
        <View style={local.column}>
          {prompt.right.map((item) => {
            const owner = leftForRight(item.id);
            const matched = !!owner;
            const flashing = flash === item.id;
            const c = matched ? colorForLeft(owner!) : flashing ? colors.rose : colors.cardLine;
            return (
              <Pressable
                key={item.id}
                onPress={() => {
                  if (!matched && !pickedLeft) {
                    setFlash(item.id);
                    setTimeout(() => setFlash(null), 400);
                  }
                  pickRight(item.id);
                }}
                style={[
                  local.tile,
                  {
                    borderColor: c,
                    backgroundColor: matched ? withAlpha(colorForLeft(owner!), 0.08) : colors.white,
                  },
                ]}
              >
                {matched && <Check size={15} color={colorForLeft(owner!)} strokeWidth={3.5} />}
                <Text style={[local.tileText, { textAlign: 'right' }]}>{item.text}</Text>
                <View
                  style={[
                    local.shapeCircle,
                    { borderColor: c, backgroundColor: matched ? colorForLeft(owner!) : 'transparent' },
                  ]}
                />
              </Pressable>
            );
          })}
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
  columns: { flexDirection: 'row', gap: 12 },
  column: { flex: 1, gap: 10 },
  tile: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    minHeight: 54,
    paddingHorizontal: 13,
    paddingVertical: 12,
    borderRadius: radius.lg,
    borderWidth: 2,
    backgroundColor: colors.white,
  },
  tileText: { flex: 1, fontFamily: fonts.heavy, fontSize: 15.5, color: colors.ink },
  shapeSquare: { width: 15, height: 15, borderRadius: 4, borderWidth: 2 },
  shapeCircle: { width: 15, height: 15, borderRadius: 999, borderWidth: 2 },
});
