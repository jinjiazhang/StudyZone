import { View, Text, StyleSheet, FlatList, Image, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { Clock3 } from 'lucide-react-native';
import type { LeagueEntryDto } from '@studyzone/shared-types';
import Svg, { Ellipse, Path, Rect } from 'react-native-svg';

import { api } from '@/lib/api';
import { useTabGuard } from '@/lib/guard';
import { colors, fonts, TIER_COLOR, TIER_LABEL } from '@/lib/theme';
import { Mascot } from '@/components/Mascot';
import { SpeechBubble } from '@/components/SpeechBubble';
import { Skeleton, SkeletonRows } from '@/components/ui/Skeleton';
import { ErrorState } from '@/components/ui/ErrorState';

const TIER_ORDER = ['bronze', 'silver', 'gold', 'sapphire', 'ruby', 'emerald', 'diamond'] as const;
const TROPHY_SHADE: Record<string, { base: string; dark: string; light: string }> = {
  bronze: { base: '#E9B17A', dark: '#C78C55', light: '#F6D0A9' },
  silver: { base: '#C8D7E2', dark: '#9AB4C8', light: '#EDF5FA' },
  gold: { base: '#FFC800', dark: '#E5A500', light: '#FFE889' },
  sapphire: { base: '#1CB0F6', dark: '#0E8FCC', light: '#B8E9FF' },
  ruby: { base: '#FF4B4B', dark: '#D83A3A', light: '#FFD0D0' },
  emerald: { base: '#58CC02', dark: '#46A302', light: '#D7FFB8' },
  diamond: { base: '#56C8E6', dark: '#3AA9C7', light: '#D6F6FF' },
};
const AVATAR_COLORS = ['#1CB0F6', '#58CC02', '#CE82FF', '#FF9600', '#FF4B4B', '#2FB36B'];
const LOCALE_FLAG: Record<string, string> = {
  'zh-CN': '🇨🇳',
  'en-US': '🇺🇸',
  'ja-JP': '🇯🇵',
};

export default function League() {
  useTabGuard([['league'], ['league-history']]);
  const leagueQuery = useQuery({ queryKey: ['league'], queryFn: () => api.myLeague() });
  const data = leagueQuery.data;

  if (leagueQuery.isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingWrap}>
          <LeagueSkeleton />
        </View>
      </SafeAreaView>
    );
  }

  if (leagueQuery.isError) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorWrap}>
          <ErrorState onRetry={() => leagueQuery.refetch()} />
        </View>
      </SafeAreaView>
    );
  }

  const tier = data?.tier ?? 'bronze';
  const entries = data?.entries ?? [];
  const selfIndex = data?.selfIndex ?? -1;
  const demoteCount = data?.demoteCount ?? 0;
  const groupSize = data?.groupSize ?? entries.length;
  const currentTierIndex = Math.max(0, TIER_ORDER.findIndex((item) => item === tier));

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        data={entries}
        keyExtractor={(e) => e.user.id}
        contentContainerStyle={styles.listContent}
        ItemSeparatorComponent={() => <View style={styles.rowDivider} />}
        ListHeaderComponent={
          <LeagueHeader
            currentTierIndex={currentTierIndex}
            tier={tier}
            weekEnd={data?.weekEnd}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyRow}>
            <Mascot size={96} mood="sad" />
            <SpeechBubble>
              本周还没有排名记录。完成一节关卡就会自动进入{levelLabel(tier)}！
            </SpeechBubble>
          </View>
        }
        renderItem={({ item }) => {
          const isSelf = selfIndex === item.rank - 1;
          const showDemoteLine = demoteCount > 0 && item.rank === groupSize - demoteCount + 1;

          return (
            <>
              {showDemoteLine && <ZoneDivider />}
              <LeaderboardRow entry={item} isSelf={isSelf} />
            </>
          );
        }}
      />
    </SafeAreaView>
  );
}

