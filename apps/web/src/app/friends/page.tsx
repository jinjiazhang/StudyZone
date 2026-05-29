'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Flame, Sparkles, UserPlus, Check, X, Trash2, Clock } from 'lucide-react';
import { AppShell } from '@/components/AppShell';
import { Mascot, SpeechBubble } from '@/components/Mascot';
import { ApiClientError } from '@studyzone/api-client';
import { api } from '@/lib/api';

const ERROR_LABEL: Record<string, string> = {
  user_not_found: '找不到这个邮箱对应的用户',
  self_friend: '不能添加自己为好友',
  already_friends: '你们已经是好友啦',
  request_not_found: '请求不存在或已处理',
};

export default function FriendsPage() {
  const qc = useQueryClient();
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
    <AppShell>
      <div className="flex flex-col gap-6">
        <header className="rounded-3xl border-b-[6px] border-black/15 bg-sz-rose p-6 text-white">
          <div className="text-xs font-heavy uppercase tracking-widest opacity-80">社交</div>
          <div className="text-2xl font-heavy">好友</div>
          <div className="mt-1 text-sm font-bold opacity-90">
            和朋友一起学习，互相比拼本周 XP！
          </div>
        </header>

        {/* Add friend */}
        <section className="rounded-2xl border-2 border-sz-line bg-white p-5">
          <h2 className="mb-3 flex items-center gap-2 text-lg font-heavy text-sz-ink">
            <UserPlus className="h-5 w-5 text-sz-rose-dark" /> 添加好友
          </h2>
          <form
            className="flex flex-col gap-3 sm:flex-row"
            onSubmit={(e) => {
              e.preventDefault();
              setFeedback(null);
              if (email.trim()) sendMutation.mutate(email.trim());
            }}
          >
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="输入对方的注册邮箱"
              className="flex-1 rounded-xl border-2 border-sz-line px-4 py-3 font-bold text-sz-ink outline-none focus:border-sz-rose"
            />
            <button
              type="submit"
              disabled={sendMutation.isPending}
              className="rounded-xl border-b-4 border-black/15 bg-sz-rose px-6 py-3 font-heavy text-white transition active:translate-y-0.5 disabled:opacity-60"
            >
              {sendMutation.isPending ? '发送中…' : '发送请求'}
            </button>
          </form>
          {feedback && (
            <div
              className={
                'mt-3 text-sm font-bold ' +
                (feedback.kind === 'ok' ? 'text-sz-green-dark' : 'text-sz-rose-dark')
              }
            >
              {feedback.text}
            </div>
          )}
        </section>

        {/* Incoming requests */}
        {incoming.length > 0 && (
          <section className="flex flex-col gap-2">
            <h2 className="text-lg font-heavy text-sz-ink">收到的请求 ({incoming.length})</h2>
            <ul className="flex flex-col gap-2">
              {incoming.map((r) => (
                <li
                  key={r.user.id}
                  className="flex items-center gap-3 rounded-2xl border-2 border-sz-line bg-white px-4 py-3"
                >
                  <Avatar />
                  <div className="flex-1 font-heavy text-sz-ink">{r.user.nickname}</div>
                  <button
                    onClick={() => acceptMutation.mutate(r.user.id)}
                    disabled={acceptMutation.isPending}
                    className="flex h-9 w-9 items-center justify-center rounded-full bg-sz-green text-white transition active:scale-95"
                    aria-label="接受"
                  >
                    <Check className="h-5 w-5" />
                  </button>
                  <button
                    onClick={() => declineMutation.mutate(r.user.id)}
                    disabled={declineMutation.isPending}
                    className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-sz-line text-sz-ink-soft transition active:scale-95"
                    aria-label="拒绝"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* Outgoing requests */}
        {outgoing.length > 0 && (
          <section className="flex flex-col gap-2">
            <h2 className="text-lg font-heavy text-sz-ink">已发送 ({outgoing.length})</h2>
            <ul className="flex flex-col gap-2">
              {outgoing.map((r) => (
                <li
                  key={r.user.id}
                  className="flex items-center gap-3 rounded-2xl border-2 border-sz-line bg-white px-4 py-3"
                >
                  <Avatar />
                  <div className="flex-1 font-heavy text-sz-ink">{r.user.nickname}</div>
                  <span className="flex items-center gap-1 text-xs font-heavy text-sz-ink-soft">
                    <Clock className="h-4 w-4" /> 等待确认
                  </span>
                  <button
                    onClick={() => removeMutation.mutate(r.user.id)}
                    disabled={removeMutation.isPending}
                    className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-sz-line text-sz-ink-soft transition active:scale-95"
                    aria-label="取消"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* Friend list */}
        <section className="flex flex-col gap-2">
          <h2 className="text-lg font-heavy text-sz-ink">我的好友 ({friends.length})</h2>
          {friends.length === 0 ? (
            <div className="flex items-end gap-3 py-2">
              <Mascot size={88} mood="happy" />
              <SpeechBubble>还没有好友。用上面的邮箱邀请框加一个一起学习的伙伴吧！</SpeechBubble>
            </div>
          ) : (
            <ul className="flex flex-col gap-2">
              {friends.map((f) => (
                <li
                  key={f.user.id}
                  className="group flex items-center gap-3 rounded-2xl border-2 border-sz-line bg-white px-4 py-3"
                >
                  <Avatar />
                  <div className="flex-1">
                    <div className="font-heavy text-sz-ink">{f.user.nickname}</div>
                    <div className="flex items-center gap-3 text-xs font-bold text-sz-ink-soft">
                      <span className="flex items-center gap-1">
                        <Flame className="h-3.5 w-3.5 text-sz-orange" /> {f.currentStreak}
                      </span>
                      <span className="flex items-center gap-1">
                        <Sparkles className="h-3.5 w-3.5 text-sz-gold" /> {f.weeklyXp} XP（本周）
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      if (confirm(`确定删除好友「${f.user.nickname}」吗？`)) {
                        removeMutation.mutate(f.user.id);
                      }
                    }}
                    className="flex h-9 w-9 items-center justify-center rounded-full text-sz-ink-soft opacity-0 transition hover:text-sz-rose-dark group-hover:opacity-100"
                    aria-label="删除好友"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </AppShell>
  );
}

function Avatar() {
  return (
    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-sz-mist text-xl">
      🦊
    </div>
  );
}
