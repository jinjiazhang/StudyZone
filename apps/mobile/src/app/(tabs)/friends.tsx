import { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Pressable,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Flame, Sparkles, Search, UserPlus, UserCheck } from 'lucide-react-native';
import type { FollowUserDto, UserPublic, UserSearchResultDto } from '@studyzone/shared-types';
import { api } from '@/lib/api';
import { useTabGuard } from '@/lib/guard';
import { colors, fonts, radius } from '@/lib/theme';
import { Avatar } from '@/components/Avatar';
import { SkeletonRows } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';

type Tab = 'following' | 'followers';

export default function Friends() {
  const qc = useQueryClient();
  const router = useRouter();
  useTabGuard([['following'], ['followers']]);

  const [term, setTerm] = useState('');
  const [debounced, setDebounced] = useState('');
  const [tab, setTab] = useState<Tab>('following');

  useEffect(() => {
    const handle = setTimeout(() => setDebounced(term.trim()), 300);
    return () => clearTimeout(handle);
  }, [term]);

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ['following'] });
    qc.invalidateQueries({ queryKey: ['followers'] });
    qc.invalidateQueries({ queryKey: ['user-search'] });
    qc.invalidateQueries({ queryKey: ['me'] });
  };
  const followMutation = useMutation({
    mutationFn: (id: string) => api.followUser(id),
    onSuccess: invalidate,
  });
  const unfollowMutation = useMutation({
    mutationFn: (id: string) => api.unfollowUser(id),
    onSuccess: invalidate,
  });
  const pending = followMutation.isPending || unfollowMutation.isPending;
  const toggle = (id: string, isFollowing: boolean) =>
    isFollowing ? unfollowMutation.mutate(id) : followMutation.mutate(id);

  const searchQuery = useQuery({
    queryKey: ['user-search', debounced],
    queryFn: () => api.searchUsers(debounced),
    enabled: debounced.length > 0,
  });
  const followingQuery = useQuery({ queryKey: ['following'], queryFn: () => api.listFollowing() });
  const followersQuery = useQuery({ queryKey: ['followers'], queryFn: () => api.listFollowers() });

  const results = searchQuery.data?.items ?? [];
  const activeQuery = tab === 'following' ? followingQuery : followersQuery;
  const rows = activeQuery.data?.items ?? [];
  const open = (id: string) => router.push(`/users/${id}`);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={{ padding: 16, gap: 16, paddingBottom: 32 }}>
        {/* Banner */}
        <View style={styles.banner}>
          <Text style={styles.bannerSub}>社交</Text>
          <Text style={styles.bannerTitle}>关注</Text>
          <Text style={styles.bannerInfo}>关注一起学习的伙伴，看他们的本周 XP！</Text>
        </View>

        {/* Search */}
        <View style={styles.card}>
          <View style={styles.cardTitleRow}>
            <Search size={18} color={colors.roseDark} />
            <Text style={styles.cardTitle}>找人</Text>
          </View>
          <View style={styles.searchBox}>
            <Search size={16} color={colors.inkSoft} />
            <TextInput
              value={term}
              onChangeText={setTerm}
              placeholder="按用户名或昵称搜索"
              placeholderTextColor={colors.inkSoft}
              autoCapitalize="none"
              style={styles.input}
            />
          </View>

          {debounced.length > 0 &&
            (searchQuery.isLoading ? (
              <SkeletonRows rows={3} />
            ) : searchQuery.isError ? (
              <ErrorState onRetry={() => searchQuery.refetch()} />
            ) : results.length === 0 ? (
              <EmptyState title="没有找到用户" description="换个用户名或昵称再试试。" />
            ) : (
              <View style={{ gap: 8 }}>
                {results.map((r) => (
                  <SearchRow
                    key={r.user.id}
                    result={r}
                    pending={pending}
                    onToggle={toggle}
                    onOpen={open}
                  />
                ))}
              </View>
            ))}
        </View>

        {/* Tabs */}
        <View style={styles.tabRow}>
          <Pressable
            style={[styles.tab, tab === 'following' && styles.tabActive]}
            onPress={() => setTab('following')}
          >
            <Text style={[styles.tabText, tab === 'following' && styles.tabTextActive]}>
              关注{followingQuery.data ? ` (${followingQuery.data.items.length})` : ''}
            </Text>
          </Pressable>
          <Pressable
            style={[styles.tab, tab === 'followers' && styles.tabActive]}
            onPress={() => setTab('followers')}
          >
            <Text style={[styles.tabText, tab === 'followers' && styles.tabTextActive]}>
              粉丝{followersQuery.data ? ` (${followersQuery.data.items.length})` : ''}
            </Text>
          </Pressable>
        </View>

        {activeQuery.isLoading ? (
          <SkeletonRows rows={4} />
        ) : activeQuery.isError ? (
          <ErrorState onRetry={() => activeQuery.refetch()} />
        ) : rows.length === 0 ? (
          <EmptyState
            title={tab === 'following' ? '还没有关注任何人' : '还没有粉丝'}
            description={
              tab === 'following'
                ? '用上面的搜索框，关注一个一起学习的伙伴吧！'
                : '多和朋友分享你的主页，让他们来关注你。'
            }
          />
        ) : (
          <View style={{ gap: 8 }}>
            {rows.map((f) => (
              <FollowRow
                key={f.user.id}
                row={f}
                pending={pending}
                onToggle={toggle}
                onOpen={open}
              />
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function SearchRow({
  result,
  pending,
  onToggle,
  onOpen,
}: {
  result: UserSearchResultDto;
  pending: boolean;
  onToggle: (id: string, isFollowing: boolean) => void;
  onOpen: (id: string) => void;
}) {
  return (
    <View style={styles.row}>
      <UserCell user={result.user} subtitle={`@${result.user.username}`} onOpen={onOpen} />
      <FollowBtn
        isFollowing={result.isFollowing}
        pending={pending}
        onPress={() => onToggle(result.user.id, result.isFollowing)}
      />
    </View>
  );
}

function FollowRow({
  row,
  pending,
  onToggle,
  onOpen,
}: {
  row: FollowUserDto;
  pending: boolean;
  onToggle: (id: string, isFollowing: boolean) => void;
  onOpen: (id: string) => void;
}) {
  return (
    <View style={styles.row}>
      <UserCell
        user={row.user}
        onOpen={onOpen}
        stats={
          <View style={styles.stats}>
            <View style={styles.stat}>
              <Flame size={14} color={colors.orange} />
              <Text style={styles.statText}>{row.currentStreak}</Text>
            </View>
            <View style={styles.stat}>
              <Sparkles size={14} color={colors.gold} />
              <Text style={styles.statText}>{row.weeklyXp} XP（本周）</Text>
            </View>
          </View>
        }
      />
      <FollowBtn
        isFollowing={row.isFollowing}
        pending={pending}
        onPress={() => onToggle(row.user.id, row.isFollowing)}
      />
    </View>
  );
}

function UserCell({
  user,
  subtitle,
  stats,
  onOpen,
}: {
  user: UserPublic;
  subtitle?: string;
  stats?: React.ReactNode;
  onOpen: (id: string) => void;
}) {
  return (
    <Pressable style={styles.cell} onPress={() => onOpen(user.id)}>
      <Avatar user={user} />
      <View style={{ flex: 1 }}>
        <Text style={styles.name} numberOfLines={1}>
          {user.nickname}
        </Text>
        {stats ?? (
          <Text style={styles.subtitle} numberOfLines={1}>
            {subtitle}
          </Text>
        )}
      </View>
    </Pressable>
  );
}

function FollowBtn({
  isFollowing,
  pending,
  onPress,
}: {
  isFollowing: boolean;
  pending: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      style={[
        styles.followBtn,
        isFollowing ? styles.followBtnGhost : styles.followBtnSolid,
        pending && { opacity: 0.6 },
      ]}
      disabled={pending}
      onPress={onPress}
    >
      {isFollowing ? (
        <UserCheck size={15} color={colors.inkSoft} />
      ) : (
        <UserPlus size={15} color="white" />
      )}
      <Text style={[styles.followBtnText, { color: isFollowing ? colors.inkSoft : 'white' }]}>
        {isFollowing ? '已关注' : '关注'}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.white },
  banner: {
    backgroundColor: colors.rose,
    borderRadius: radius.xl,
    padding: 20,
    borderBottomWidth: 6,
    borderBottomColor: 'rgba(0,0,0,0.15)',
  },
  bannerSub: { color: 'rgba(255,255,255,0.8)', fontFamily: fonts.heavy, fontSize: 11, letterSpacing: 1.5, textTransform: 'uppercase' },
  bannerTitle: { color: 'white', fontFamily: fonts.heavy, fontSize: 24 },
  bannerInfo: { color: 'rgba(255,255,255,0.9)', fontFamily: fonts.sansBold, fontSize: 13, marginTop: 4 },
  card: {
    backgroundColor: colors.white,
    borderWidth: 2,
    borderColor: colors.line,
    borderRadius: radius.lg,
    padding: 16,
    gap: 12,
  },
  cardTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  cardTitle: { fontFamily: fonts.heavy, fontSize: 17, color: colors.ink },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 2,
    borderColor: colors.line,
    borderRadius: radius.md,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  input: { flex: 1, fontFamily: fonts.sansBold, color: colors.ink, padding: 0 },
  tabRow: { flexDirection: 'row', gap: 8 },
  tab: {
    borderRadius: radius.md,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderWidth: 2,
    borderColor: colors.line,
  },
  tabActive: { backgroundColor: colors.ink, borderColor: colors.ink },
  tabText: { fontFamily: fonts.heavy, fontSize: 14, color: colors.inkSoft },
  tabTextActive: { color: 'white' },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.white,
    borderWidth: 2,
    borderColor: colors.line,
    borderRadius: radius.lg,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  cell: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 12 },
  name: { fontFamily: fonts.heavy, fontSize: 15, color: colors.ink },
  subtitle: { fontFamily: fonts.sansBold, fontSize: 12, color: colors.inkSoft, marginTop: 2 },
  stats: { flexDirection: 'row', gap: 12, marginTop: 2 },
  stat: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  statText: { fontFamily: fonts.sansBold, fontSize: 12, color: colors.inkSoft },
  followBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: radius.md,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  followBtnSolid: {
    backgroundColor: colors.rose,
    borderBottomWidth: 4,
    borderBottomColor: 'rgba(0,0,0,0.15)',
  },
  followBtnGhost: { borderWidth: 2, borderColor: colors.line },
  followBtnText: { fontFamily: fonts.heavy, fontSize: 14 },
});
