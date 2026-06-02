import React from 'react';
import { View, Text, StyleSheet, type ViewStyle } from 'react-native';
import { colors, fonts, radius } from '@/lib/theme';

interface SpeechBubbleProps {
  children: React.ReactNode;
  /** Where the little tail sits. Default 'left' (points left, for mascot-on-left rows). */
  tail?: 'left' | 'bottom' | 'right';
  style?: ViewStyle;
}

export function SpeechBubble({ children, tail = 'left', style }: SpeechBubbleProps) {
  const pointerPos: ViewStyle =
    tail === 'left'
      ? { left: -8, top: 18, borderLeftWidth: 2, borderBottomWidth: 2 }
      : tail === 'right'
        ? { right: 18, bottom: -8, borderRightWidth: 2, borderBottomWidth: 2 }
        : { left: '50%', marginLeft: -8, bottom: -8, borderRightWidth: 2, borderBottomWidth: 2 };

  return (
    <View style={[tail === 'left' ? styles.wrapperLeft : styles.wrapper, style]}>
      <View style={[styles.bubble]}>
        <Text style={styles.text}>{children}</Text>
      </View>
      <View style={[styles.pointer, pointerPos]} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrapperLeft: { position: 'relative', marginLeft: 12, flex: 1 },
  wrapper: { position: 'relative' },
  pointer: {
    position: 'absolute',
    width: 16,
    height: 16,
    backgroundColor: colors.white,
    borderColor: colors.line,
    transform: [{ rotate: '45deg' }],
    zIndex: 0,
  },
  bubble: {
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    borderWidth: 2,
    borderColor: colors.line,
    paddingHorizontal: 16,
    paddingVertical: 12,
    zIndex: 1,
  },
  text: {
    fontFamily: fonts.sansBold,
    fontSize: 14,
    color: colors.ink,
    lineHeight: 20,
  },
});
