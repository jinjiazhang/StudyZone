import { View, Text, StyleSheet, Pressable, ScrollView, Image, type ImageSourcePropType } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { Settings, CheckCircle2 } from 'lucide-react-native';
import { api } from '@/lib/api';
import { useTabGuard } from '@/lib/guard';
import { colors, fonts, radius } from '@/lib/theme';
import { LocalSvg } from '@/components/TopStatsBar';
import { Skeleton, SkeletonRows } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { xpToLevel } from '@studyzone/shared-logic';

const STREAK_ICON = require('../../../assets/icons/streak.svg') as ImageSourcePropType;
const XP_ICON = require('../../../assets/icons/xp.svg') as ImageSourcePropType;
const DIAMOND_ICON = require('../../../assets/icons/diamond.svg') as ImageSourcePropType;
const HEART_ICON = require('../../../assets/icons/heart.svg') as ImageSourcePropType;
const TARGET_ICON = require('../../../assets/icons/target.svg') as ImageSourcePropType;
const AVATAR_COLORS = ['#1CB0F6', '#58CC02', '#CE82FF', '#FF9600', '#FF4B4B', '#2FB36B'];

export default function Profile() {
  const router = useRouter();
  useTabGuard([['me'], ['quests']]);
  const meQuery = useQuery({ queryKey: ['me'], queryFn: () => api.me() });
  const questsQuery = useQuery({ queryKey: ['quests'], queryFn: () => api.dailyQuests() });
  const me = meQuery.data;
  const quests = questsQuery.data;

  const level = me ? xpToLevel(me.xpTotal) : null;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Profile card */}
        {meQuery.isLoading ? (
          <ProfileHeroSkeleton />
        ) : (
        <View style={styles.profileCard}>
          <View style={styles.profileRow}>
            <View style={styles.avatarWrap}>
              <ProfileAvatar
                id={me?.id ?? 'profile'}
                nickname={me?.nickname ?? '学习者'}
                size={104}
                url={me?.avatarUrl}
              />
              {level && (
                <View style={styles.lvBadge}>
                  <Text style={styles.lvText}>Lv {level.level}</Text>
                </View>
              )}
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.nickname}>{me?.nickname ?? '学习者'}</Text>
              <Text style={styles.email}>{me?.email}</Text>
            </View>
            <Pressable
              onPress={() => router.push('/settings')}
              style={styles.logoutBtn}
            >
              <Settings size={20} color={colors.inkSoft} />
            </Pressable>
          </View>

          {/* XP progress bar */}
          {level && (
            <View style={styles.levelSection}>
              <View style={styles.levelHeader}>
                <Text style={styles.levelLabel}>等级 {level.level}</Text>
                <Text style={styles.levelLabel}>
                  {level.xpIntoLevel} / {level.xpForNextLevel} XP
                </Text>
              </View>
              <View style={styles.progressBar}>
                <View
                  style={[
                    styles.progressFill,
                    { width: `${(level.xpIntoLevel / level.xpForNextLevel) * 100}%` },
                  ]}
                >
                  <View style={styles.progressShine} />
                </View>
              </View>
            </View>
          )}

          {/* 4 stat mini cards */}
          <View style={styles.statsGrid}>
            <MiniStat
              icon={STREAK_ICON}
              iconHeight={30}
              iconWidth={25}
              value={me?.currentStreak ?? 0} tint="orange"
            />
            <MiniStat
              icon={XP_ICON}
              iconHeight={34}
              iconWidth={34}
              value={me?.xpTotal ?? 0} tint="gold"
            />
            <MiniStat
              icon={DIAMOND_ICON}
              iconHeight={30}
              iconWidth={24}
              value={me?.gems ?? 0} tint="sky"
            />
            <MiniStat
              icon={HEART_ICON}
              iconHeight={34}
              iconWidth={34}
              value={me?.hearts ?? 0} tint="rose"
            />
          </View>
        </View>
        )}

        {/* Daily quests */}
        <View style={styles.questSection}>
          <View style={styles.questHeader}>
            <Text style={styles.questTitle}>每日任务</Text>
            <Text style={styles.questSub}>今日刷新</Text>
          </View>
          {questsQuery.isLoading && <SkeletonRows rows={3} />}
          {!questsQuery.isLoading &&
            quests?.map((q) => {
            const pct = Math.min(100, (q.currentValue / q.targetValue) * 100);
            return (
              <View
                key={q.id}
                style={[
                  styles.questCard,
                  q.completed && { borderColor: colors.green, backgroundColor: colors.greenSoft },
                ]}
              >
                <View style={[styles.questIcon, q.completed && styles.questIconCompleted]}>
                  {q.completed
                    ? <CheckCircle2 size={26} color={colors.white} />
                    : <LocalSvg height={40} source={TARGET_ICON} width={40} />
                  }
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.questName}>{q.title}</Text>
                  <View style={styles.questProgress}>
                    <View style={[styles.questProgressFill, { width: `${pct}%` }]} />
                  </View>
                  <View style={styles.questFooter}>
                    <Text style={styles.questCount}>{q.currentValue} / {q.targetValue}</Text>
                    <View style={styles.questRewards}>
                      <View style={styles.questReward}>
                        <LocalSvg height={15} source={XP_ICON} width={15} />
                        <Text style={[styles.questRewardText, { color: colors.goldDark }]}>{q.xpReward} XP</Text>
                      </View>
                      <View style={styles.questReward}>
                        <LocalSvg height={15} source={DIAMOND_ICON} width={13} />
                        <Text style={[styles.questRewardText, { color: colors.skyDark }]}>{q.gemsReward}</Text>
                      </View>
                    </View>
                  </View>
                </View>
              </View>
            );
          })}
          {!questsQuery.isLoading && (!quests || quests.length === 0) && (
            <EmptyState
              title="今天还没有任务"
              description="过会儿再来看看，新任务马上就到。"
              mood="wink"
            />
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function ProfileHeroSkeleton() {
  return (
    <View style={styles.profileCard}>
      <View style={styles.profileRow}>
        <Skeleton style={{ width: 104, height: 104, borderRadius: radius.full }} />
        <View style={{ flex: 1, gap: 8 }}>
          <Skeleton style={{ height: 24, width: '60%' }} />
          <Skeleton style={{ height: 16, width: '80%' }} />
        </View>
      </View>
      <Skeleton style={{ height: 16, marginTop: 20, borderRadius: radius.full }} />
      <View style={{ flexDirection: 'row', gap: 10, marginTop: 20 }}>
        {[0, 1, 2, 3].map((i) => (
          <Skeleton key={i} style={{ flex: 1, height: 76, borderRadius: radius.lg }} />
        ))}
      </View>
    </View>
  );
}

function ProfileAvatar({
  id,
  nickname,
  size,
  url,
}: {
  id: string;
  nickname: string;
  size: number;
  url?: string | null;
}) {
  if (url) {
    return (
      <Image
        source={{ uri: url }}
        style={{
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: colors.mist,
        }}
        resizeMode="cover"
      />
    );
  }

  const color = AVATAR_COLORS[hashString(id) % AVATAR_COLORS.length];
  const initial = (nickname.trim()[0] ?? '?').toUpperCase();

  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: color,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Text style={styles.avatarInitial}>{initial}</Text>
    </View>
  );
}

function hashString(value: string): number {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash * 31 + value.charCodeAt(i)) >>> 0;
  }
  return hash;
}

