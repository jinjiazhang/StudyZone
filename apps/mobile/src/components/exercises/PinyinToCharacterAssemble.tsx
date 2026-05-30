import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { PinyinToCharacterAssemblePrompt } from '@studyzone/shared-types';
import { colors, fonts, radius } from '@/lib/theme';
import { exerciseStyles as s } from './styles';
import { SubmitButton } from './SubmitButton';

/**
 * 看拼音拼字 — 学生点击候选区的部件，把它们填进结构槽位组成目标汉字。
 *
 * Mobile uses click-to-place rather than HTML5 drag-and-drop (which RN does
 * not natively support). The web counterpart supports both.
 */
export function PinyinToCharacterAssembleExercise({
  prompt,
  onSubmit,
  disabled,
}: {
  prompt: PinyinToCharacterAssemblePrompt;
  onSubmit: (payload: { slotFills: Record<string, string> }) => void;
  disabled?: boolean;
}) {
  const [slotFills, setSlotFills] = useState<Record<string, string>>({});
  const usedComponents = new Set(Object.values(slotFills));
  const allFilled = prompt.slots.every((slot) => slotFills[slot.id]);

  function placeComponent(component: string) {
    if (disabled || usedComponents.has(component)) return;
    const empty = prompt.slots.find((slot) => !slotFills[slot.id]);
    if (!empty) return;
    setSlotFills({ ...slotFills, [empty.id]: component });
  }

  function clearSlot(slotId: string) {
    if (disabled || !slotFills[slotId]) return;
    const { [slotId]: _, ...rest } = slotFills;
    setSlotFills(rest);
  }

  return (
    <View style={s.container}>
      <Text style={s.labelSmall}>看拼音拼字</Text>

      <View style={[s.promptCard, { alignItems: 'center' }]}>
        <Text style={local.pinyin}>{prompt.pinyin}</Text>
        {prompt.hint ? <Text style={local.hint}>{prompt.hint}</Text> : null}
      </View>

      {/* Structure template */}
      <View style={local.templateWrap}>
        <View
          style={[
            local.template,
            prompt.structure === 'vertical'
              ? { flexDirection: 'column' }
              : { flexDirection: 'row' },
          ]}
        >
          {prompt.slots.map((slot, i) => {
            const filled = slotFills[slot.id];
            const isLast = i === prompt.slots.length - 1;
            return (
              <Pressable
                key={slot.id}
                onPress={() => filled && clearSlot(slot.id)}
                disabled={disabled || !filled}
                style={[
                  local.slot,
                  prompt.structure === 'vertical'
                    ? !isLast && {
                        borderBottomWidth: 2,
                        borderBottomColor: colors.line,
                        borderStyle: 'dashed',
                      }
                    : !isLast && {
                        borderRightWidth: 2,
                        borderRightColor: colors.line,
                        borderStyle: 'dashed',
                      },
                ]}
              >
                <Text style={filled ? local.slotChar : local.slotEmpty}>
                  {filled ?? '？'}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      {allFilled && (
        <Text style={local.reveal}>
          你拼出的字：
          <Text style={local.revealChar}>
            {' ' + prompt.slots.map((slot) => slotFills[slot.id]).join('')}
          </Text>
        </Text>
      )}

      {/* Candidates pool */}
      <View style={local.pool}>
        {prompt.candidates.map((c) => {
          const used = usedComponents.has(c);
          return (
            <Pressable
              key={c}
              onPress={() => placeComponent(c)}
              disabled={disabled || used}
              style={[local.candidate, used && local.candidateUsed]}
            >
              <Text style={[local.candidateText, used && { color: colors.inkSoft, opacity: 0.4 }]}>
                {c}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <SubmitButton
        onPress={() => onSubmit({ slotFills })}
        disabled={!allFilled || disabled}
      />
    </View>
  );
}

const local = StyleSheet.create({
  pinyin: {
    fontFamily: fonts.heavy,
    fontSize: 36,
    letterSpacing: 2,
    color: colors.skyDark,
    textAlign: 'center',
  },
  hint: {
    fontFamily: fonts.regular,
    fontSize: 14,
    color: colors.inkSoft,
    marginTop: 6,
    textAlign: 'center',
  },
  templateWrap: { alignItems: 'center', paddingVertical: 8 },
  template: {
    borderWidth: 3,
    borderColor: colors.line,
    borderStyle: 'dashed',
    borderRadius: radius.lg,
    backgroundColor: colors.mist,
    padding: 8,
  },
  slot: { width: 88, height: 88, alignItems: 'center', justifyContent: 'center' },
  slotChar: { fontFamily: fonts.heavy, fontSize: 48, color: colors.ink },
  slotEmpty: { fontFamily: fonts.heavy, fontSize: 28, color: colors.inkSoft, opacity: 0.35 },
  reveal: {
    textAlign: 'center',
    fontFamily: fonts.heavy,
    fontSize: 12,
    color: colors.inkSoft,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
  },
  revealChar: { fontFamily: fonts.heavy, fontSize: 22, color: colors.ink, textTransform: 'none' },
  pool: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 10,
    marginTop: 4,
  },
  candidate: {
    width: 60,
    height: 60,
    borderRadius: radius.lg,
    borderWidth: 2,
    borderBottomWidth: 4,
    borderColor: colors.line,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  candidateUsed: { backgroundColor: colors.mist, borderBottomWidth: 2 },
  candidateText: { fontFamily: fonts.heavy, fontSize: 30, color: colors.ink },
});
