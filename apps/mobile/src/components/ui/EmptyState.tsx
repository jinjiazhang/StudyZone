import type { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Mascot, type MascotMood } from '@/components/Mascot';
import { colors, fonts, radius } from '@/lib/theme';

/**
 * Friendly empty state: mascot + title + hint + optional call to action.
 * Used when a query succeeds but there's nothing to show yet.
 */
export function EmptyState({
  title,
  description,
  action,
  mood = 'happy',
}: {
  title: string;
  description?: string;
  action?: ReactNode;
  mood?: MascotMood;
}) {
  return (
    <View style={styles.container}>
      <Mascot size={92} mood={mood} />
      <Text style={styles.title}>{title}</Text>
      {description ? <Text style={styles.desc}>{description}</Text> : null}
      {action}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.white,
    borderWidth: 2,
    borderColor: colors.line,
    borderStyle: 'dashed',
    borderRadius: radius.xl,
    paddingHorizontal: 24,
    paddingVertical: 32,
  },
  title: { fontFamily: fonts.heavy, fontSize: 18, color: colors.ink, textAlign: 'center' },
  desc: {
    fontFamily: fonts.sansBold,
    fontSize: 14,
    color: colors.inkSoft,
    textAlign: 'center',
    lineHeight: 20,
    maxWidth: 280,
  },
});
