import { View, Text, StyleSheet, FlatList, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { Crown, Medal, ChevronUp, ChevronDown } from 'lucide-react-native';
import { api } from '../../lib/api';
import { useTabFocusGuard } from '../../lib/use-tab-focus-guard';
import { colors, fonts, radius, TIER_LABEL, TIER_COLOR, TIER_EMOJI } from '../../lib/theme';
import { Mascot } from '../../components/Mascot';
import { SpeechBubble } from '../../components/SpeechBubble';

const RESULT_LABEL: Record<string, string> = {
  promoted: '晋级',
  stayed: '保级',
  demoted: '降级',
};
const RESULT_COLOR: Record<string, string> = {
  promoted: '#58CC02',
  stayed: '#AFAFAF',
  demoted: '#FF4B4B',
};

export default function League() {
  useTabFocusGuard([['league'], ['league-history']]);
  const { data } = useQuery({ queryKey: ['league'], queryFn: () => api.myLeague() });
  const { data: history } = useQuery({
    queryKey: ['league-history'],
    queryFn: () => api.leagueHistory(),
  });

  const tier = data?.tier ?? 'bronze';
  const tierColor = TIER_COLOR[tier] ?? colors.green;
  const entries = data?.entries ?? [];
  const selfIndex = data?.selfIndex ?? -1;
  const promoteCount = data?.promoteCount ?? 0;
  const demoteCount = data?.demoteCount ?? 0;
  const groupSize = data?.groupSize ?? entries.length;
  const podium = entries.slice(0, 3);
  const others = entries.slice(3);

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        data={others}
        keyExtractor={(e) => e.user.id}
        contentContainerStyle={{ padding: 16, gap: 8, paddingBottom: 32 }}
        ListHeaderComponent={
          <>
            {/* Tier banner */}
            <View style={[styles.tierBanner, { backgroundColor: tierColor }]}>
              <View style={styles.tierRow}>
                <View style={styles.tierEmojiBox}>
                  <Text style={{ fontSize: 32 }}>{TIER_EMOJI[tier] ?? '🏆'}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.tierSub}>本周联赛</Text>
                  <Text style={styles.tierTitle}>{TIER_LABEL[tier] ?? '联赛'}</Text>
                  <Text style={styles.tierInfo}>
                    共 {entries.length} 名选手 · 每周一结算
                  </Text>
                </View>
              </View>
              <View style={styles.tierBadges}>
                {promoteCount > 0 && (
                  <View style={styles.badge}>
                    <ChevronUp size={14} color="white" />
                    <Text style={styles.badgeText}>前 {promoteCount} 名晋级</Text>
                  </View>
                )}
                {demoteCount > 0 && (
                  <View style={styles.badge}>
                    <ChevronDown size={14} color="white" />
                    <Text style={styles.badgeText}>末 {demoteCount} 名降级</Text>
                  </View>
                )}
                {promoteCount === 0 && (
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>👑 最高段位</Text>
                  </View>
                )}
              </View>
            </View>

            {entries.length === 0 ? (
              <View style={styles.emptyRow}>
                <Mascot size={96} mood="sad" />
                <SpeechBubble>本周还没有排名记录。完成一节关卡就会自动进入青铜联赛！</SpeechBubble>
              </View>
            ) : (
              <>
                {/* Podium */}
                {podium.length > 0 && (
                  <View style={styles.podium}>
                    <PodiumCard entry={podium[1]} place={2} active={selfIndex === 1} />
                    <PodiumCard entry={podium[0]} place={1} active={selfIndex === 0} />
                    <PodiumCard entry={podium[2]} place={3} active={selfIndex === 2} />
                  </View>
                )}
              </>
            )}
          </>
        }
        renderItem={({ item }) => {
          const isSelf = selfIndex === item.rank - 1;
          const showPromoteLine = promoteCount > 3 && item.rank === promoteCount;
          const showDemoteLine = demoteCount > 0 && item.rank === groupSize - demoteCount + 1;
          const zoneBorder =
            item.zone === 'promoted'
              ? 'rgba(88,204,2,0.4)'
              : item.zone === 'demoted'
                ? 'rgba(255,75,75,0.4)'
                : undefined;
          return (
            <>
              {showDemoteLine && <ZoneDivider kind="demote" />}
              <View
                style={[
                  styles.row,
                  zoneBorder ? { borderColor: zoneBorder } : null,
                  isSelf && { borderColor: colors.green, backgroundColor: colors.greenSoft },
                ]}
              >
                <Text style={styles.rank}>{item.rank}</Text>
                <View style={styles.avatar}>
                  <Text style={{ fontSize: 20 }}>🦊</Text>
                </View>
                <Text style={styles.name}>{item.user.nickname}</Text>
                {item.zone === 'promoted' && <ChevronUp size={14} color="#58CC02" />}
                {item.zone === 'demoted' && <ChevronDown size={14} color="#FF4B4B" />}
                <Text style={styles.xp}>{item.weeklyXp} XP</Text>
              </View>
              {showPromoteLine && <ZoneDivider kind="promote" />}
            </>
          );
        }}
        ListFooterComponent={
          history && history.length > 0 ? (
            <View style={{ marginTop: 16, gap: 8 }}>
              <Text style={styles.historyTitle}>历史战绩</Text>
              {history.map((h) => (
                <View key={h.weekStart} style={styles.historyRow}>
                  <Text style={{ fontSize: 20 }}>{TIER_EMOJI[h.tier] ?? '🏆'}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.historyName}>
                      {TIER_LABEL[h.tier] ?? '联赛'} · 第 {h.finalRank} 名
                    </Text>
                    <Text style={styles.historySub}>
                      {h.weekStart.slice(0, 10)} · {h.weeklyXp} XP
                      {h.gemsAwarded > 0 ? ` · +${h.gemsAwarded} 💎` : ''}
                    </Text>
                  </View>
                  <View
                    style={[styles.historyBadge, { backgroundColor: RESULT_COLOR[h.result] ?? '#AFAFAF' }]}
                  >
                    <Text style={styles.historyBadgeText}>{RESULT_LABEL[h.result] ?? h.result}</Text>
                  </View>
                </View>
              ))}
            </View>
          ) : null
        }
        ListEmptyComponent={entries.length > 0 ? null : undefined}
      />
    </SafeAreaView>
  );
}

