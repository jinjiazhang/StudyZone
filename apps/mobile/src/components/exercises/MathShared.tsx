import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { colors, fonts, radius } from '@/lib/theme';
import { exerciseStyles as s } from './styles';

export type ExerciseProps<TPrompt, TPayload> = {
  prompt: TPrompt;
  onSubmit: (payload: TPayload) => void;
  disabled?: boolean;
};

export function MathShell({ label, title, children }: { label: string; title: string; children: ReactNode }) {
  return (
    <View style={s.container}>
      <Text style={s.labelSmall}>{label}</Text>
      <View style={s.promptCard}>
        <Text style={s.promptBold}>{title}</Text>
      </View>
      {children}
    </View>
  );
}

export function NumberField({
  label,
  value,
  onChange,
  disabled,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}) {
  return (
    <View style={[mathStyles.fieldGroup, mathStyles.flexInput]}>
      <Text style={mathStyles.fieldLabel}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={(next) => onChange(cleanNumber(next))}
        editable={!disabled}
        keyboardType="numeric"
        style={[s.textInput, mathStyles.centerInput]}
      />
    </View>
  );
}

export function TokenBank({ placeholder, children }: { placeholder: string; children: ReactNode }) {
  const empty = Array.isArray(children) ? children.length === 0 : !children;
  return (
    <View style={mathStyles.answerBank}>
      {empty && <Text style={mathStyles.answerPlaceholder}>{placeholder}</Text>}
      {children}
    </View>
  );
}

export function Token({
  children,
  picked,
  disabled,
  onPress,
}: {
  children: ReactNode;
  picked?: boolean;
  disabled?: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable disabled={disabled} onPress={onPress} style={[mathStyles.tokenChip, picked && mathStyles.tokenChipPicked]}>
      <Text style={[mathStyles.tokenText, picked && mathStyles.tokenTextPicked]}>{children}</Text>
    </Pressable>
  );
}

export function ClockFace({ hour, minute }: { hour: number; minute: number }) {
  return (
    <View style={mathStyles.clockFace}>
      <Text style={mathStyles.clockText}>{`${hour}:${String(minute).padStart(2, '0')}`}</Text>
    </View>
  );
}

export function cleanNumber(value: string): string {
  return value.replace(/[^0-9.\-]/g, '');
}

export function updateAt(
  setValues: (values: string[]) => void,
  values: string[],
  index: number,
  nextValue: string,
) {
  const next = [...values];
  next[index] = nextValue;
  setValues(next);
}

export function roundStep(value: number): number {
  return Math.round(value * 1000000) / 1000000;
}

