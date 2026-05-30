import { useMemo, useEffect } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withDelay,
  withTiming,
  Easing,
  FadeIn,
  withRepeat,
  withSequence,
} from 'react-native-reanimated';
import { Flame, Gem, Sparkles } from 'lucide-react-native';
import { colors, fonts, radius } from '@/lib/theme';
import { Mascot } from '@/components/Mascot';

const CONFETTI_COLORS = [colors.green, colors.sky, colors.gold, colors.rose, colors.purple, colors.orange];

export default function LessonComplete() {
  const { xp, gems, streak, courseId } = useLocalSearchParams<{
    xp: string;
    gems: string;
    streak: string;
    courseId?: string;
  }>();
  const router = useRouter();

  const xpNum = Number(xp ?? 0);
  const gemsNum = Number(gems ?? 0);
  const streakNum = Number(streak ?? 0);

  // Mascot spring-in
  const mascotScale = useSharedValue(0);
  useEffect(() => {
    mascotScale.value = withSpring(1, { damping: 14, stiffness: 220 });
  }, [mascotScale]);
  const mascotStyle = useAnimatedStyle(() => ({
    transform: [{ scale: mascotScale.value }],
  }));

  // Confetti pieces
  const pieces = useMemo(
    () =>
      Array.from({ length: 50 }).map((_, i) => ({
        left: Math.random() * 100,
        delay: Math.random() * 1400,
        color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
        size: 8 + Math.random() * 8,
      })),
    [],
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Confetti */}
      <View style={styles.confettiWrap} pointerEvents="none">
        {pieces.map((p, i) => (
          <ConfettiPiece key={i} left={p.left} delay={p.delay} color={p.color} size={p.size} />
        ))}
      </View>

      <View style={styles.content}>
        <Animated.View style={mascotStyle}>
          <Mascot size={176} mood="cheer" />
        </Animated.View>

        <Animated.Text entering={FadeIn.delay(200)} style={styles.heading}>
          关卡完成！
        </Animated.Text>
        <Animated.Text entering={FadeIn.delay(400)} style={styles.subtitle}>
          坚持就是胜利，明天也来呀！
        </Animated.Text>

        {/* Stats */}
        <Animated.View entering={FadeIn.delay(500)} style={styles.statsRow}>
          <StatCard
            icon={<Sparkles size={24} color={colors.goldDark} />}
            label="XP" value={xpNum} borderColor={colors.gold} bg="#FFFBEB"
          />
          <StatCard
            icon={<Gem size={24} color={colors.skyDark} />}
            label="宝石" value={gemsNum} borderColor={colors.sky} bg="#EFF6FF"
          />
          <StatCard
            icon={<Flame size={24} color={colors.orangeDark} />}
            label="连胜" value={streakNum} borderColor={colors.orange} bg="#FFF7ED"
          />
        </Animated.View>

        {/* Buttons */}
        <View style={styles.buttons}>
          <Pressable
            onPress={() => router.replace(courseId ? `/course/${courseId}` : '/(tabs)/learn')}
            style={styles.btnPrimary}
          >
            <Text style={styles.btnPrimaryText}>继续学习</Text>
          </Pressable>
          <Pressable
            onPress={() => router.back()}
            style={styles.btnSecondary}
          >
            <Text style={styles.btnSecondaryText}>再练一次</Text>
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}

function ConfettiPiece({ left, delay, color, size }: { left: number; delay: number; color: string; size: number }) {
  const translateY = useSharedValue(-20);
  const rotate = useSharedValue(0);
  const opacity = useSharedValue(0);

  useEffect(() => {
    translateY.value = withDelay(
      delay,
      withTiming(800, { duration: 2400, easing: Easing.in(Easing.ease) }),
    );
    rotate.value = withDelay(
      delay,
      withTiming(540, { duration: 2400, easing: Easing.linear }),
    );
    opacity.value = withDelay(
      delay,
      withSequence(
        withTiming(1, { duration: 200 }),
        withDelay(1800, withTiming(0, { duration: 400 })),
      ),
    );
  }, [delay, translateY, rotate, opacity]);

  const animStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: translateY.value },
      { rotate: `${rotate.value}deg` },
    ],
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      style={[
        {
          position: 'absolute',
          left: `${left}%`,
          top: -20,
          width: size,
          height: size * 1.6,
          borderRadius: 2,
          backgroundColor: color,
        },
        animStyle,
      ]}
    />
  );
}

function StatCard({ icon, label, value, borderColor, bg }: {
  icon: React.ReactNode; label: string; value: number; borderColor: string; bg: string;
}) {
  return (
    <View style={[styles.statCard, { borderColor, backgroundColor: bg }]}>
      {icon}
      <Text style={styles.statValue}>+{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.greenSoft,
  },
  confettiWrap: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    gap: 12,
  },
  heading: {
    fontSize: 32,
    fontFamily: fonts.heavy,
    color: colors.greenDark,
    marginTop: 8,
  },
  subtitle: {
    fontSize: 14,
    fontFamily: fonts.heavy,
    color: colors.inkSoft,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 16,
    width: '100%',
  },
  statCard: {
    flex: 1,
    borderRadius: radius.lg,
    borderWidth: 2,
    borderBottomWidth: 6,
    padding: 12,
    alignItems: 'center',
  },
  statValue: { fontFamily: fonts.heavy, fontSize: 22, color: colors.ink, marginTop: 4 },
  statLabel: { fontFamily: fonts.heavy, fontSize: 10, color: colors.inkSoft, textTransform: 'uppercase', letterSpacing: 1 },
  buttons: { width: '100%', gap: 10, marginTop: 20 },
  btnPrimary: {
    backgroundColor: colors.green,
    borderRadius: radius.lg,
    borderWidth: 2,
    borderBottomWidth: 4,
    borderColor: colors.greenDark,
    paddingVertical: 16,
    alignItems: 'center',
  },
  btnPrimaryText: { fontFamily: fonts.heavy, fontSize: 16, color: colors.white, textTransform: 'uppercase', letterSpacing: 0.8 },
  btnSecondary: {
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    borderWidth: 2,
    borderBottomWidth: 4,
    borderColor: colors.line,
    paddingVertical: 14,
    alignItems: 'center',
  },
  btnSecondaryText: { fontFamily: fonts.heavy, fontSize: 16, color: colors.inkSoft, textTransform: 'uppercase', letterSpacing: 0.8 },
});
