import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, fonts } from '../lib/theme';

interface StatPillProps {
  icon: React.ReactNode;
  value: number;
  tint: 'orange' | 'sky' | 'rose' | 'gold';
}

const TINT_COLORS: Record<string, string> = {
  orange: colors.orangeDark,
  sky: colors.skyDark,
  rose: colors.roseDark,
  gold: colors.goldDark,
};

export function StatPill({ icon, value, tint }: StatPillProps) {
  return (
    <View style={styles.pill}>
      {icon}
      <Text style={[styles.value, { color: TINT_COLORS[tint] }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderRadius: 999,
    borderWidth: 2,
    borderColor: colors.line,
    backgroundColor: colors.white,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  value: {
    fontFamily: fonts.heavy,
    fontSize: 13,
  },
});
