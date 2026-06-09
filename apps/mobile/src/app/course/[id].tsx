import { useCallback, useEffect, useRef } from 'react';
import {
  ScrollView,
  View,
  Text,
  Pressable,
  StyleSheet,
  type ImageSourcePropType,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { BookOpen, Check, Lock, PlayCircle, Star } from 'lucide-react-native';
import type { LessonNodeDto, UnitMapDecorationDto } from '@studyzone/shared-types';

import { MapDecoration } from '@/components/MapDecoration';
import { LocalSvg, TopStatsBar } from '@/components/TopStatsBar';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { colors, fonts, radius, shade, withAlpha } from '@/lib/theme';

const OFFSET_PATTERN = [-1, 1, 2, 1, -1, -2];
const OFFSET_STEP = 38;
const NODE_SIZE = 96;
const DECORATION_GAP = 34;
const UNIT_EMOJI = ['🌱', '🌳', '🌟', '🚀', '🏔️'];
const LEARN_ICON = require('../../../assets/icons/learn.svg') as ImageSourcePropType;

export default function Course() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const accessToken = useAuth((s) => s.accessToken);
  const authHydrated = useAuth((s) => s.hydrated);

  const {
    data: tree,
    error,
    isError,
    isFetching,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ['tree', id],
    queryFn: () => api.getCourseTree(id!),
    enabled: !!id && !!accessToken,
  });
  const { data: me, isLoading: meLoading } = useQuery({
    queryKey: ['me'],
    queryFn: () => api.me(),
    enabled: !!accessToken,
  });
  const { data: enrollments } = useQuery({
    queryKey: ['enrollments'],
    queryFn: () => api.listMyEnrollments(),
    enabled: !!accessToken,
  });
  const currentUnitId = enrollments?.find((e) => e.courseId === id)?.currentUnitId ?? null;

  // Reopen the course at the unit the user was last studying. Falls back to the
  // first unit that still has an incomplete lesson. Runs once per mount, after
  // the target unit's header has reported its scroll offset via onLayout.
  const scrollRef = useRef<ScrollView>(null);
  const unitOffsets = useRef<Map<string, number>>(new Map());
  const hasScrolledRef = useRef(false);
  const maybeScrollToCurrentUnit = useCallback(() => {
    if (hasScrolledRef.current || !tree || tree.length === 0) return;
    const targetUnitId =
      (currentUnitId && tree.some((u) => u.unitId === currentUnitId) ? currentUnitId : null) ??
      tree.find((u) => u.lessons.some((l) => !l.completed))?.unitId ??
      tree[0]?.unitId;
    if (!targetUnitId) return;
    const y = unitOffsets.current.get(targetUnitId);
    if (y == null) return;
    scrollRef.current?.scrollTo({ y: Math.max(0, y - 8), animated: false });
    hasScrolledRef.current = true;
  }, [tree, currentUnitId]);
  useEffect(() => {
    maybeScrollToCurrentUnit();
  }, [maybeScrollToCurrentUnit]);

  const showLoading = !authHydrated || (Boolean(accessToken) && (isLoading || isFetching) && !tree);

  return (
    <SafeAreaView style={styles.container}>
      <TopStatsBar
        gems={me?.gems ?? 0}
        hearts={me?.hearts ?? 0}
        leading={<LocalSvg source={LEARN_ICON} width={34} height={34} />}
        leadingAccessibilityLabel="返回学习主页"
        loading={meLoading}
        onLeadingPress={() => router.replace('/(tabs)/learn')}
        streak={me?.currentStreak ?? 0}
      />

      <ScrollView
        ref={scrollRef}
        showsVerticalScrollIndicator={false}
        stickyHeaderIndices={tree?.map((_, unitIdx) => unitIdx * 2) ?? []}
        contentContainerStyle={styles.scroll}
      >
        {tree?.flatMap((unit, unitIdx) => {
          return [
            <View
              key={`${unit.unitId}-header`}
              style={styles.stickyUnitHeader}
              onLayout={(event) => {
                unitOffsets.current.set(unit.unitId, event.nativeEvent.layout.y);
                maybeScrollToCurrentUnit();
              }}
            >
              <View
                style={[
                  styles.unitHeader,
                  {
                    backgroundColor: unit.themeColor,
                    borderBottomColor: withAlpha(colors.black, 0.15),
                  },
                ]}
              >
                <View style={styles.unitHeaderText}>
                  <Text style={styles.unitEyebrow}>第 {unit.unitOrder + 1} 单元</Text>
                  <Text style={styles.unitTitle}>{unit.unitTitle}</Text>
                </View>
                <Text style={styles.unitGhost}>
                  {UNIT_EMOJI[unitIdx % UNIT_EMOJI.length]}
                </Text>
              </View>
            </View>,

            <View key={`${unit.unitId}-lessons`} style={styles.unitLessons}>
              <View style={styles.lessonList}>
                {unit.lessons.map((lesson, lessonIdx) => {
                  const offset =
                    (OFFSET_PATTERN[lessonIdx % OFFSET_PATTERN.length] ?? 0) * OFFSET_STEP;
                  const decorations = (unit.mapDecorations ?? []).filter(
                    (decoration) => decoration.anchorLessonOrder === lesson.order,
                  );

                  return (
                    <LessonNode
                      key={lesson.lessonId}
                      lesson={lesson}
                      offset={offset}
                      themeColor={unit.themeColor}
                      decorations={decorations}
                      onPress={() => router.push(`/lesson/${lesson.lessonId}`)}
                    />
                  );
                })}
              </View>
            </View>,
          ];
        })}

        {showLoading && (
          <View style={styles.stateCard}>
            <Text style={styles.stateTitle}>加载课程地图中…</Text>
          </View>
        )}

        {authHydrated && !accessToken && (
          <View style={styles.stateCard}>
            <Text style={styles.stateTitle}>需要先登录</Text>
            <Text style={styles.stateText}>登录后才能加载你的课程地图和学习进度。</Text>
          </View>
        )}

        {isError && accessToken && (
          <View style={styles.stateCard}>
            <Text style={styles.stateTitle}>课程地图加载失败</Text>
            <Text style={styles.stateText}>{getErrorMessage(error)}</Text>
            <Pressable onPress={() => refetch()} style={styles.retryButton}>
              <Text style={styles.retryText}>重试</Text>
            </Pressable>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function LessonNode({
  decorations,
  lesson,
  offset,
  onPress,
  themeColor,
}: {
  decorations: UnitMapDecorationDto[];
  lesson: LessonNodeDto;
  offset: number;
  onPress: () => void;
  themeColor: string;
}) {
  const isNext = lesson.unlocked && !lesson.completed;
  const isLocked = !lesson.unlocked;
  const nodeColor = isLocked ? colors.line : themeColor;
  const shadowColor = isLocked ? '#C7C7C7' : shade(themeColor, -22);
  const visibleDecorations = decorations.filter(
    (decoration) => lesson.unlocked || !decoration.hiddenWhenLocked,
  );

  const pulse = useSharedValue(0);
  useEffect(() => {
    if (!isNext) return;
    pulse.value = withRepeat(
      withTiming(1, { duration: 1500, easing: Easing.out(Easing.ease) }),
      -1,
      false,
    );
  }, [isNext, pulse]);

  const pulseStyle = useAnimatedStyle(() => ({
    opacity: 0.75 * (1 - pulse.value),
    transform: [{ scale: 1 + pulse.value * 0.16 }],
  }));

  return (
    <View style={[styles.lessonItem, { transform: [{ translateX: offset }] }]}>
      <View style={styles.lessonStage}>
        {visibleDecorations.map((decoration) => (
          <LessonDecoration key={decoration.id} decoration={decoration} offset={offset} />
        ))}

        <Pressable
          disabled={isLocked}
          onPress={onPress}
          style={({ pressed }) => [
            styles.lessonButton,
            {
              backgroundColor: nodeColor,
              borderBottomColor: shadowColor,
              shadowColor,
            },
            isLocked && styles.lessonButtonLocked,
            isNext && styles.lessonButtonCurrent,
            pressed && !isLocked && styles.lessonButtonPressed,
          ]}
        >
          <View style={styles.nodeShine} />
          {isNext && (
            <Animated.View
              pointerEvents="none"
              style={[styles.pulseRing, { borderColor: colors.line }, pulseStyle]}
            />
          )}
          {isLocked ? (
            <Lock size={30} color="#B5B5B5" strokeWidth={3} />
          ) : lesson.completed ? (
            <Check size={42} color={colors.white} strokeWidth={4} />
          ) : isNext ? (
            <Star size={42} color={colors.white} fill={colors.white} strokeWidth={2.5} />
          ) : (
            <BookOpen size={38} color={colors.white} strokeWidth={3} />
          )}
          {isNext && (
            <View pointerEvents="none" style={styles.startBadge}>
              <PlayCircle size={18} color={themeColor} strokeWidth={3} />
              <Text style={[styles.startBadgeText, { color: themeColor }]}>开始</Text>
              <View style={styles.startBadgeArrow} />
            </View>
          )}
        </Pressable>
      </View>
    </View>
  );
}

function LessonDecoration({
  decoration,
  offset,
}: {
  decoration: UnitMapDecorationDto;
  offset: number;
}) {
  const side = getDecorationSide(decoration, offset);
  const size = Math.round((decoration.size ?? 112) * 0.78);

  return (
    <View
      pointerEvents="none"
      style={[
        styles.lessonDecoration,
        side === 'left' ? styles.lessonDecorationLeft : styles.lessonDecorationRight,
        {
          width: size,
          height: size,
          transform: [
            { translateX: decoration.offsetX ?? 0 },
            { translateY: -size / 2 + (decoration.offsetY ?? 0) },
          ],
        },
      ]}
    >
      <MapDecoration decoration={decoration} size={size} />
    </View>
  );
}

function getDecorationSide(
  decoration: UnitMapDecorationDto,
  offset: number,
): UnitMapDecorationDto['side'] {
  if (decoration.side === 'left' && offset <= 0) return 'right';
  if (decoration.side === 'right' && offset >= OFFSET_STEP * 2) return 'left';
  return decoration.side;
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message) return error.message;
  return '请确认已登录，并检查网络或后端服务状态。';
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
  },
  scroll: {
    paddingHorizontal: 16,
    paddingBottom: 56,
  },
  stickyUnitHeader: {
    backgroundColor: colors.white,
    alignSelf: 'center',
    paddingBottom: 12,
    width: '100%',
    maxWidth: 768,
    zIndex: 10,
  },
  unitLessons: {
    alignSelf: 'center',
    marginBottom: 48,
    paddingTop: 64,
    width: '100%',
    maxWidth: 768,
  },
  unitLocked: {
    opacity: 0.7,
  },
  unitHeader: {
    borderBottomWidth: 5,
    borderRadius: 18,
    minHeight: 92,
    overflow: 'hidden',
    paddingHorizontal: 18,
    paddingVertical: 14,
  },
  unitHeaderText: {
    flex: 1,
    justifyContent: 'center',
  },
  unitEyebrow: {
    color: 'rgba(255,255,255,0.82)',
    fontFamily: fonts.heavy,
    fontSize: 11,
    letterSpacing: 1,
  },
  unitTitle: {
    color: colors.white,
    fontFamily: fonts.heavy,
    fontSize: 20,
    lineHeight: 25,
    marginTop: 3,
  },
  unitGhost: {
    bottom: -20,
    color: colors.white,
    fontSize: 76,
    opacity: 0.2,
    position: 'absolute',
    right: -12,
  },
  lessonList: {
    alignItems: 'center',
    gap: 32,
  },
  lessonItem: {
    alignItems: 'center',
  },
  lessonStage: {
    height: NODE_SIZE,
    position: 'relative',
    width: NODE_SIZE,
  },
  lessonButton: {
    alignItems: 'center',
    borderBottomWidth: 7,
    borderRadius: NODE_SIZE / 2,
    height: NODE_SIZE,
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.12,
    shadowRadius: 0,
    width: NODE_SIZE,
  },
  lessonButtonCurrent: {
    borderColor: colors.white,
    borderWidth: 5,
  },
  lessonButtonLocked: {
    shadowColor: '#C7C7C7',
  },
  lessonButtonPressed: {
    borderBottomWidth: 4,
    transform: [{ translateY: 3 }],
  },
  nodeShine: {
    backgroundColor: 'rgba(255,255,255,0.22)',
    borderRadius: radius.full,
    height: 18,
    left: 18,
    position: 'absolute',
    top: 13,
    transform: [{ rotate: '-32deg' }],
    width: 42,
  },
  pulseRing: {
    borderRadius: radius.full,
    borderWidth: 6,
    bottom: -10,
    left: -10,
    opacity: 0,
    position: 'absolute',
    right: -10,
    top: -10,
  },
  startBadge: {
    alignItems: 'center',
    backgroundColor: colors.white,
    borderColor: colors.line,
    borderRadius: 18,
    borderWidth: 2,
    flexDirection: 'row',
    gap: 4,
    left: '50%',
    paddingHorizontal: 16,
    paddingVertical: 8,
    position: 'absolute',
    top: -50,
    transform: [{ translateX: -45 }],
  },
  startBadgeText: {
    fontFamily: fonts.heavy,
    fontSize: 18,
  },
  startBadgeArrow: {
    backgroundColor: colors.white,
    borderBottomWidth: 2,
    borderColor: colors.line,
    borderRightWidth: 2,
    bottom: -9,
    height: 16,
    left: '50%',
    marginLeft: -8,
    position: 'absolute',
    transform: [{ rotate: '45deg' }],
    width: 16,
  },
  lessonDecoration: {
    opacity: 0.95,
    position: 'absolute',
    top: '50%',
    zIndex: -1,
  },
  lessonDecorationLeft: {
    right: NODE_SIZE + DECORATION_GAP,
  },
  lessonDecorationRight: {
    left: NODE_SIZE + DECORATION_GAP,
  },
  stateCard: {
    backgroundColor: colors.mist,
    borderColor: colors.cardLine,
    borderRadius: radius.lg,
    borderWidth: 2,
    gap: 10,
    padding: 18,
  },
  stateTitle: {
    color: colors.ink,
    fontFamily: fonts.heavy,
    fontSize: 18,
  },
  stateText: {
    color: colors.inkSoft,
    fontFamily: fonts.sans,
    fontSize: 14,
    lineHeight: 20,
  },
  retryButton: {
    alignItems: 'center',
    backgroundColor: colors.green,
    borderBottomColor: colors.greenDark,
    borderBottomWidth: 4,
    borderRadius: radius.lg,
    paddingVertical: 12,
  },
  retryText: {
    color: colors.white,
    fontFamily: fonts.heavy,
    fontSize: 14,
  },
});
