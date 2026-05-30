import { useEffect } from 'react';
import { ScrollView, View, Text, Pressable, StyleSheet } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery, useMutation } from '@tanstack/react-query';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BookOpen, Check, ChevronLeft, Lock, Star } from 'lucide-react-native';
import { api } from '@/lib/api';
import { useAuthStore } from '@/lib/auth-store';
import { colors, fonts, radius } from '@/lib/theme';

const OFFSET_PATTERN = [-1, 1, 2, 1, -1, -2];
const OFFSET_PX = 36;

export default function Course() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const accessToken = useAuthStore((s) => s.accessToken);
  const authHydrated = useAuthStore((s) => s.hydrated);

  const enroll = useMutation({ mutationFn: () => api.enrollCourse(id!) });
  useEffect(() => {
    if (id && accessToken) enroll.mutate();
  }, [id, accessToken]);

  const { data: tree, error, isError, isLoading, isFetching, refetch } = useQuery({
    queryKey: ['tree', id],
    queryFn: () => api.getCourseTree(id!),
    enabled: !!id && !!accessToken,
  });

  const showLoading = !authHydrated || (Boolean(accessToken) && (isLoading || isFetching) && !tree);

  return (
    <SafeAreaView style={styles.container}>
      <Pressable onPress={() => router.back()} style={styles.backBtn}>
        <ChevronLeft size={20} color={colors.inkSoft} />
        <Text style={styles.backText}>返回</Text>
      </Pressable>

      <ScrollView contentContainerStyle={styles.scroll}>
        {tree?.map((unit) => (
          <View key={unit.unitId} style={styles.unitBlock}>
            <View style={[styles.unitHeader, { backgroundColor: unit.themeColor, borderBottomColor: darken(unit.themeColor) }]}>
              <Text style={styles.unitSub}>第 {unit.unitOrder + 1} 单元</Text>
              <Text style={styles.unitTitle}>{unit.unitTitle}</Text>
              <Text style={styles.unitProgress}>
                {unit.lessons.filter((lesson) => lesson.completed).length}/{unit.lessons.length} 关完成
              </Text>
            </View>

            <View style={styles.lessonPath}>
              {unit.lessons.map((lesson, idx) => {
                const offset = OFFSET_PATTERN[idx % OFFSET_PATTERN.length] * OFFSET_PX;
                const isLocked = !lesson.unlocked;
                const isCurrent = lesson.unlocked && !lesson.completed;

                return (
                  <View key={lesson.lessonId} style={[styles.lessonNodeWrap, { marginLeft: offset + OFFSET_PX * 2 }]}>
                    {isCurrent && (
                      <View style={styles.startBubble}>
                        <Text style={styles.startText}>开始</Text>
                        <View style={styles.startBubbleArrow} />
                      </View>
                    )}
                    <Pressable
                      disabled={isLocked}
                      onPress={() => router.push(`/lesson/${lesson.lessonId}`)}
                      style={[
                        styles.lessonNode,
                        isLocked && styles.lessonNodeLocked,
                        isCurrent && styles.lessonNodeCurrent,
                      ]}
                    >
                      <View style={styles.nodeShine} />
                      {isLocked ? (
                        <Lock size={30} color="#B5B5B5" />
                      ) : lesson.completed ? (
                        <Check size={38} color={colors.white} strokeWidth={4} />
                      ) : isCurrent ? (
                        <Star size={38} color={colors.white} fill={colors.white} />
                      ) : (
                        <BookOpen size={34} color={colors.white} />
                      )}
                    </Pressable>
                    <Text style={[styles.lessonName, isLocked && { opacity: 0.4 }]}>{lesson.name}</Text>
                    <Text style={styles.lessonState}>{lesson.completed ? '已完成' : lesson.unlocked ? '待开始' : '未解锁'}</Text>
                  </View>
                );
              })}
            </View>
          </View>
        ))}

        {showLoading && <View style={styles.loading}><Text style={styles.loadingText}>加载课程地图中…</Text></View>}
        {authHydrated && !accessToken && <View style={styles.stateCard}><Text style={styles.stateTitle}>需要先登录</Text><Text style={styles.stateText}>登录后才能加载你的课程地图和学习进度。</Text></View>}
        {isError && accessToken && <View style={styles.stateCard}><Text style={styles.stateTitle}>课程地图加载失败</Text><Text style={styles.stateText}>{getErrorMessage(error)}</Text><Pressable onPress={() => refetch()} style={styles.primaryButton}><Text style={styles.primaryButtonText}>重试</Text></Pressable></View>}
      </ScrollView>
    </SafeAreaView>
  );
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message) return error.message;
  return '请确认已登录，并检查网络或后端服务状态。';
}

