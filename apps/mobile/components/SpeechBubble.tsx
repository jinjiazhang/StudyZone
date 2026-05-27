import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, fonts, radius } from '../lib/theme';

interface SpeechBubbleProps {
  children: React.ReactNode;
}

export function SpeechBubble({ children }: SpeechBubbleProps) {
  return (
    <View style={styles.wrapper}>
      {/* Triangle pointer */}
      <View style={styles.pointer} />
      <View style={styles.bubble}>
        <Text style={styles.text}>{children}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'relative',
    marginLeft: 12,
    flex: 1,
  },
  pointer: {
    position: 'absolute',
    left: -8,
    top: 18,
    width: 16,
    height: 16,
    backgroundColor: colors.white,
    borderLeftWidth: 2,
    borderBottomWidth: 2,
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
