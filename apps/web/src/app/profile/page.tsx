'use client';

import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { Flame, Gem, Heart, LogOut, Sparkles, Target, CheckCircle2 } from 'lucide-react';
import { AppShell } from '@/components/AppShell';
import { Mascot } from '@/components/Mascot';
import { api } from '@/lib/api';
import { useAuthStore } from '@/lib/auth-store';
import { xpToLevel } from '@studyzone/shared-logic';

export default function ProfilePage() {
  const router = useRouter();
  const clear = useAuthStore((s) => s.clear);
  const { data: me } = useQuery({ queryKey: ['me'], queryFn: () => api.me() });
  const { data: quests } = useQuery({ queryKey: ['quests'], queryFn: () => api.dailyQuests() });

  const level = me ? xpToLevel(me.xpTotal) : null;

  return (
    <AppShell>
      <div className="flex flex-col gap-8">
        {/* Hero / profile card */}
        <section className="rounded-3xl border-2 border-b-[6px] border-sz-line bg-white p-6">
          <div className="flex items-center gap-4">
            <div className="relative">
              <Mascot size={104} mood="wink" />
              {level && (
                <span className="absolute -bottom-1 -right-1 rounded-full border-2 border-white bg-sz-green px-2 py-0.5 text-xs font-heavy text-white shadow-pop">
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
            <Mini icon={<Flame className="h-6 w-6 text-sz-orange-dark" />} label="连胜" value={me?.currentStreak ?? 0} tint="orange" />
            <Mini icon={<Sparkles className="h-6 w-6 text-sz-gold-dark" />} label="总 XP" value={me?.xpTotal ?? 0} tint="gold" />
            <Mini icon={<Gem className="h-6 w-6 text-sz-sky-dark" />} label="宝石" value={me?.gems ?? 0} tint="sky" />
            <Mini icon={<Heart className="h-6 w-6 text-sz-rose-dark" />} label="心数" value={me?.hearts ?? 0} tint="rose" />
          </div>
        </section>

        {/* Daily quests */}
        <section>
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-heavy text-sz-ink">每日任务</h2>
            <span className="text-xs font-heavy uppercase tracking-wider text-sz-ink-soft">
              今日刷新
            </span>
          </div>
          <div className="mt-3 flex flex-col gap-3">
            {quests?.map((q) => {
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
                      q.completed ? 'bg-sz-green text-white' : 'bg-sz-mist'
                    }`}
                  >
                    {q.completed ? <CheckCircle2 className="h-7 w-7" /> : <Target className="h-7 w-7 text-sz-ink-soft" />}
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
                          <Sparkles className="h-3.5 w-3.5" /> {q.xpReward} XP
                        </span>
                        <span className="inline-flex items-center gap-1 text-sz-sky-dark">
                          <Gem className="h-3.5 w-3.5" /> {q.gemsReward}
                        </span>
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
            {(!quests || quests.length === 0) && (
              <div className="card text-center font-bold text-sz-ink-soft">
                今天还没有任务，过会儿再来看看。
              </div>
            )}
          </div>
        </section>
      </div>
    </AppShell>
  );
}

function Mini({
  icon,
  label,
  value,
  tint,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  tint: 'orange' | 'gold' | 'sky' | 'rose';
}) {
  const bg = {
    orange: 'border-sz-orange bg-orange-50',
    gold: 'border-sz-gold bg-yellow-50',
    sky: 'border-sz-sky bg-sky-50',
    rose: 'border-sz-rose bg-rose-50',
  }[tint];
  return (
    <div className={`rounded-2xl border-2 border-b-[4px] ${bg} p-3 text-center`}>
      <div className="flex justify-center">{icon}</div>
      <div className="mt-1 text-2xl font-heavy text-sz-ink">{value}</div>
      <div className="text-[11px] font-heavy uppercase tracking-wider text-sz-ink-soft">{label}</div>
    </div>
  );
}
