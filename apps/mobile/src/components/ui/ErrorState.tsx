import { Pressable, StyleSheet, Text, View } from 'react-native';
import { RotateCw } from 'lucide-react-native';
import { Mascot } from '@/components/Mascot';
import { colors, fonts, radius } from '@/lib/theme';

/**
 * Friendly error state with a retry action. Pass the query's `refetch`.
 */
export function ErrorState({
  title = '出了点小问题',
  description = '加载失败了，检查下网络再试一次吧。',
  onRetry,
}: {
  title?: string;
  description?: string;
  onRetry?: () => void;
}) {
  return (
    <View style={styles.container}>
      <Mascot size={92} mood="sad" />
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.desc}>{description}</Text>
      {onRetry ? (
        <Pressable style={styles.btn} onPress={onRetry}>
          <RotateCw size={18} color={colors.white} />
          <Text style={styles.btnText}>重 试</Text>
        </Pressable>
      ) : null}
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
  btn: {
    marginTop: 4,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.green,
    borderColor: colors.greenDark,
    borderWidth: 2,
    borderBottomWidth: 4,
    borderRadius: radius.lg,
    paddingHorizontal: 28,
    paddingVertical: 12,
  },
  btnText: {
    fontFamily: fonts.heavy,
    fontSize: 15,
    color: colors.white,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
});
