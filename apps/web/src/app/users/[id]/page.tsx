'use client';

import type { JSX } from 'react';
import { useParams } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, UserPlus, UserCheck } from 'lucide-react';
import Link from 'next/link';
import { xpToLevel } from '@studyzone/shared-logic';
import { AppShell } from '@/components/AppShell';
import { Avatar } from '@/components/Avatar';
import { Skeleton } from '@/components/ui/Skeleton';
import { ErrorState } from '@/components/ui/ErrorState';
import { api } from '@/lib/api';

const TIER_LABEL: Record<string, string> = {
  bronze: '青铜等级',
  silver: '白银等级',
  gold: '黄金等级',
  sapphire: '蓝宝石等级',
  ruby: '红宝石等级',
  emerald: '翡翠等级',
  diamond: '钻石等级',
};

export default function PublicProfilePage(): JSX.Element {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const qc = useQueryClient();

  const profileQuery = useQuery({
    queryKey: ['public-profile', id],
    queryFn: () => api.getPublicProfile(id),
    enabled: !!id,
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
    <AppShell>
      <div className="flex flex-col gap-6">
        <Link
          href="/friends"
          className="flex w-fit items-center gap-1 text-sm font-heavy text-sz-ink-soft hover:text-sz-ink"
        >
          <ArrowLeft className="h-4 w-4" /> 返回
        </Link>

        {profileQuery.isLoading ? (
          <ProfileSkeleton />
        ) : profileQuery.isError || !profile ? (
          <ErrorState onRetry={() => profileQuery.refetch()} />
        ) : (
          <section className="rounded-3xl border-2 border-b-[6px] border-sz-line bg-white p-6">
            <div className="flex items-center gap-4">
              <div className="relative">
                <Avatar user={profile.user} size={104} />
                {level && (
                  <span className="absolute -bottom-1 -right-1 rounded-full border-2 border-white bg-sz-green px-2 py-0.5 font-display text-xs font-heavy text-white shadow-pop">
                    Lv {level.level}
                  </span>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className="truncate text-2xl font-heavy text-sz-ink">{profile.user.nickname}</div>
                <div className="truncate text-sm font-bold text-sz-ink-soft">
                  @{profile.user.username}
                </div>
                {profile.followsYou && !profile.isSelf && (
                  <div className="mt-1 inline-block rounded-md bg-sz-mist px-2 py-0.5 text-xs font-heavy text-sz-ink-soft">
                    关注了你
                  </div>
                )}
              </div>
              {!profile.isSelf && (
                <button
                  onClick={() => (profile.isFollowing ? unfollowMutation : followMutation).mutate()}
                  disabled={pending}
                  className={
                    'flex shrink-0 items-center gap-1.5 rounded-xl px-4 py-2 text-sm font-heavy transition active:translate-y-0.5 disabled:opacity-60 ' +
                    (profile.isFollowing
                      ? 'border-2 border-sz-line text-sz-ink-soft'
                      : 'border-b-4 border-black/15 bg-sz-rose text-white')
                  }
                >
                  {profile.isFollowing ? (
                    <>
                      <UserCheck className="h-4 w-4" /> 已关注
                    </>
                  ) : (
                    <>
                      <UserPlus className="h-4 w-4" /> 关注
                    </>
                  )}
                </button>
              )}
            </div>

            {/* Follow counts */}
            <div className="mt-6 flex gap-6">
              <Count value={profile.followingCount} label="关注" />
              <Count value={profile.followersCount} label="粉丝" />
            </div>

            {/* Stats */}
            <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
              <Mini src="/assets/icons/streak.svg" iconClass="h-[30px] w-[25px]" value={profile.currentStreak} tint="orange" />
              <Mini src="/assets/icons/xp.svg" iconClass="h-[34px] w-[34px]" value={profile.xpTotal} tint="gold" />
              <Mini src="/assets/icons/streak.svg" iconClass="h-[30px] w-[25px]" value={profile.longestStreak} tint="rose" />
              <Mini src="/assets/icons/xp.svg" iconClass="h-[34px] w-[34px]" value={profile.weeklyXp} tint="sky" />
            </div>
            {profile.leagueTier && (
              <div className="mt-3 rounded-2xl border-2 border-sz-line bg-sz-mist px-4 py-3 text-sm font-heavy text-sz-ink">
                {TIER_LABEL[profile.leagueTier] ?? profile.leagueTier}
              </div>
            )}
          </section>
        )}

        {/* Achievements placeholder */}
        <section className="rounded-2xl border-2 border-dashed border-sz-line bg-white p-6 text-center">
          <div className="text-lg font-heavy text-sz-ink">成就</div>
          <div className="mt-1 text-sm font-bold text-sz-ink-soft">成就系统即将推出，敬请期待。</div>
        </section>
      </div>
    </AppShell>
  );
}

function Count({ value, label }: { value: number; label: string }): JSX.Element {
  return (
    <div className="flex items-baseline gap-1.5">
      <span className="font-display text-xl font-heavy text-sz-ink">{value}</span>
      <span className="text-sm font-bold text-sz-ink-soft">{label}</span>
    </div>
  );
}

function Mini({
  src,
  iconClass,
  value,
  tint,
}: {
  src: string;
  iconClass: string;
  value: number;
  tint: 'orange' | 'gold' | 'sky' | 'rose';
}): JSX.Element {
  const border = {
    orange: 'border-sz-orange',
    gold: 'border-sz-gold',
    sky: 'border-sz-sky',
    rose: 'border-sz-rose',
  }[tint];
  const valueColor = {
    orange: 'text-sz-orange',
    gold: 'text-sz-gold',
    sky: 'text-sz-sky',
    rose: 'text-sz-rose',
  }[tint];
  return (
    <div className={`flex min-h-[64px] items-center justify-center gap-2 rounded-2xl border-2 border-b-[4px] bg-white px-3 py-2.5 ${border}`}>
      <span className="flex h-[34px] w-9 items-center justify-center">
        <img src={src} alt="" draggable={false} className={iconClass} />
      </span>
      <span className={`font-display text-2xl font-heavy ${valueColor}`}>{value}</span>
    </div>
  );
}

function ProfileSkeleton(): JSX.Element {
  return (
    <section className="rounded-3xl border-2 border-b-[6px] border-sz-line bg-white p-6">
      <div className="flex items-center gap-4">
        <Skeleton className="h-[104px] w-[104px] rounded-full" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-7 w-36" />
          <Skeleton className="h-4 w-24" />
        </div>
      </div>
      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-[64px] rounded-2xl" />
        ))}
      </div>
    </section>
  );
}
