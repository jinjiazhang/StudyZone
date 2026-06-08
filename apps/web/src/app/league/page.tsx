'use client';

import { useQuery } from '@tanstack/react-query';
import clsx from 'clsx';
import { Clock3 } from 'lucide-react';
import type { LeagueEntryDto } from '@studyzone/shared-types';
import { AppShell } from '@/components/AppShell';
import { Avatar } from '@/components/Avatar';
import { Mascot, SpeechBubble } from '@/components/Mascot';
import { Skeleton, SkeletonRows } from '@/components/ui/Skeleton';
import { ErrorState } from '@/components/ui/ErrorState';
import { api } from '@/lib/api';

const TIER_ORDER = ['bronze', 'silver', 'gold', 'sapphire', 'ruby', 'emerald', 'diamond'] as const;

const TIER_LABEL: Record<string, string> = {
  bronze: '青铜等级',
  silver: '白银等级',
  gold: '黄金等级',
  sapphire: '蓝宝石等级',
  ruby: '红宝石等级',
  emerald: '翡翠等级',
  diamond: '钻石等级',
};

const TROPHY_SHADE: Record<string, { base: string; dark: string; light: string }> = {
  bronze: { base: '#E9B17A', dark: '#C78C55', light: '#F6D0A9' },
  silver: { base: '#C8D7E2', dark: '#9AB4C8', light: '#EDF5FA' },
  gold: { base: '#FFC800', dark: '#E5A500', light: '#FFE889' },
  sapphire: { base: '#1CB0F6', dark: '#0E8FCC', light: '#B8E9FF' },
  ruby: { base: '#FF4B4B', dark: '#D83A3A', light: '#FFD0D0' },
  emerald: { base: '#58CC02', dark: '#46A302', light: '#D7FFB8' },
  diamond: { base: '#56C8E6', dark: '#3AA9C7', light: '#D6F6FF' },
};

const LOCALE_FLAG: Record<string, string> = {
  'zh-CN': '🇨🇳',
  'en-US': '🇺🇸',
  'ja-JP': '🇯🇵',
};

export default function LeaguePage() {
  const leagueQuery = useQuery({ queryKey: ['league'], queryFn: () => api.myLeague() });
  const data = leagueQuery.data;

  if (leagueQuery.isLoading) {
    return (
      <AppShell>
        <LeagueSkeleton />
      </AppShell>
    );
  }
  if (leagueQuery.isError) {
    return (
      <AppShell>
        <ErrorState onRetry={() => leagueQuery.refetch()} />
      </AppShell>
    );
  }

  const tier = data?.tier ?? 'bronze';
  const entries = data?.entries ?? [];
  const selfIndex = data?.selfIndex ?? -1;
  const demoteCount = data?.demoteCount ?? 0;
  const groupSize = data?.groupSize ?? entries.length;
  const currentTierIndex = Math.max(0, TIER_ORDER.findIndex((item) => item === tier));

  return (
    <AppShell>
      <div className="flex flex-col">
        {/* header */}
        <div className="px-2">
          <h1 className="text-3xl font-heavy text-sz-ink">{levelLabel(tier)}</h1>
          <div className="mt-2 flex items-center gap-1.5 text-sz-ink-soft">
            <Clock3 className="h-[17px] w-[17px] stroke-[3]" />
            <span className="text-lg font-heavy">{remainingLabel(data?.weekEnd)}</span>
          </div>
        </div>

        {/* trophy rail */}
        <div className="mt-3 flex items-end gap-7 overflow-x-auto px-2 pb-3 pt-2">
          {TIER_ORDER.map((item, index) => (
            <div
              key={item}
              className={clsx(
                'flex shrink-0 items-end justify-center',
                item === tier ? 'w-28' : 'w-16 opacity-90',
              )}
            >
              <Trophy tier={item} active={item === tier} unlocked={index <= currentTierIndex} />
            </div>
          ))}
        </div>

        <div className="h-0.5 bg-sz-line" />

        {/* leaderboard */}
        {entries.length === 0 ? (
          <div className="flex items-end gap-3 p-6">
            <Mascot size={96} mood="sad" />
            <SpeechBubble>
              本周还没有排名记录。完成一节关卡就会自动进入{levelLabel(tier)}！
            </SpeechBubble>
          </div>
        ) : (
          <ol className="pt-1">
            {entries.map((entry) => {
              const isSelf = selfIndex === entry.rank - 1;
              const showDemoteLine =
                demoteCount > 0 && entry.rank === groupSize - demoteCount + 1;
              return (
                <li key={entry.user.id}>
                  {showDemoteLine && <ZoneDivider />}
                  <LeaderboardRow entry={entry} isSelf={isSelf} />
                </li>
              );
            })}
          </ol>
        )}
      </div>
    </AppShell>
  );
}

