'use client';

import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { LogOut, CheckCircle2 } from 'lucide-react';
import { AppShell } from '@/components/AppShell';
import { Skeleton, SkeletonRows } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { api } from '@/lib/api';
import { useAuthStore } from '@/lib/auth-store';
import { xpToLevel } from '@studyzone/shared-logic';

const AVATAR_COLORS = ['#1CB0F6', '#58CC02', '#CE82FF', '#FF9600', '#FF4B4B', '#2FB36B'];

export default function ProfilePage() {
  const router = useRouter();
  const clear = useAuthStore((s) => s.clear);
  const meQuery = useQuery({ queryKey: ['me'], queryFn: () => api.me() });
  const questsQuery = useQuery({ queryKey: ['quests'], queryFn: () => api.dailyQuests() });
  const me = meQuery.data;
  const quests = questsQuery.data;

  const level = me ? xpToLevel(me.xpTotal) : null;

  return (
    <AppShell>
      <div className="flex flex-col gap-8">
        {/* Hero / profile card */}
        {meQuery.isLoading ? (
          <ProfileHeroSkeleton />
        ) : (
        <section className="rounded-3xl border-2 border-b-[6px] border-sz-line bg-white p-6">
          <div className="flex items-center gap-4">
            <div className="relative">
              <ProfileAvatar
                id={me?.id ?? 'profile'}
                nickname={me?.nickname ?? '学习者'}
                size={104}
                url={me?.avatarUrl}
              />
              {level && (
                <span className="absolute -bottom-1 -right-1 rounded-full border-2 border-white bg-sz-green px-2 py-0.5 font-display text-xs font-heavy text-white shadow-pop">
                  Lv {level.level}
                </span>
              )}
            </div>
            <div className="flex-1">
              <div className="text-2xl font-heavy text-sz-ink">{me?.nickname ?? '学习者'}</div>
              <div className="text-sm font-bold text-sz-ink-soft">{me?.email}</div>
            </div>
            <button
              onClick={() => {
                clear();
                router.push('/');
              }}
              className="rounded-2xl border-2 border-sz-line p-2 text-sz-ink-soft transition hover:border-sz-rose hover:bg-rose-50 hover:text-sz-rose-dark"
              aria-label="退出登录"
            >
              <LogOut className="h-5 w-5" />
            </button>
          </div>

          {level && (
            <div className="mt-6">
              <div className="flex justify-between text-xs font-heavy uppercase tracking-wider text-sz-ink-soft">
                <span>等级 {level.level}</span>
                <span>
                  {level.xpIntoLevel} / {level.xpForNextLevel} XP
                </span>
              </div>
              <div className="mt-2 progress">
                <div
                  className="progress-fill"
                  style={{ width: `${(level.xpIntoLevel / level.xpForNextLevel) * 100}%` }}
                />
              </div>
            </div>
          )}

          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Mini src="/assets/icons/streak.svg" iconClass="h-[30px] w-[25px]" value={me?.currentStreak ?? 0} tint="orange" />
            <Mini src="/assets/icons/xp.svg" iconClass="h-[34px] w-[34px]" value={me?.xpTotal ?? 0} tint="gold" />
            <Mini src="/assets/icons/diamond.svg" iconClass="h-[30px] w-6" value={me?.gems ?? 0} tint="sky" />
            <Mini src="/assets/icons/heart.svg" iconClass="h-[34px] w-[34px]" value={me?.hearts ?? 0} tint="rose" />
          </div>
        </section>
        )}

        {/* Daily quests */}
        <section>
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-heavy text-sz-ink">每日任务</h2>
            <span className="text-xs font-heavy uppercase tracking-wider text-sz-ink-soft">
              今日刷新
            </span>
          </div>
          <div className="mt-3 flex flex-col gap-3">
            {questsQuery.isLoading && <SkeletonRows rows={3} />}
            {!questsQuery.isLoading &&
              quests?.map((q) => {
              const pct = Math.min(100, (q.currentValue / q.targetValue) * 100);
              return (
                <div
                  key={q.id}
                  className={`flex items-center gap-4 rounded-2xl border-2 border-b-[6px] p-4 ${
                    q.completed
                      ? 'border-sz-green bg-sz-green-soft'
                      : 'border-sz-line bg-white'
                  }`}
                >
                  <div
                    className={`flex h-12 w-12 items-center justify-center rounded-2xl text-2xl ${
                      q.completed ? 'bg-sz-green text-white' : 'bg-sz-green-soft'
                    }`}
                  >
                    {q.completed ? (
                      <CheckCircle2 className="h-7 w-7" />
                    ) : (
                      <img src="/assets/icons/target.svg" alt="" draggable={false} className="h-10 w-10" />
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="font-heavy text-sz-ink">{q.title}</div>
                    <div className="mt-2 progress">
                      <div className="progress-fill" style={{ width: `${pct}%` }} />
                    </div>
                    <div className="mt-1.5 flex items-center justify-between text-xs font-heavy uppercase tracking-wider text-sz-ink-soft">
                      <span>
                        {q.currentValue} / {q.targetValue}
                      </span>
                      <span className="flex items-center gap-2">
                        <span className="inline-flex items-center gap-1 text-sz-gold-dark">
                          <img src="/assets/icons/xp.svg" alt="" draggable={false} className="h-[15px] w-[15px]" /> {q.xpReward} XP
                        </span>
                        <span className="inline-flex items-center gap-1 text-sz-sky-dark">
                          <img src="/assets/icons/diamond.svg" alt="" draggable={false} className="h-[15px] w-[13px]" /> {q.gemsReward}
                        </span>
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
            {!questsQuery.isLoading && (!quests || quests.length === 0) && (
              <EmptyState
                title="今天还没有任务"
                description="过会儿再来看看，新任务马上就到。"
                mood="wink"
              />
            )}
          </div>
        </section>
      </div>
    </AppShell>
  );
}

function ProfileHeroSkeleton() {
  return (
    <section className="rounded-3xl border-2 border-b-[6px] border-sz-line bg-white p-6">
      <div className="flex items-center gap-4">
        <Skeleton className="h-[104px] w-[104px] rounded-full" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-7 w-36" />
          <Skeleton className="h-4 w-48" />
        </div>
      </div>
      <Skeleton className="mt-6 h-4 w-full" />
      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-[88px] rounded-2xl" />
        ))}
      </div>
    </section>
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
      <img
        src={url}
        alt=""
        draggable={false}
        className="rounded-full bg-sz-mist object-cover"
        style={{ width: size, height: size }}
      />
    );
  }

  const color = AVATAR_COLORS[hashString(id) % AVATAR_COLORS.length];
  const initial = (nickname.trim()[0] ?? '?').toUpperCase();

  return (
    <div
      className="flex items-center justify-center rounded-full font-display font-heavy text-white"
      style={{ width: size, height: size, backgroundColor: color, fontSize: size * 0.5 }}
    >
      {initial}
    </div>
  );
}

function hashString(value: string): number {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash * 31 + value.charCodeAt(i)) >>> 0;
  }
  return hash;
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
}) {
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