function LeagueHeader({
  currentTierIndex,
  tier,
  weekEnd,
}: {
  currentTierIndex: number;
  tier: string;
  weekEnd?: string;
}) {
  return (
    <View style={styles.header}>
      <View style={styles.titleBlock}>
        <Text style={styles.tierTitle}>{levelLabel(tier)}</Text>
        <View style={styles.timeRow}>
          <Clock3 size={17} color={colors.inkFaint} strokeWidth={3} />
          <Text style={styles.timeText}>{remainingLabel(weekEnd)}</Text>
        </View>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.trophyRail}
      >
        {TIER_ORDER.map((item, index) => {
          const isCurrent = item === tier;
          const unlocked = index <= currentTierIndex;
          return (
            <View
              key={item}
              style={[
                styles.trophySlot,
                isCurrent ? styles.trophySlotCurrent : styles.trophySlotMuted,
              ]}
            >
              <Trophy tier={item} active={isCurrent} unlocked={unlocked} />
            </View>
          );
        })}
      </ScrollView>

      <View style={styles.headerDivider} />
    </View>
  );
}

function LeaderboardRow({ entry, isSelf }: { entry: LeagueEntryDto; isSelf: boolean }) {
  const flag = LOCALE_FLAG[entry.user.locale] ?? '🌐';
  const displayLevel = entry.level ?? 0;
  return (
    <View style={[styles.row, isSelf && styles.rowSelf]}>
      <Text style={[styles.rank, isSelf && styles.selfAccent]}>{entry.rank}</Text>
      <Avatar
        id={entry.user.id}
        nickname={entry.user.nickname}
        size={56}
        url={entry.user.avatarUrl}
      />
      <View style={styles.identity}>
        <Text numberOfLines={1} style={[styles.name, isSelf && styles.selfAccent]}>
          {entry.user.nickname}
        </Text>
        <View style={styles.metaRow}>
          <Text style={styles.flag}>{flag}</Text>
          <Text style={styles.levelText}>{displayLevel}</Text>
        </View>
      </View>
      <Text style={[styles.xp, isSelf && styles.selfAccent]}>{entry.weeklyXp} 经验</Text>
    </View>
  );
}

function Trophy({
  active,
  tier,
  unlocked,
}: {
  active: boolean;
  tier: string;
  unlocked: boolean;
}) {
  const palette = unlocked
    ? (TROPHY_SHADE[tier] ?? TROPHY_SHADE.bronze)
    : { base: '#E8E8E8', dark: '#D2D2D2', light: '#F7F7F7' };
  const width = active ? 86 : 62;
  const height = active ? 98 : 72;

  return (
    <Svg width={width} height={height} viewBox="0 0 120 120">
      <Ellipse cx="60" cy="108" rx="34" ry="8" fill={palette.dark} opacity={unlocked ? 0.55 : 0.35} />
      <Rect x="45" y="78" width="30" height="26" rx="9" fill={palette.dark} />
      <Ellipse cx="60" cy="96" rx="30" ry="12" fill={palette.base} />
      <Path
        d="M28 35C16 35 10 43 10 55C10 68 20 78 34 80"
        fill="none"
        stroke={palette.dark}
        strokeLinecap="round"
        strokeWidth="9"
      />
      <Path
        d="M92 35C104 35 110 43 110 55C110 68 100 78 86 80"
        fill="none"
        stroke={palette.dark}
        strokeLinecap="round"
        strokeWidth="9"
      />
      <Path
        d="M34 18H86C90 18 93 21 93 25V52C93 70 79 83 60 88C41 83 27 70 27 52V25C27 21 30 18 34 18Z"
        fill={palette.base}
        stroke={palette.dark}
        strokeLinejoin="round"
        strokeWidth="7"
      />
      <Path d="M42 23H76L43 78C33 71 30 62 30 52V30C30 26 34 23 42 23Z" fill={palette.light} opacity="0.48" />
      {!unlocked && <Path d="M54 50H66V68H54V50Z" fill={palette.dark} opacity="0.42" />}
      {!unlocked && <Ellipse cx="60" cy="46" rx="10" ry="9" fill={palette.dark} opacity="0.42" />}
    </Svg>
  );
}

function ZoneDivider() {
  return (
    <View style={styles.zoneDivider}>
      <Text style={styles.zoneText}>⬇ 滑降地带 ⬇</Text>
    </View>
  );
}