const TINT_STYLES: Record<string, { border: string; value: string }> = {
  orange: { border: colors.orange, value: colors.orange },
  gold: { border: colors.gold, value: colors.gold },
  sky: { border: colors.sky, value: colors.sky },
  rose: { border: colors.rose, value: colors.rose },
};

function MiniStat({
  icon,
  iconHeight,
  iconWidth,
  value,
  tint,
}: {
  icon: ImageSourcePropType;
  iconHeight: number;
  iconWidth: number;
  value: number;
  tint: string;
}) {
  const s = TINT_STYLES[tint] ?? TINT_STYLES.gold;
  return (
    <View style={[styles.miniCard, { borderColor: s.border }]}>
      <View style={styles.miniMain}>
        <View style={styles.miniIcon}>
          <LocalSvg height={iconHeight} source={icon} width={iconWidth} />
        </View>
        <Text style={[styles.miniValue, { color: s.value }]}>{value}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.white },
  scroll: { padding: 16, gap: 24, paddingBottom: 32 },
  profileCard: {
    borderRadius: radius.xl,
    borderWidth: 2,
    borderBottomWidth: 6,
    borderColor: colors.line,
    backgroundColor: colors.white,
    padding: 20,
  },
  profileRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatarWrap: { position: 'relative' },
  avatarInitial: {
    color: colors.white,
    fontFamily: fonts.heavy,
    fontSize: 54,
  },
  lvBadge: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    backgroundColor: colors.green,
    borderRadius: radius.full,
    borderWidth: 2,
    borderColor: colors.white,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  lvText: { fontFamily: fonts.display, fontSize: 11, color: colors.white },
  nickname: { fontSize: 22, fontFamily: fonts.heavy, color: colors.ink },
  email: { fontSize: 13, fontFamily: fonts.sansBold, color: colors.inkSoft },
  logoutBtn: {
    borderRadius: radius.lg,
    borderWidth: 2,
    borderColor: colors.line,
    padding: 8,
  },
  levelSection: { marginTop: 20 },
  levelHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  levelLabel: { fontFamily: fonts.heavy, fontSize: 10, color: colors.inkSoft, textTransform: 'uppercase', letterSpacing: 1 },
  progressBar: {
    height: 16,
    borderRadius: radius.full,
    backgroundColor: colors.line,
    overflow: 'hidden',
    marginTop: 6,
  },
  progressFill: {
    height: '100%',
    borderRadius: radius.full,
    backgroundColor: colors.green,
  },
  progressShine: {
    position: 'absolute',
    top: 3,
    left: 8,
    right: 8,
    height: 4,
    borderRadius: radius.full,
    backgroundColor: 'rgba(255,255,255,0.5)',
  },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 18 },
  miniCard: {
    width: '47%',
    borderRadius: radius.lg,
    borderWidth: 2,
    borderBottomWidth: 4,
    backgroundColor: colors.white,
    minHeight: 64,
    paddingHorizontal: 12,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  miniMain: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'center',
  },
  miniIcon: {
    alignItems: 'center',
    height: 34,
    justifyContent: 'center',
    width: 36,
  },
  miniValue: { fontFamily: fonts.display, fontSize: 22, lineHeight: 27 },
  questSection: {},
  questHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  questTitle: { fontFamily: fonts.heavy, fontSize: 20, color: colors.ink },
  questSub: { fontFamily: fonts.heavy, fontSize: 10, color: colors.inkSoft, textTransform: 'uppercase', letterSpacing: 1 },
  questCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderRadius: radius.lg,
    borderWidth: 2,
    borderBottomWidth: 6,
    borderColor: colors.line,
    backgroundColor: colors.white,
    padding: 14,
    marginBottom: 10,
  },
  questIcon: {
    width: 44,
    height: 44,
    borderRadius: radius.lg,
    backgroundColor: colors.greenSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  questIconCompleted: {
    backgroundColor: colors.green,
  },
  questName: { fontFamily: fonts.heavy, color: colors.ink, fontSize: 14 },
  questProgress: { height: 12, borderRadius: radius.full, backgroundColor: colors.line, overflow: 'hidden', marginTop: 6 },
  questProgressFill: { height: '100%', borderRadius: radius.full, backgroundColor: colors.green },
  questFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 },
  questCount: { fontFamily: fonts.heavy, fontSize: 10, color: colors.inkSoft, textTransform: 'uppercase', letterSpacing: 1 },
  questRewards: { flexDirection: 'row', gap: 8 },
  questReward: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  questRewardText: { fontFamily: fonts.heavy, fontSize: 10 },
});