function darken(hex: string): string {
  try {
    const r = Math.max(0, parseInt(hex.slice(1, 3), 16) - 40);
    const g = Math.max(0, parseInt(hex.slice(3, 5), 16) - 40);
    const b = Math.max(0, parseInt(hex.slice(5, 7), 16) - 40);
    return `rgb(${r},${g},${b})`;
  } catch {
    return 'rgba(0,0,0,0.15)';
  }
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.white },
  backBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 16, paddingVertical: 10 },
  backText: { fontFamily: fonts.heavy, color: colors.inkSoft, fontSize: 14 },
  scroll: { padding: 16, paddingBottom: 48, gap: 32 },
  unitBlock: {},
  unitHeader: { borderRadius: radius.lg, padding: 16, borderBottomWidth: 6 },
  unitSub: { fontFamily: fonts.heavy, fontSize: 10, color: 'rgba(255,255,255,0.8)', textTransform: 'uppercase', letterSpacing: 1 },
  unitTitle: { fontFamily: fonts.heavy, fontSize: 20, color: colors.white, marginTop: 4 },
  unitProgress: { fontFamily: fonts.heavy, fontSize: 13, color: 'rgba(255,255,255,0.9)', marginTop: 8 },
  lessonPath: { alignItems: 'flex-start', paddingVertical: 24, gap: 30 },
  lessonNodeWrap: { alignItems: 'center', gap: 6 },
  lessonNode: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: colors.sky,
    alignItems: 'center',
    justifyContent: 'center',
    borderBottomWidth: 8,
    borderBottomColor: colors.skyDark,
    shadowColor: colors.black,
    shadowOpacity: 0.12,
    shadowRadius: 0,
    shadowOffset: { width: 0, height: 4 },
    elevation: 5,
    overflow: 'hidden',
  },
  lessonNodeCurrent: {
    borderWidth: 8,
    borderColor: colors.line,
    borderBottomColor: colors.skyDark,
  },
  lessonNodeLocked: {
    backgroundColor: colors.line,
    borderBottomColor: '#C7C7C7',
    opacity: 0.9,
  },
  nodeShine: {
    position: 'absolute',
    left: 18,
    top: 14,
    width: 38,
    height: 16,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.22)',
    transform: [{ rotate: '-32deg' }],
  },
  startBubble: {
    backgroundColor: colors.white,
    borderWidth: 2,
    borderColor: colors.line,
    borderRadius: radius.md,
    paddingHorizontal: 18,
    paddingVertical: 8,
    marginBottom: 2,
  },
  startText: { fontFamily: fonts.heavy, fontSize: 18, color: colors.sky },
  startBubbleArrow: {
    position: 'absolute',
    left: '50%',
    bottom: -8,
    width: 14,
    height: 14,
    marginLeft: -7,
    backgroundColor: colors.white,
    borderRightWidth: 2,
    borderBottomWidth: 2,
    borderColor: colors.line,
    transform: [{ rotate: '45deg' }],
  },
  lessonName: { fontFamily: fonts.heavy, fontSize: 12, color: colors.ink, textAlign: 'center', maxWidth: 100 },
  lessonState: { fontFamily: fonts.sansBold, fontSize: 10, color: colors.inkSoft },
  loading: { alignItems: 'center', paddingVertical: 40 },
  loadingText: { fontFamily: fonts.heavy, color: colors.inkSoft },
  stateCard: { backgroundColor: '#F8FAFC', borderRadius: radius.lg, padding: 16, gap: 10 },
  stateTitle: { fontFamily: fonts.heavy, fontSize: 18, color: colors.ink },
  stateText: { fontFamily: fonts.sans, color: colors.inkSoft, lineHeight: 20 },
  primaryButton: { backgroundColor: colors.green, borderRadius: radius.lg, paddingVertical: 14, alignItems: 'center' },
  primaryButtonText: { fontFamily: fonts.heavy, color: colors.white, fontSize: 14 },
});