function LeaderboardRow({ entry, isSelf }: { entry: LeagueEntryDto; isSelf: boolean }) {
  const flag = LOCALE_FLAG[entry.user.locale] ?? '🌐';
  return (
    <div
      className={clsx(
        'flex min-h-[76px] items-center gap-3 rounded-xl px-2 py-2',
        isSelf && 'bg-[#FADADB]',
      )}
    >
      <span
        className={clsx(
          'w-6 text-center font-heavy',
          isSelf ? 'text-sz-rose' : 'text-sz-ink-soft',
        )}
      >
        {entry.rank}
      </span>
      <Avatar user={entry.user} size={56} />
      <div className="min-w-0 flex-1">
        <div className={clsx('truncate text-xl font-heavy', isSelf ? 'text-sz-rose' : 'text-sz-ink')}>
          {entry.user.nickname}
        </div>
        <div className="mt-1 flex items-center gap-1.5">
          <span className="text-lg leading-none">{flag}</span>
          <span className="font-heavy text-sz-ink-soft">{entry.level ?? 0}</span>
        </div>
      </div>
      <span
        className={clsx(
          'min-w-[88px] text-right font-heavy',
          isSelf ? 'text-sz-rose' : 'text-sz-ink-soft',
        )}
      >
        {entry.weeklyXp} 经验
      </span>
    </div>
  );
}

function Trophy({ active, tier, unlocked }: { active: boolean; tier: string; unlocked: boolean }) {
  const palette = (unlocked ? TROPHY_SHADE[tier] : undefined) ?? {
    base: unlocked ? '#E9B17A' : '#E8E8E8',
    dark: unlocked ? '#C78C55' : '#D2D2D2',
    light: unlocked ? '#F6D0A9' : '#F7F7F7',
  };
  const width = active ? 86 : 62;
  const height = active ? 98 : 72;

  return (
    <svg width={width} height={height} viewBox="0 0 120 120" fill="none">
      <ellipse cx="60" cy="108" rx="34" ry="8" fill={palette.dark} opacity={unlocked ? 0.55 : 0.35} />
      <rect x="45" y="78" width="30" height="26" rx="9" fill={palette.dark} />
      <ellipse cx="60" cy="96" rx="30" ry="12" fill={palette.base} />
      <path
        d="M28 35C16 35 10 43 10 55C10 68 20 78 34 80"
        fill="none"
        stroke={palette.dark}
        strokeLinecap="round"
        strokeWidth="9"
      />
      <path
        d="M92 35C104 35 110 43 110 55C110 68 100 78 86 80"
        fill="none"
        stroke={palette.dark}
        strokeLinecap="round"
        strokeWidth="9"
      />
      <path
        d="M34 18H86C90 18 93 21 93 25V52C93 70 79 83 60 88C41 83 27 70 27 52V25C27 21 30 18 34 18Z"
        fill={palette.base}
        stroke={palette.dark}
        strokeLinejoin="round"
        strokeWidth="7"
      />
      <path
        d="M42 23H76L43 78C33 71 30 62 30 52V30C30 26 34 23 42 23Z"
        fill={palette.light}
        opacity="0.48"
      />
      {!unlocked && <path d="M54 50H66V68H54V50Z" fill={palette.dark} opacity="0.42" />}
      {!unlocked && <ellipse cx="60" cy="46" rx="10" ry="9" fill={palette.dark} opacity="0.42" />}
    </svg>
  );
}

function ZoneDivider() {
  return (
    <div className="flex min-h-[64px] items-center justify-center py-2.5">
      <span className="text-2xl font-heavy text-sz-rose">⬇ 滑降地带 ⬇</span>
    </div>
  );
}

function LeagueSkeleton() {
  return (
    <div className="flex flex-col gap-4">
      <Skeleton className="h-9 w-40" />
      <div className="flex items-end gap-4">
        <Skeleton className="h-[72px] w-16 rounded-2xl" />
        <Skeleton className="h-[98px] w-24 rounded-2xl" />
        <Skeleton className="h-[72px] w-16 rounded-2xl" />
      </div>
      <SkeletonRows rows={7} />
    </div>
  );
}

function levelLabel(tier: string): string {
  return TIER_LABEL[tier] ?? '等级';
}

function remainingLabel(weekEnd?: string): string {
  if (!weekEnd) return '本周结束';
  const diffMs = new Date(weekEnd).getTime() - Date.now();
  if (!Number.isFinite(diffMs) || diffMs <= 0) return '即将结算';
  const hours = Math.floor(diffMs / (1000 * 60 * 60));
  if (hours < 1) return '不到 1 小时';
  return `${hours} 小时`;
}

