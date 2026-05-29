'use client';

import { useQuery } from '@tanstack/react-query';
import clsx from 'clsx';
import { Trophy, Crown, Medal, ChevronUp, ChevronDown } from 'lucide-react';
import { AppShell } from '@/components/AppShell';
import { Mascot, SpeechBubble } from '@/components/Mascot';
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

const TIER_COLOR: Record<string, string> = {
  bronze: '#CD7F32',
  silver: '#B8B8B8',
  gold: '#FFC800',
  sapphire: '#1CB0F6',
  ruby: '#FF4B4B',
  emerald: '#58CC02',
  diamond: '#7DD9FF',
};

const TIER_EMOJI: Record<string, string> = {
  bronze: '🥉',
  silver: '🥈',
  gold: '🥇',
  sapphire: '🔷',
  ruby: '♦️',
  emerald: '💚',
  diamond: '💎',
};

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

export default function LeaguePage() {
  const { data: league } = useQuery({ queryKey: ['league'], queryFn: () => api.myLeague() });
  const { data: history } = useQuery({
    queryKey: ['league-history'],
    queryFn: () => api.leagueHistory(),
  });

  const tier = league?.tier ?? 'bronze';
  const tierColor = TIER_COLOR[tier] ?? '#58CC02';
  const entries = league?.entries ?? [];
  const selfIndex = league?.selfIndex ?? -1;
  const promoteCount = league?.promoteCount ?? 0;
  const demoteCount = league?.demoteCount ?? 0;
  const groupSize = league?.groupSize ?? entries.length;

  // top 3 stand on a podium
  const podium = entries.slice(0, 3);
  const others = entries.slice(3);

  return (
    <AppShell>
      <div className="flex flex-col gap-6">
        {/* Tier banner */}
        <header
          className="relative overflow-hidden rounded-3xl border-b-[6px] border-black/15 p-6 text-white"
          style={{ background: tierColor }}
        >
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/20 text-4xl">
              {TIER_EMOJI[tier] ?? '🏆'}
            </div>
            <div className="flex-1">
              <div className="text-xs font-heavy uppercase tracking-widest opacity-80">本周联赛</div>
              <div className="text-2xl font-heavy">{TIER_LABEL[tier] ?? '联赛'}</div>
              <div className="mt-1 text-sm font-bold opacity-90">
                共 {entries.length} 名选手 · 每周一结算
              </div>
            </div>
          </div>
          <div className="mt-4 flex flex-wrap gap-2 text-sm font-heavy">
            {promoteCount > 0 && (
              <span className="inline-flex items-center gap-1 rounded-full bg-white/20 px-3 py-1">
                <ChevronUp className="h-4 w-4" /> 前 {promoteCount} 名晋级
              </span>
            )}
            {demoteCount > 0 && (
              <span className="inline-flex items-center gap-1 rounded-full bg-white/20 px-3 py-1">
                <ChevronDown className="h-4 w-4" /> 末 {demoteCount} 名降级
              </span>
            )}
            {promoteCount === 0 && (
              <span className="inline-flex items-center gap-1 rounded-full bg-white/20 px-3 py-1">
                👑 最高段位
              </span>
            )}
          </div>
        </header>

        {entries.length === 0 ? (
          <div className="flex items-end gap-3">
            <Mascot size={96} mood="sad" />
            <SpeechBubble>
              本周还没有排名记录。完成一节关卡就会自动进入青铜联赛！
            </SpeechBubble>
          </div>
        ) : (
          <>
            {/* Podium */}
            {podium.length > 0 && (
              <section className="grid grid-cols-3 items-end gap-3">
                {/* 2nd */}
                <PodiumCard entry={podium[1]} place={2} active={selfIndex === 1} height="h-24" />
                {/* 1st (taller, center) */}
                <PodiumCard entry={podium[0]} place={1} active={selfIndex === 0} height="h-32" />
                {/* 3rd */}
                <PodiumCard entry={podium[2]} place={3} active={selfIndex === 2} height="h-20" />
              </section>
            )}

            {/* Rest of the leaderboard, with promotion / demotion zone dividers */}
            <ol className="flex flex-col gap-2">
              {others.map((entry, idx) => {
                const rank = entry.rank;
                const isSelf = selfIndex === idx + 3;
                // Insert a "promotion line" right after the last promoting rank.
                const showPromoteLine = promoteCount > 3 && rank === promoteCount;
                // Insert a "demotion line" right before the first demoting rank.
                const showDemoteLine =
                  demoteCount > 0 && rank === groupSize - demoteCount + 1;
                return (
                  <div key={entry.user.id} className="flex flex-col gap-2">
                    {showDemoteLine && <ZoneDivider kind="demote" />}
                    <li
                      className={clsx(
                        'flex items-center gap-4 rounded-2xl border-2 bg-white px-4 py-3 transition',
                        isSelf
                          ? 'border-sz-green bg-sz-green-soft'
                          : entry.zone === 'promoted'
                            ? 'border-[#58CC02]/40'
                            : entry.zone === 'demoted'
                              ? 'border-[#FF4B4B]/40'
                              : 'border-sz-line',
                      )}
                    >
                      <div className="w-7 text-center text-lg font-heavy text-sz-ink-soft">
                        {rank}
                      </div>
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-sz-mist text-xl">
                        🦊
                      </div>
                      <div className="flex-1 font-heavy text-sz-ink">{entry.user.nickname}</div>
                      {entry.zone === 'promoted' && (
                        <ChevronUp className="h-4 w-4 text-[#58CC02]" />
                      )}
                      {entry.zone === 'demoted' && (
                        <ChevronDown className="h-4 w-4 text-[#FF4B4B]" />
                      )}
                      <div className="font-heavy text-sz-green-dark">{entry.weeklyXp} XP</div>
                    </li>
                    {showPromoteLine && <ZoneDivider kind="promote" />}
                  </div>
                );
              })}
            </ol>
          </>
        )}

        {/* History */}
        {history && history.length > 0 && (
          <section className="flex flex-col gap-2">
            <h2 className="text-lg font-heavy text-sz-ink">历史战绩</h2>
            <ul className="flex flex-col gap-2">
              {history.map((h) => (
                <li
                  key={h.weekStart}
                  className="flex items-center gap-3 rounded-2xl border-2 border-sz-line bg-white px-4 py-3"
                >
                  <span className="text-xl">{TIER_EMOJI[h.tier] ?? '🏆'}</span>
                  <div className="flex-1">
                    <div className="font-heavy text-sz-ink">
                      {TIER_LABEL[h.tier] ?? '联赛'} · 第 {h.finalRank} 名
                    </div>
                    <div className="text-xs font-bold text-sz-ink-soft">
                      {h.weekStart.slice(0, 10)} · {h.weeklyXp} XP
                      {h.gemsAwarded > 0 ? ` · +${h.gemsAwarded} 💎` : ''}
                    </div>
                  </div>
                  <span
                    className="rounded-full px-3 py-1 text-xs font-heavy text-white"
                    style={{ background: RESULT_COLOR[h.result] ?? '#AFAFAF' }}
                  >
                    {RESULT_LABEL[h.result] ?? h.result}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
    </AppShell>
  );
}

function ZoneDivider({ kind }: { kind: 'promote' | 'demote' }) {
  const isPromote = kind === 'promote';
  const color = isPromote ? '#58CC02' : '#FF4B4B';
  return (
    <div className="flex items-center gap-2 py-1" style={{ color }}>
      <div className="h-0.5 flex-1 rounded-full" style={{ background: color }} />
      <span className="flex items-center gap-1 text-xs font-heavy">
        {isPromote ? (
          <>
            <ChevronUp className="h-3 w-3" /> 晋级区
          </>
        ) : (
          <>
            <ChevronDown className="h-3 w-3" /> 降级区
          </>
        )}
      </span>
      <div className="h-0.5 flex-1 rounded-full" style={{ background: color }} />
    </div>
  );
}

function PodiumCard({
  entry,
  place,
  active,
  height,
}: {
  entry?: { user: { id: string; nickname: string }; weeklyXp: number };
  place: 1 | 2 | 3;
  active: boolean;
  height: string;
}) {
  if (!entry) return <div />;
  const ringColor =
    place === 1 ? 'border-sz-gold' : place === 2 ? 'border-[#B8B8B8]' : 'border-[#CD7F32]';
  const baseColor =
    place === 1 ? 'bg-sz-gold' : place === 2 ? 'bg-[#B8B8B8]' : 'bg-[#CD7F32]';
  const icon =
    place === 1 ? <Crown className="h-6 w-6 fill-white text-white" /> : <Medal className="h-6 w-6 text-white" />;

  return (
    <div className={clsx('flex flex-col items-center gap-2', active && 'animate-bounceIn')}>
      <div className="relative">
        <div
          className={clsx(
            'flex h-16 w-16 items-center justify-center rounded-full border-4 bg-white text-2xl',
            ringColor,
          )}
        >
          🦊
        </div>
        <span
          className={clsx(
            'absolute -top-2 -right-2 flex h-7 w-7 items-center justify-center rounded-full border-2 border-white shadow-pop',
            baseColor,
          )}
        >
          {icon}
        </span>
      </div>
      <div className="text-center">
        <div className="line-clamp-1 max-w-[8rem] font-heavy text-sz-ink">{entry.user.nickname}</div>
        <div className="text-xs font-heavy text-sz-green-dark">{entry.weeklyXp} XP</div>
      </div>
      <div className={clsx('w-full rounded-t-2xl text-center font-heavy text-white', baseColor, height)}>
        <div className="pt-3 text-3xl">{place}</div>
      </div>
    </div>
  );
}
