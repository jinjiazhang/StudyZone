import { View, Text, StyleSheet, Pressable, ScrollView, type ImageSourcePropType } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, UserPlus, UserCheck } from 'lucide-react-native';
import { xpToLevel } from '@studyzone/shared-logic';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { colors, fonts, radius } from '@/lib/theme';
import { Avatar } from '@/components/Avatar';
import { LocalSvg } from '@/components/TopStatsBar';
import { Skeleton } from '@/components/ui/Skeleton';
import { ErrorState } from '@/components/ui/ErrorState';

const STREAK_ICON = require('../../../assets/icons/streak.svg') as ImageSourcePropType;
const XP_ICON = require('../../../assets/icons/xp.svg') as ImageSourcePropType;

const TIER_LABEL: Record<string, string> = {
  bronze: '青铜等级',
  silver: '白银等级',
  gold: '黄金等级',
  sapphire: '蓝宝石等级',
  ruby: '红宝石等级',
  emerald: '翡翠等级',
  diamond: '钻石等级',
};

export default function PublicProfile() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const qc = useQueryClient();
  const accessToken = useAuth((s) => s.accessToken);

  const profileQuery = useQuery({
    queryKey: ['public-profile', id],
    queryFn: () => api.getPublicProfile(id!),
    enabled: !!id && !!accessToken,
  });
  const profile = profileQuery.data;

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ['public-profile', id] });
    qc.invalidateQueries({ queryKey: ['following'] });
    qc.invalidateQueries({ queryKey: ['followers'] });
    qc.invalidateQueries({ queryKey: ['me'] });
  };
  const followMutation = useMutation({
    mutationFn: () => api.followUser(profile!.user.id),
    onSuccess: invalidate,
  });
  const unfollowMutation = useMutation({
    mutationFn: () => api.unfollowUser(profile!.user.id),
    onSuccess: invalidate,
  });
  const pending = followMutation.isPending || unfollowMutation.isPending;
  const level = profile ? xpToLevel(profile.xpTotal) : null;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={{ padding: 16, gap: 16, paddingBottom: 32 }}>
        <Pressable style={styles.back} onPress={() => router.back()} hitSlop={8}>
          <ArrowLeft size={18} color={colors.inkSoft} />
          <Text style={styles.backText}>返回</Text>
        </Pressable>

        {profileQuery.isLoading ? (
          <ProfileSkeleton />
        ) : profileQuery.isError || !profile ? (
          <ErrorState onRetry={() => profileQuery.refetch()} />
        ) : (
          <View style={styles.card}>
            <View style={styles.row}>
              <View style={styles.avatarWrap}>
                <Avatar user={profile.user} size={104} />
                {level && (
                  <View style={styles.lvBadge}>
                    <Text style={styles.lvText}>Lv {level.level}</Text>
                  </View>
                )}
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.nickname} numberOfLines={1}>
                  {profile.user.nickname}
                </Text>
                <Text style={styles.username} numberOfLines={1}>
                  @{profile.user.username}
                </Text>
                {profile.followsYou && !profile.isSelf && (
                  <View style={styles.followsYou}>
                    <Text style={styles.followsYouText}>关注了你</Text>
                  </View>
                )}
              </View>
            </View>

            {!profile.isSelf && (
              <Pressable
                style={[
                  styles.followBtn,
                  profile.isFollowing ? styles.followBtnGhost : styles.followBtnSolid,
                  pending && { opacity: 0.6 },
                ]}
                disabled={pending}
                onPress={() => (profile.isFollowing ? unfollowMutation : followMutation).mutate()}
              >
                {profile.isFollowing ? (
                  <UserCheck size={16} color={colors.inkSoft} />
                ) : (
                  <UserPlus size={16} color="white" />
                )}
                <Text
                  style={[
                    styles.followBtnText,
                    { color: profile.isFollowing ? colors.inkSoft : 'white' },
                  ]}
                >
                  {profile.isFollowing ? '已关注' : '关注'}
                </Text>
              </Pressable>
            )}

            <View style={styles.counts}>
              <Count value={profile.followingCount} label="关注" />
              <Count value={profile.followersCount} label="粉丝" />
            </View>

            <View style={styles.tiles}>
              <Tile icon={STREAK_ICON} value={profile.currentStreak} tint={colors.orange} label="连胜" />
              <Tile icon={XP_ICON} value={profile.xpTotal} tint={colors.gold} label="总 XP" />
              <Tile icon={STREAK_ICON} value={profile.longestStreak} tint={colors.rose} label="最长连胜" />
              <Tile icon={XP_ICON} value={profile.weeklyXp} tint={colors.sky} label="本周 XP" />
            </View>
            {profile.leagueTier && (
              <View style={styles.league}>
                <Text style={styles.leagueText}>
                  {TIER_LABEL[profile.leagueTier] ?? profile.leagueTier}
                </Text>
              </View>
            )}
          </View>
        )}

        <View style={styles.placeholder}>
          <Text style={styles.placeholderTitle}>成就</Text>
          <Text style={styles.placeholderText}>成就系统即将推出，敬请期待。</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function Count({ value, label }: { value: number; label: string }) {
  return (
    <View style={styles.count}>
      <Text style={styles.countValue}>{value}</Text>
      <Text style={styles.countLabel}>{label}</Text>
    </View>
  );
}