function Avatar({
  id,
  nickname,
  size = 64,
  url,
}: {
  id: string;
  nickname: string;
  size?: number;
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

function LeagueSkeleton() {
  return (
    <>
      <Skeleton style={{ height: 96, borderRadius: 8 }} />
      <View style={{ flexDirection: 'row', gap: 16 }}>
        <Skeleton style={{ height: 110, width: 92, borderRadius: 8 }} />
        <Skeleton style={{ height: 132, width: 108, borderRadius: 8 }} />
        <Skeleton style={{ height: 110, width: 92, borderRadius: 8 }} />
      </View>
      <SkeletonRows rows={7} />
    </>
  );
}

function levelLabel(tier: string): string {
  return (TIER_LABEL[tier] ?? '联赛').replace('联赛', '等级');
}

function remainingLabel(weekEnd?: string): string {
  if (!weekEnd) return '本周结束';
  const diffMs = new Date(weekEnd).getTime() - Date.now();
  if (!Number.isFinite(diffMs) || diffMs <= 0) return '即将结算';
  const hours = Math.floor(diffMs / (1000 * 60 * 60));
  if (hours < 1) return '不到 1 小时';
  return `${hours} 小时`;
}

function hashString(value: string): number {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash * 31 + value.charCodeAt(i)) >>> 0;
  }
  return hash;
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.white },
  loadingWrap: { gap: 18, padding: 20 },
  errorWrap: { padding: 16 },
  listContent: {
    paddingBottom: 18,
  },
  header: {
    backgroundColor: colors.white,
  },
  titleBlock: {
    paddingHorizontal: 28,
    paddingTop: 2,
  },
  tierTitle: {
    color: colors.ink,
    fontFamily: fonts.heavy,
    fontSize: 31,
  },
  timeRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 6,
    marginTop: 8,
  },
  timeText: {
    color: colors.inkFaint,
    fontFamily: fonts.heavy,
    fontSize: 18,
  },
  trophyRail: {
    alignItems: 'flex-end',
    gap: 30,
    minWidth: '100%',
    paddingBottom: 10,
    paddingHorizontal: 34,
    paddingTop: 12,
  },
  trophySlot: {
    alignItems: 'center',
    height: 96,
    justifyContent: 'flex-end',
    width: 70,
  },
  trophySlotCurrent: {
    width: 112,
  },
  trophySlotMuted: {
    opacity: 0.88,
  },
  headerDivider: {
    backgroundColor: colors.line,
    height: 2,
  },
  emptyRow: {
    alignItems: 'flex-end',
    flexDirection: 'row',
    gap: 8,
    padding: 24,
  },
  row: {
    alignItems: 'center',
    backgroundColor: colors.white,
    flexDirection: 'row',
    gap: 12,
    minHeight: 76,
    paddingHorizontal: 6,
    paddingVertical: 8,
  },
  rowSelf: {
    backgroundColor: '#FADADB',
  },
  rowDivider: {
    backgroundColor: colors.white,
    height: 0,
  },
  rank: {
    color: colors.inkFaint,
    fontFamily: fonts.heavy,
    fontSize: 16,
    textAlign: 'center',
    width: 22,
  },
  identity: {
    flex: 1,
    minWidth: 0,
  },
  name: {
    color: colors.ink,
    fontFamily: fonts.heavy,
    fontSize: 20,
  },
  metaRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 6,
    marginTop: 4,
  },
  flag: {
    fontSize: 18,
    lineHeight: 22,
  },
  levelText: {
    color: colors.inkSoft,
    fontFamily: fonts.heavy,
    fontSize: 16,
  },
  xp: {
    color: colors.inkFaint,
    fontFamily: fonts.heavy,
    fontSize: 17,
    minWidth: 100,
    textAlign: 'right',
  },
  selfAccent: {
    color: colors.rose,
  },
  avatarInitial: {
    color: colors.white,
    fontFamily: fonts.heavy,
    fontSize: 30,
  },
  zoneDivider: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 64,
    paddingVertical: 10,
  },
  zoneText: {
    color: colors.rose,
    fontFamily: fonts.heavy,
    fontSize: 24,
  },
});
