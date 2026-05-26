'use client';

import { useQuery } from '@tanstack/react-query';
import clsx from 'clsx';
import { Trophy } from 'lucide-react';
import { AppShell } from '@/components/AppShell';
import { api } from '@/lib/api';

const TIER_LABEL: Record<string, string> = {
  bronze: '青铜联赛',
  silver: '白银联赛',
  gold: '黄金联赛',
  sapphire: '蓝宝石联赛',
  ruby: '红宝石联赛',
  emerald: '翡翠联赛',
  diamond: '钻石联赛',
};

export default function LeaguePage() {
  const { data: league } = useQuery({ queryKey: ['league'], queryFn: () => api.myLeague() });

  return (
    <AppShell>
      <div className="flex flex-col gap-6">
        <header className="card flex items-center gap-4">
          <Trophy className="h-10 w-10 text-sz-gold" />
          <div>
            <div className="text-xl font-extrabold">{TIER_LABEL[league?.tier ?? 'bronze']}</div>
            <div className="text-sm text-sz-ink/60">
              本周与 {(league?.entries.length ?? 0)} 名同伴竞争。每周一结算。
            </div>
          </div>
        </header>

        <ol className="flex flex-col gap-2">
          {(league?.entries ?? []).map((entry, idx) => (
            <li
              key={entry.user.id}
              className={clsx(
                'flex items-center gap-4 rounded-chunky bg-white p-4 shadow-card transition',
                idx === league?.selfIndex && 'ring-2 ring-sz-green',
              )}
            >
              <div className="w-6 text-center font-extrabold text-sz-ink/50">
                {entry.rank}
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-sz-mist text-xl">
                🦊
              </div>
              <div className="flex-1 font-bold">{entry.user.nickname}</div>
              <div className="font-extrabold text-sz-green">{entry.weeklyXp} XP</div>
            </li>
          ))}
          {(!league || league.entries.length === 0) && (
            <div className="card text-center text-sz-ink/50">
              本周还没有排名记录。完成一节关卡就会自动进入青铜联赛！
            </div>
          )}
        </ol>
      </div>
    </AppShell>
  );
}
