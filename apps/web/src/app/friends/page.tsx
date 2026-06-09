'use client';

import type { JSX } from 'react';
import { useState } from 'react';
import Link from 'next/link';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Flame, Sparkles, Search, UserPlus, UserCheck } from 'lucide-react';
import type { FollowUserDto, UserPublic, UserSearchResultDto } from '@studyzone/shared-types';
import { AppShell } from '@/components/AppShell';
import { Avatar } from '@/components/Avatar';
import { SkeletonRows } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { useDebouncedValue } from '@/lib/use-debounced-value';
import { api } from '@/lib/api';

type Tab = 'following' | 'followers';

export default function FriendsPage(): JSX.Element {
  const qc = useQueryClient();
  const [term, setTerm] = useState('');
  const [tab, setTab] = useState<Tab>('following');
  const debounced = useDebouncedValue(term.trim(), 300);

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
  const toggle = (id: string, isFollowing: boolean) =>
    isFollowing ? unfollowMutation.mutate(id) : followMutation.mutate(id);
  const pending = followMutation.isPending || unfollowMutation.isPending;

  const searchQuery = useQuery({
    queryKey: ['user-search', debounced],
    queryFn: () => api.searchUsers(debounced),
    enabled: debounced.length > 0,
  });

  const followingQuery = useQuery({
    queryKey: ['following'],
    queryFn: () => api.listFollowing(),
  });
  const followersQuery = useQuery({
    queryKey: ['followers'],
    queryFn: () => api.listFollowers(),
  });

  const results = searchQuery.data?.items ?? [];
  const activeQuery = tab === 'following' ? followingQuery : followersQuery;
  const rows = activeQuery.data?.items ?? [];

  return (
    <AppShell>
      <div className="flex flex-col gap-6">
        <header className="rounded-3xl border-b-[6px] border-black/15 bg-sz-rose p-6 text-white">
          <div className="text-xs font-heavy uppercase tracking-widest opacity-80">社交</div>
          <div className="text-2xl font-heavy">关注</div>
          <div className="mt-1 text-sm font-bold opacity-90">关注一起学习的伙伴，看他们的本周 XP！</div>
        </header>

        {/* Search */}
        <section className="rounded-2xl border-2 border-sz-line bg-white p-5">
          <h2 className="mb-3 flex items-center gap-2 text-lg font-heavy text-sz-ink">
            <Search className="h-5 w-5 text-sz-rose-dark" /> 找人
          </h2>
          <div className="flex items-center gap-2 rounded-xl border-2 border-sz-line px-4 py-3 focus-within:border-sz-rose">
            <Search className="h-4 w-4 text-sz-ink-soft" />
            <input
              value={term}
              onChange={(e) => setTerm(e.target.value)}
              placeholder="按用户名或昵称搜索"
              className="flex-1 bg-transparent font-bold text-sz-ink outline-none placeholder:text-sz-ink-soft"
            />
          </div>

          {debounced.length > 0 && (
            <div className="mt-3">
              {searchQuery.isLoading ? (
                <SkeletonRows rows={3} />
              ) : searchQuery.isError ? (
                <ErrorState onRetry={() => searchQuery.refetch()} />
              ) : results.length === 0 ? (
                <EmptyState title="没有找到用户" description="换个用户名或昵称再试试。" />
              ) : (
                <ul className="flex flex-col gap-2">
                  {results.map((r) => (
                    <SearchRow key={r.user.id} result={r} pending={pending} onToggle={toggle} />
                  ))}
                </ul>
              )}
            </div>
          )}
        </section>

        {/* Following / Followers tabs */}
        <section className="flex flex-col gap-3">
          <div className="flex gap-2">
            <TabButton active={tab === 'following'} onClick={() => setTab('following')}>
              关注{followingQuery.data ? ` (${followingQuery.data.items.length})` : ''}
            </TabButton>
            <TabButton active={tab === 'followers'} onClick={() => setTab('followers')}>
              粉丝{followersQuery.data ? ` (${followersQuery.data.items.length})` : ''}
            </TabButton>
          </div>

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
            <ul className="flex flex-col gap-2">
              {rows.map((f) => (
                <FollowRow key={f.user.id} row={f} pending={pending} onToggle={toggle} />
              ))}
            </ul>
          )}
        </section>
      </div>
    </AppShell>
  );
}

function SearchRow({
  result,
  pending,
  onToggle,
}: {
  result: UserSearchResultDto;
  pending: boolean;
  onToggle: (id: string, isFollowing: boolean) => void;
}): JSX.Element {
  return (
    <li className="flex items-center gap-3 rounded-2xl border-2 border-sz-line bg-white px-4 py-3">
      <UserCell user={result.user} subtitle={`@${result.user.username}`} />
      <FollowButton
        isFollowing={result.isFollowing}
        pending={pending}
        onClick={() => onToggle(result.user.id, result.isFollowing)}
      />
    </li>
  );
}

function FollowRow({
  row,
  pending,
  onToggle,
}: {
  row: FollowUserDto;
  pending: boolean;
  onToggle: (id: string, isFollowing: boolean) => void;
}): JSX.Element {
  return (
    <li className="flex items-center gap-3 rounded-2xl border-2 border-sz-line bg-white px-4 py-3">
      <UserCell
        user={row.user}
        stats={
          <div className="flex items-center gap-3 text-xs font-bold text-sz-ink-soft">
            <span className="flex items-center gap-1">
              <Flame className="h-3.5 w-3.5 text-sz-orange" /> {row.currentStreak}
            </span>
            <span className="flex items-center gap-1">
              <Sparkles className="h-3.5 w-3.5 text-sz-gold" /> {row.weeklyXp} XP（本周）
            </span>
          </div>
        }
      />
      <FollowButton
        isFollowing={row.isFollowing}
        pending={pending}
        onClick={() => onToggle(row.user.id, row.isFollowing)}
      />
    </li>
  );
}

function UserCell({
  user,
  subtitle,
  stats,
}: {
  user: UserPublic;
  subtitle?: string;
  stats?: JSX.Element;
}): JSX.Element {
  return (
    <Link href={`/users/${user.id}`} className="flex flex-1 items-center gap-3">
      <Avatar user={user} />
      <div className="min-w-0">
        <div className="truncate font-heavy text-sz-ink">{user.nickname}</div>
        {stats ?? <div className="truncate text-xs font-bold text-sz-ink-soft">{subtitle}</div>}
      </div>
    </Link>
  );
}

function FollowButton({
  isFollowing,
  pending,
  onClick,
}: {
  isFollowing: boolean;
  pending: boolean;
  onClick: () => void;
}): JSX.Element {
  return (
    <button
      onClick={onClick}
      disabled={pending}
      className={
        'flex shrink-0 items-center gap-1.5 rounded-xl px-4 py-2 text-sm font-heavy transition active:translate-y-0.5 disabled:opacity-60 ' +
        (isFollowing
          ? 'border-2 border-sz-line text-sz-ink-soft'
          : 'border-b-4 border-black/15 bg-sz-rose text-white')
      }
    >
      {isFollowing ? (
        <>
          <UserCheck className="h-4 w-4" /> 已关注
        </>
      ) : (
        <>
          <UserPlus className="h-4 w-4" /> 关注
        </>
      )}
    </button>
  );
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}): JSX.Element {
  return (
    <button
      onClick={onClick}
      className={
        'rounded-xl px-4 py-2 text-sm font-heavy transition ' +
        (active ? 'bg-sz-ink text-white' : 'border-2 border-sz-line text-sz-ink-soft')
      }
    >
      {children}
    </button>
  );
}