function Tile({
  icon,
  value,
  tint,
  label,
}: {
  icon: ImageSourcePropType;
  value: number;
  tint: string;
  label: string;
}) {
  return (
    <View style={[styles.tile, { borderColor: tint }]}>
      <LocalSvg height={26} source={icon} width={26} />
      <Text style={[styles.tileValue, { color: tint }]}>{value}</Text>
      <Text style={styles.tileLabel}>{label}</Text>
    </View>
  );
}

function ProfileSkeleton() {
  return (
    <View style={styles.card}>
      <View style={styles.row}>
        <Skeleton style={{ width: 104, height: 104, borderRadius: 52 }} />
        <View style={{ flex: 1, gap: 8 }}>
          <Skeleton style={{ height: 24, width: 140 }} />
          <Skeleton style={{ height: 16, width: 90 }} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.white },
  back: { flexDirection: 'row', alignItems: 'center', gap: 4, alignSelf: 'flex-start' },
  backText: { fontFamily: fonts.heavy, fontSize: 14, color: colors.inkSoft },
  card: {
    backgroundColor: colors.white,
    borderWidth: 2,
    borderBottomWidth: 6,
    borderColor: colors.line,
    borderRadius: radius.xl,
    padding: 20,
    gap: 16,
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  avatarWrap: { position: 'relative' },
  lvBadge: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    backgroundColor: colors.green,
    borderRadius: radius.full,
    borderWidth: 2,
    borderColor: 'white',
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  lvText: { color: 'white', fontFamily: fonts.heavy, fontSize: 11 },
  nickname: { fontFamily: fonts.heavy, fontSize: 22, color: colors.ink },
  username: { fontFamily: fonts.sansBold, fontSize: 14, color: colors.inkSoft, marginTop: 2 },
  followsYou: {
    marginTop: 4,
    alignSelf: 'flex-start',
    backgroundColor: colors.mist,
    borderRadius: radius.sm,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  followsYouText: { fontFamily: fonts.heavy, fontSize: 11, color: colors.inkSoft },
  followBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderRadius: radius.md,
    paddingVertical: 12,
  },
  followBtnSolid: {
    backgroundColor: colors.rose,
    borderBottomWidth: 4,
    borderBottomColor: 'rgba(0,0,0,0.15)',
  },
  followBtnGhost: { borderWidth: 2, borderColor: colors.line },
  followBtnText: { fontFamily: fonts.heavy, fontSize: 15 },
  counts: { flexDirection: 'row', gap: 20 },
  count: { flexDirection: 'row', alignItems: 'baseline', gap: 4 },
  countValue: { fontFamily: fonts.heavy, fontSize: 18, color: colors.ink },
  countLabel: { fontFamily: fonts.sansBold, fontSize: 13, color: colors.inkSoft },
  tiles: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  tile: {
    flexBasis: '47%',
    flexGrow: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderWidth: 2,
    borderBottomWidth: 4,
    borderRadius: radius.lg,
    paddingVertical: 12,
  },
  tileValue: { fontFamily: fonts.heavy, fontSize: 20 },
  tileLabel: { fontFamily: fonts.sansBold, fontSize: 12, color: colors.inkSoft },
  league: {
    backgroundColor: colors.mist,
    borderWidth: 2,
    borderColor: colors.line,
    borderRadius: radius.lg,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  leagueText: { fontFamily: fonts.heavy, fontSize: 14, color: colors.ink },
  placeholder: {
    backgroundColor: colors.white,
    borderWidth: 2,
    borderColor: colors.line,
    borderStyle: 'dashed',
    borderRadius: radius.lg,
    padding: 24,
    alignItems: 'center',
    gap: 4,
  },
  placeholderTitle: { fontFamily: fonts.heavy, fontSize: 17, color: colors.ink },
  placeholderText: { fontFamily: fonts.sansBold, fontSize: 13, color: colors.inkSoft },
});