function ZoneDivider({ kind }: { kind: 'promote' | 'demote' }) {
  const isPromote = kind === 'promote';
  const color = isPromote ? '#58CC02' : '#FF4B4B';
  return (
    <View style={styles.zoneDivider}>
      <View style={[styles.zoneLine, { backgroundColor: color }]} />
      <View style={styles.zoneLabel}>
        {isPromote ? <ChevronUp size={12} color={color} /> : <ChevronDown size={12} color={color} />}
        <Text style={[styles.zoneText, { color }]}>{isPromote ? '晋级区' : '降级区'}</Text>
      </View>
      <View style={[styles.zoneLine, { backgroundColor: color }]} />
    </View>
  );
}

function PodiumCard({
  entry,
  place,
  active,
}: {
  entry?: { user: { id: string; nickname: string }; weeklyXp: number };
  place: 1 | 2 | 3;
  active: boolean;
}) {
  if (!entry) return <View style={{ flex: 1 }} />;

  const ringColor = place === 1 ? colors.gold : place === 2 ? '#B8B8B8' : '#CD7F32';
  const baseColor = place === 1 ? colors.gold : place === 2 ? '#B8B8B8' : '#CD7F32';
  const height = place === 1 ? 100 : place === 2 ? 76 : 60;

  return (
    <View style={styles.podiumCard}>
      <View style={styles.podiumAvatarWrap}>
        <View style={[styles.podiumAvatar, { borderColor: ringColor }]}>
          <Text style={{ fontSize: 24 }}>🦊</Text>
        </View>
        <View style={[styles.podiumBadge, { backgroundColor: baseColor }]}>
          {place === 1 ? (
            <Crown size={14} color="white" fill="white" />
          ) : (
            <Medal size={14} color="white" />
          )}
        </View>
      </View>
      <Text style={styles.podiumName} numberOfLines={1}>{entry.user.nickname}</Text>
      <Text style={styles.podiumXp}>{entry.weeklyXp} XP</Text>
      <View style={[styles.podiumBar, { backgroundColor: baseColor, height }]}>
        <Text style={styles.podiumPlace}>{place}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.white },
  tierBanner: {
    borderRadius: radius.xl,
    padding: 16,
    marginBottom: 16,
    borderBottomWidth: 6,
    borderBottomColor: 'rgba(0,0,0,0.15)',
  },
  tierRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  tierEmojiBox: {
    width: 56,
    height: 56,
    borderRadius: radius.lg,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tierSub: { fontSize: 10, fontFamily: fonts.heavy, color: 'rgba(255,255,255,0.8)', textTransform: 'uppercase', letterSpacing: 1 },
  tierTitle: { fontSize: 22, fontFamily: fonts.heavy, color: colors.white },
  tierInfo: { fontSize: 12, fontFamily: fonts.sansBold, color: 'rgba(255,255,255,0.9)', marginTop: 2 },
  tierBadges: { flexDirection: 'row', gap: 8, marginTop: 12 },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.full,
  },
  badgeText: { fontFamily: fonts.heavy, fontSize: 12, color: colors.white },
  emptyRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 8, marginVertical: 16 },
  podium: { flexDirection: 'row', alignItems: 'flex-end', gap: 8, marginBottom: 16 },
  podiumCard: { flex: 1, alignItems: 'center', gap: 4 },
  podiumAvatarWrap: { position: 'relative' },
  podiumAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 3,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  podiumBadge: {
    position: 'absolute',
    top: -6,
    right: -6,
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  podiumName: { fontFamily: fonts.heavy, fontSize: 12, color: colors.ink, maxWidth: 90 },
  podiumXp: { fontFamily: fonts.heavy, fontSize: 11, color: colors.greenDark },
  podiumBar: {
    width: '100%',
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    alignItems: 'center',
    paddingTop: 8,
  },
  podiumPlace: { fontFamily: fonts.heavy, fontSize: 24, color: colors.white },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    borderWidth: 2,
    borderColor: colors.line,
  },
  rank: { width: 28, textAlign: 'center', fontFamily: fonts.heavy, fontSize: 16, color: colors.inkSoft },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.mist,
    alignItems: 'center',
    justifyContent: 'center',
  },
  name: { flex: 1, fontFamily: fonts.heavy, color: colors.ink },
  xp: { fontFamily: fonts.heavy, color: colors.greenDark },
  zoneDivider: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 4 },
  zoneLine: { flex: 1, height: 2, borderRadius: 1 },
  zoneLabel: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  zoneText: { fontFamily: fonts.heavy, fontSize: 11 },
  historyTitle: { fontFamily: fonts.heavy, fontSize: 18, color: colors.ink, marginBottom: 4 },
  historyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 12,
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    borderWidth: 2,
    borderColor: colors.line,
  },
  historyName: { fontFamily: fonts.heavy, color: colors.ink },
  historySub: { fontFamily: fonts.sansBold, fontSize: 11, color: colors.inkSoft, marginTop: 2 },
  historyBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: radius.full },
  historyBadgeText: { fontFamily: fonts.heavy, fontSize: 12, color: colors.white },
});