export function parseJsonOrText(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

export const mathStyles = StyleSheet.create({
  centerInput: { textAlign: 'center', fontFamily: fonts.heavy, fontSize: 22 },
  fieldGroup: { gap: 6 },
  fieldLabel: { fontFamily: fonts.heavy, color: colors.inkSoft, fontSize: 12 },
  inlineRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 10 },
  flexInput: { flex: 1 },
  suffix: { fontFamily: fonts.heavy, fontSize: 18, color: colors.ink, paddingBottom: 16 },
  answerBank: {
    minHeight: 60,
    borderRadius: radius.lg,
    borderWidth: 2,
    borderColor: colors.line,
    borderStyle: 'dashed',
    backgroundColor: colors.mist,
    padding: 10,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  answerPlaceholder: { fontFamily: fonts.sansBold, color: colors.inkSoft, fontSize: 13 },
  tokenPool: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  tokenChip: {
    borderRadius: radius.md,
    borderWidth: 2,
    borderBottomWidth: 4,
    borderColor: colors.line,
    backgroundColor: colors.white,
    paddingVertical: 8,
    paddingHorizontal: 14,
  },
  tokenChipPicked: { borderColor: colors.sky },
  tokenText: { fontFamily: fonts.heavy, fontSize: 15, color: colors.ink },
  tokenTextPicked: { color: colors.skyDark },
  compareCard: {
    borderRadius: radius.lg,
    borderWidth: 2,
    borderColor: colors.line,
    backgroundColor: colors.white,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  compareText: { flex: 1, textAlign: 'center', fontFamily: fonts.heavy, fontSize: 22, color: colors.ink },
  compareOperator: { minWidth: 46, textAlign: 'center', fontFamily: fonts.heavy, fontSize: 34, color: colors.skyDark },
  operatorRow: { flexDirection: 'row', gap: 10 },
  operatorTile: { flex: 1, justifyContent: 'center' },
  operatorText: { flex: 1, textAlign: 'center', fontFamily: fonts.heavy, fontSize: 26, color: colors.ink },
  statementWrap: {
    borderRadius: radius.lg,
    borderWidth: 2,
    borderColor: colors.line,
    backgroundColor: colors.white,
    padding: 14,
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 8,
  },
  statementToken: { fontFamily: fonts.heavy, fontSize: 22, color: colors.ink },
  blankSlot: {
    minWidth: 64,
    minHeight: 44,
    borderRadius: radius.md,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: colors.line,
    backgroundColor: colors.mist,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 10,
  },
  blankText: { fontFamily: fonts.heavy, fontSize: 20, color: colors.skyDark },
  optionGrid: { gap: 10 },
  geometryTile: { minHeight: 108, justifyContent: 'center' },
  geometryChoiceTile: {
    minHeight: 140,
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  geometryChoiceText: { flex: 0, textAlign: 'center' },
  geometryImage: { width: '100%', height: 80 },
  drawCanvas: {
    width: '100%',
    aspectRatio: 1.6,
    borderRadius: radius.lg,
    borderWidth: 2,
    borderColor: colors.line,
    backgroundColor: colors.white,
    overflow: 'hidden',
  },
  drawLineLayer: { ...StyleSheet.absoluteFillObject },
  drawPoint: {
    position: 'absolute',
    width: 44,
    height: 44,
    marginLeft: -22,
    marginTop: -22,
    borderRadius: 22,
    borderWidth: 2,
    borderBottomWidth: 4,
    borderColor: colors.line,
    backgroundColor: colors.mist,
    alignItems: 'center',
    justifyContent: 'center',
  },
  drawPointActive: { borderColor: colors.skyDark, backgroundColor: colors.sky },
  drawPointText: { fontFamily: fonts.heavy, fontSize: 16, color: colors.ink },
  drawPointTextActive: { color: colors.white },
  colon: { fontFamily: fonts.heavy, fontSize: 30, color: colors.inkSoft, paddingBottom: 16 },
  unitInput: { minWidth: 86, textAlign: 'center', fontFamily: fonts.heavy },
  fractionBox: { maxWidth: 220, alignSelf: 'center', width: '100%', gap: 8 },
  fractionLine: { height: 3, borderRadius: 999, backgroundColor: colors.ink },
  tableScroll: { borderRadius: radius.lg, borderWidth: 2, borderColor: colors.line, backgroundColor: colors.white },
  table: { minWidth: 280 },
  tableRow: { flexDirection: 'row', borderTopWidth: 2, borderTopColor: colors.line },
  tableHead: { backgroundColor: colors.mist, borderTopWidth: 0 },
  tableCell: { minWidth: 110, padding: 12, fontFamily: fonts.sansBold, color: colors.ink },
  numberLineCard: {
    borderRadius: radius.lg,
    borderWidth: 2,
    borderColor: colors.line,
    backgroundColor: colors.white,
    padding: 14,
    gap: 12,
  },
  numberLineLabels: { flexDirection: 'row', justifyContent: 'space-between' },
  numberLineValue: { fontFamily: fonts.heavy, color: colors.skyDark, fontSize: 16 },
  numberLineControls: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  numberLineTrack: { flex: 1, height: 12, borderRadius: 999, backgroundColor: colors.line, overflow: 'hidden' },
  numberLineFill: { height: '100%', backgroundColor: colors.green },
  stepButton: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    borderWidth: 2,
    borderBottomWidth: 4,
    borderColor: colors.line,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.white,
  },
  stepButtonText: { fontFamily: fonts.heavy, fontSize: 24, color: colors.ink },
  drawInput: { minHeight: 120, textAlignVertical: 'top' },
  clockFace: {
    width: 150,
    height: 150,
    borderRadius: 75,
    borderWidth: 4,
    borderColor: colors.line,
    backgroundColor: colors.white,
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'center',
  },
  clockText: { fontFamily: fonts.heavy, fontSize: 28, color: colors.skyDark },
});
