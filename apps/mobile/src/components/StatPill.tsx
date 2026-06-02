import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, fonts } from '@/lib/theme';

interface StatPillProps {
  icon: React.ReactNode;
  value: number | string;
  tint: 'orange' | 'sky' | 'rose' | 'gold';
}

const TINT_COLORS: Record<string, string> = {
  orange: colors.orange,
  sky: colors.sky,
  rose: colors.rose,
  gold: colors.goldDark,
};

/**
 * Top-bar gamification chip — icon + bold value, borderless (prototype spec).
 */
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
    gap: 5,
  },
  value: {
    fontFamily: fonts.heavy,
    fontSize: 16,
  },
});
