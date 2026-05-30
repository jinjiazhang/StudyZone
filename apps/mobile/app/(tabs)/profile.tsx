import { View, Text, StyleSheet, Pressable, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { Flame, Gem, Heart, LogOut, Sparkles, Target, CheckCircle2 } from 'lucide-react-native';
import { api } from '../../lib/api';
import { useAuthStore } from '../../lib/auth-store';
import { useTabFocusGuard } from '../../lib/use-tab-focus-guard';
import { colors, fonts, radius } from '../../lib/theme';
import { Mascot } from '../../components/Mascot';
import { xpToLevel } from '@studyzone/shared-logic';

export default function Profile() {
  const router = useRouter();
  useTabFocusGuard([['me'], ['quests']]);
  const clear = useAuthStore((s) => s.clear);
  const { data: me } = useQuery({ queryKey: ['me'], queryFn: () => api.me() });
  const { data: quests } = useQuery({ queryKey: ['quests'], queryFn: () => api.dailyQuests() });

  const level = me ? xpToLevel(me.xpTotal) : null;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Profile card */}
        <View style={styles.profileCard}>
          <View style={styles.profileRow}>
            <View style={styles.mascotWrap}>
              <Mascot size={104} mood="wink" />
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
              onPress={() => { clear(); router.replace('/login'); }}
              style={styles.logoutBtn}
            >
              <LogOut size={20} color={colors.inkSoft} />
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
              icon={<Flame size={22} color={colors.orangeDark} />}
              label="连胜" value={me?.currentStreak ?? 0} tint="orange"
            />
            <MiniStat
              icon={<Sparkles size={22} color={colors.goldDark} />}
              label="总 XP" value={me?.xpTotal ?? 0} tint="gold"
            />
            <MiniStat
              icon={<Gem size={22} color={colors.skyDark} />}
              label="宝石" value={me?.gems ?? 0} tint="sky"
            />
            <MiniStat
              icon={<Heart size={22} color={colors.roseDark} />}
              label="心数" value={me?.hearts ?? 0} tint="rose"
            />
          </View>
        </View>

        {/* Daily quests */}
        <View style={styles.questSection}>
          <View style={styles.questHeader}>
            <Text style={styles.questTitle}>每日任务</Text>
            <Text style={styles.questSub}>今日刷新</Text>
          </View>
          {quests?.map((q) => {
            const pct = Math.min(100, (q.currentValue / q.targetValue) * 100);
            return (
              <View
                key={q.id}
                style={[
                  styles.questCard,
                  q.completed && { borderColor: colors.green, backgroundColor: colors.greenSoft },
                ]}
              >
                <View style={[styles.questIcon, q.completed && { backgroundColor: colors.green }]}>
                  {q.completed
                    ? <CheckCircle2 size={24} color={colors.white} />
                    : <Target size={24} color={colors.inkSoft} />
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
                        <Sparkles size={12} color={colors.goldDark} />
                        <Text style={[styles.questRewardText, { color: colors.goldDark }]}>{q.xpReward} XP</Text>
                      </View>
                      <View style={styles.questReward}>
                        <Gem size={12} color={colors.skyDark} />
                        <Text style={[styles.questRewardText, { color: colors.skyDark }]}>{q.gemsReward}</Text>
                      </View>
                    </View>
                  </View>
                </View>
              </View>
            );
          })}
          {(!quests || quests.length === 0) && (
            <View style={styles.emptyQuest}>
              <Text style={styles.emptyQuestText}>今天还没有任务，过会儿再来看看。</Text>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const TINT_STYLES: Record<string, { border: string; bg: string }> = {
  orange: { border: colors.orange, bg: '#FFF7ED' },
  gold: { border: colors.gold, bg: '#FFFBEB' },
  sky: { border: colors.sky, bg: '#EFF6FF' },
  rose: { border: colors.rose, bg: '#FFF1F2' },
};

function MiniStat({ icon, label, value, tint }: { icon: React.ReactNode; label: string; value: number; tint: string }) {
  const s = TINT_STYLES[tint] ?? TINT_STYLES.gold;
  return (
    <View style={[styles.miniCard, { borderColor: s.border, backgroundColor: s.bg }]}>
      {icon}
      <Text style={styles.miniValue}>{value}</Text>
      <Text style={styles.miniLabel}>{label}</Text>
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
  mascotWrap: { position: 'relative' },
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
  lvText: { fontFamily: fonts.heavy, fontSize: 11, color: colors.white },
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
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 20 },
  miniCard: {
    width: '47%',
    borderRadius: radius.lg,
    borderWidth: 2,
    borderBottomWidth: 4,
    padding: 12,
    alignItems: 'center',
  },
  miniValue: { fontFamily: fonts.heavy, fontSize: 22, color: colors.ink, marginTop: 4 },
  miniLabel: { fontFamily: fonts.heavy, fontSize: 10, color: colors.inkSoft, textTransform: 'uppercase', letterSpacing: 1 },
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
    backgroundColor: colors.mist,
    alignItems: 'center',
    justifyContent: 'center',
  },
  questName: { fontFamily: fonts.heavy, color: colors.ink, fontSize: 14 },
  questProgress: { height: 12, borderRadius: radius.full, backgroundColor: colors.line, overflow: 'hidden', marginTop: 6 },
  questProgressFill: { height: '100%', borderRadius: radius.full, backgroundColor: colors.green },
  questFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 },
  questCount: { fontFamily: fonts.heavy, fontSize: 10, color: colors.inkSoft, textTransform: 'uppercase', letterSpacing: 1 },
  questRewards: { flexDirection: 'row', gap: 8 },
  questReward: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  questRewardText: { fontFamily: fonts.heavy, fontSize: 10 },
  emptyQuest: {
    borderRadius: radius.lg,
    borderWidth: 2,
    borderColor: colors.line,
    backgroundColor: colors.white,
    padding: 20,
    alignItems: 'center',
  },
  emptyQuestText: { fontFamily: fonts.sansBold, color: colors.inkSoft },
});
