import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Pressable,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Flame, Sparkles, UserPlus, Check, X, Trash2, Clock } from 'lucide-react-native';
import { ApiClientError } from '@studyzone/api-client';
import { api } from '../../lib/api';
import { useTabFocusGuard } from '../../lib/use-tab-focus-guard';
import { colors, fonts, radius } from '../../lib/theme';
import { Mascot } from '../../components/Mascot';
import { SpeechBubble } from '../../components/SpeechBubble';

const ERROR_LABEL: Record<string, string> = {
  user_not_found: '找不到这个邮箱对应的用户',
  self_friend: '不能添加自己为好友',
  already_friends: '你们已经是好友啦',
  request_not_found: '请求不存在或已处理',
};

export default function Friends() {
  const qc = useQueryClient();
  useTabFocusGuard([['friends'], ['friend-requests']]);
  const [email, setEmail] = useState('');
  const [feedback, setFeedback] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null);

  const friendsQuery = useQuery({ queryKey: ['friends'], queryFn: () => api.friends() });
  const requestsQuery = useQuery({
    queryKey: ['friend-requests'],
    queryFn: () => api.friendRequests(),
  });

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ['friends'] });
    qc.invalidateQueries({ queryKey: ['friend-requests'] });
  };

  const sendMutation = useMutation({
    mutationFn: (e: string) => api.sendFriendRequest(e),
    onSuccess: () => {
      setEmail('');
      setFeedback({ kind: 'ok', text: '已发送好友请求！' });
      invalidate();
    },
    onError: (err) => {
      const code = err instanceof ApiClientError ? (err.body as { code?: string })?.code : undefined;
      setFeedback({ kind: 'err', text: (code && ERROR_LABEL[code]) || '发送失败，请重试' });
    },
  });

  const acceptMutation = useMutation({
    mutationFn: (id: string) => api.acceptFriendRequest(id),
    onSuccess: invalidate,
  });
  const declineMutation = useMutation({
    mutationFn: (id: string) => api.declineFriendRequest(id),
    onSuccess: invalidate,
  });
  const removeMutation = useMutation({
    mutationFn: (id: string) => api.removeFriend(id),
    onSuccess: invalidate,
  });

  const friends = friendsQuery.data?.items ?? [];
  const incoming = requestsQuery.data?.incoming ?? [];
  const outgoing = requestsQuery.data?.outgoing ?? [];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={{ padding: 16, gap: 16, paddingBottom: 32 }}>
        {/* Banner */}
        <View style={styles.banner}>
          <Text style={styles.bannerSub}>社交</Text>
          <Text style={styles.bannerTitle}>好友</Text>
          <Text style={styles.bannerInfo}>和朋友一起学习，互相比拼本周 XP！</Text>
        </View>

        {/* Add friend */}
        <View style={styles.card}>
          <View style={styles.cardTitleRow}>
            <UserPlus size={18} color={colors.roseDark} />
            <Text style={styles.cardTitle}>添加好友</Text>
          </View>
          <TextInput
            value={email}
            onChangeText={setEmail}
            placeholder="输入对方的注册邮箱"
            placeholderTextColor={colors.inkSoft}
            autoCapitalize="none"
            keyboardType="email-address"
            style={styles.input}
          />
          <Pressable
            style={[styles.primaryBtn, sendMutation.isPending && { opacity: 0.6 }]}
            disabled={sendMutation.isPending}
            onPress={() => {
              setFeedback(null);
              if (email.trim()) sendMutation.mutate(email.trim());
            }}
          >
            {sendMutation.isPending ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text style={styles.primaryBtnText}>发送请求</Text>
            )}
          </Pressable>
          {feedback && (
            <Text
              style={[
                styles.feedback,
                { color: feedback.kind === 'ok' ? colors.greenDark : colors.roseDark },
              ]}
            >
              {feedback.text}
            </Text>
          )}
        </View>

        {/* Incoming */}
        {incoming.length > 0 && (
          <View style={{ gap: 8 }}>
            <Text style={styles.sectionTitle}>收到的请求 ({incoming.length})</Text>
            {incoming.map((r) => (
              <View key={r.user.id} style={styles.row}>
                <Avatar />
                <Text style={styles.name}>{r.user.nickname}</Text>
                <Pressable
                  style={[styles.iconBtn, { backgroundColor: colors.green }]}
                  onPress={() => acceptMutation.mutate(r.user.id)}
                >
                  <Check size={18} color="white" />
                </Pressable>
                <Pressable
                  style={[styles.iconBtn, styles.iconBtnGhost]}
                  onPress={() => declineMutation.mutate(r.user.id)}
                >
                  <X size={18} color={colors.inkSoft} />
                </Pressable>
              </View>
            ))}
          </View>
        )}

        {/* Outgoing */}
        {outgoing.length > 0 && (
          <View style={{ gap: 8 }}>
            <Text style={styles.sectionTitle}>已发送 ({outgoing.length})</Text>
            {outgoing.map((r) => (
              <View key={r.user.id} style={styles.row}>
                <Avatar />
                <Text style={styles.name}>{r.user.nickname}</Text>
                <View style={styles.pending}>
                  <Clock size={14} color={colors.inkSoft} />
                  <Text style={styles.pendingText}>等待确认</Text>
                </View>
                <Pressable
                  style={[styles.iconBtn, styles.iconBtnGhost]}
                  onPress={() => removeMutation.mutate(r.user.id)}
                >
                  <X size={18} color={colors.inkSoft} />
                </Pressable>
              </View>
            ))}
          </View>
        )}

        {/* Friends */}
        <View style={{ gap: 8 }}>
          <Text style={styles.sectionTitle}>我的好友 ({friends.length})</Text>
          {friends.length === 0 ? (
            <View style={styles.emptyRow}>
              <Mascot size={80} mood="happy" />
              <View style={{ flex: 1 }}>
                <SpeechBubble>还没有好友。用上面的邮箱邀请一个一起学习的伙伴吧！</SpeechBubble>
              </View>
            </View>
          ) : (
            friends.map((f) => (
              <View key={f.user.id} style={styles.row}>
                <Avatar />
                <View style={{ flex: 1 }}>
                  <Text style={styles.name}>{f.user.nickname}</Text>
                  <View style={styles.stats}>
                    <View style={styles.stat}>
                      <Flame size={14} color={colors.orange} />
                      <Text style={styles.statText}>{f.currentStreak}</Text>
                    </View>
                    <View style={styles.stat}>
                      <Sparkles size={14} color={colors.gold} />
                      <Text style={styles.statText}>{f.weeklyXp} XP（本周）</Text>
                    </View>
                  </View>
                </View>
                <Pressable
                  style={styles.iconBtnPlain}
                  onPress={() =>
                    Alert.alert('删除好友', `确定删除好友「${f.user.nickname}」吗？`, [
                      { text: '取消', style: 'cancel' },
                      {
                        text: '删除',
                        style: 'destructive',
                        onPress: () => removeMutation.mutate(f.user.id),
                      },
                    ])
                  }
                >
                  <Trash2 size={16} color={colors.inkSoft} />
                </Pressable>
              </View>
            ))
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function Avatar() {
  return (
    <View style={styles.avatar}>
      <Text style={{ fontSize: 18 }}>🦊</Text>
    </View>
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
  input: {
    borderWidth: 2,
    borderColor: colors.line,
    borderRadius: radius.md,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontFamily: fonts.sansBold,
    color: colors.ink,
  },
  primaryBtn: {
    backgroundColor: colors.rose,
    borderRadius: radius.md,
    paddingVertical: 12,
    alignItems: 'center',
    borderBottomWidth: 4,
    borderBottomColor: 'rgba(0,0,0,0.15)',
  },
  primaryBtnText: { color: 'white', fontFamily: fonts.heavy, fontSize: 15 },
  feedback: { fontFamily: fonts.sansBold, fontSize: 13 },
  sectionTitle: { fontFamily: fonts.heavy, fontSize: 17, color: colors.ink },
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
  name: { flex: 1, fontFamily: fonts.heavy, fontSize: 15, color: colors.ink },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: radius.full,
    backgroundColor: colors.mist,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconBtn: { width: 36, height: 36, borderRadius: radius.full, alignItems: 'center', justifyContent: 'center' },
  iconBtnGhost: { borderWidth: 2, borderColor: colors.line },
  iconBtnPlain: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  pending: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  pendingText: { fontFamily: fonts.heavy, fontSize: 12, color: colors.inkSoft },
  stats: { flexDirection: 'row', gap: 12, marginTop: 2 },
  stat: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  statText: { fontFamily: fonts.sansBold, fontSize: 12, color: colors.inkSoft },
  emptyRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 12, paddingVertical: 8 },
});
