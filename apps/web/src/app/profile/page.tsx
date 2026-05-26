'use client';

import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { Flame, Gem, Heart, LogOut, Sparkles } from 'lucide-react';
import { AppShell } from '@/components/AppShell';
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
        <section className="card">
          <div className="flex items-center gap-4">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-sz-green/10 text-3xl">
              🦊
            </div>
            <div className="flex-1">
              <div className="text-2xl font-extrabold">{me?.nickname}</div>
              <div className="text-sm text-sz-ink/60">{me?.email}</div>
            </div>
            <button
              onClick={() => {
                clear();
                router.push('/');
              }}
              className="rounded-chunky p-2 text-sz-ink/40 hover:bg-rose-50 hover:text-sz-rose"
            >
              <LogOut className="h-5 w-5" />
            </button>
          </div>

          {level && (
            <div className="mt-6">
              <div className="flex justify-between text-sm font-bold">
                <span>等级 {level.level}</span>
                <span>
                  {level.xpIntoLevel} / {level.xpForNextLevel} XP
                </span>
              </div>
              <div className="mt-2 h-3 overflow-hidden rounded-full bg-sz-ink/10">
                <div
                  className="h-full bg-sz-green"
                  style={{ width: `${(level.xpIntoLevel / level.xpForNextLevel) * 100}%` }}
                />
              </div>
            </div>
          )}

          <div className="mt-6 grid grid-cols-4 gap-3 text-center">
            <Mini icon={<Flame className="h-5 w-5 text-orange-500" />} label="连胜" value={me?.currentStreak ?? 0} />
            <Mini icon={<Sparkles className="h-5 w-5 text-sz-gold" />} label="总 XP" value={me?.xpTotal ?? 0} />
            <Mini icon={<Gem className="h-5 w-5 text-sky-500" />} label="宝石" value={me?.gems ?? 0} />
            <Mini icon={<Heart className="h-5 w-5 text-rose-500" />} label="心数" value={me?.hearts ?? 0} />
          </div>
        </section>

        <section>
          <h2 className="text-lg font-extrabold">每日任务</h2>
          <div className="mt-3 flex flex-col gap-3">
            {quests?.map((q) => (
              <div key={q.id} className="card flex items-center gap-4">
                <div className="text-3xl">{q.completed ? '✅' : '🎯'}</div>
                <div className="flex-1">
                  <div className="font-bold">{q.title}</div>
                  <div className="mt-2 h-2 overflow-hidden rounded-full bg-sz-ink/10">
                    <div
                      className="h-full bg-sz-green"
                      style={{
                        width: `${Math.min(100, (q.currentValue / q.targetValue) * 100)}%`,
                      }}
                    />
                  </div>
                  <div className="mt-1 text-xs text-sz-ink/50">
                    {q.currentValue} / {q.targetValue} · 奖励 {q.xpReward} XP + {q.gemsReward} 宝石
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </AppShell>
  );
}

function Mini({ icon, label, value }: { icon: React.ReactNode; label: string; value: number }) {
  return (
    <div className="rounded-chunky bg-sz-mist p-3">
      <div className="flex justify-center">{icon}</div>
      <div className="mt-1 text-xl font-extrabold">{value}</div>
      <div className="text-xs text-sz-ink/60">{label}</div>
    </div>
  );
}
