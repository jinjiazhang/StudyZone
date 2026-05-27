'use client';

import { useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import clsx from 'clsx';
import { Lock, Star, Trophy } from 'lucide-react';
import { api } from '@/lib/api';
import { AppShell } from '@/components/AppShell';
import { Mascot } from '@/components/Mascot';

export default function CoursePage() {
  const params = useParams<{ courseId: string }>();
  const courseId = params.courseId;

  const enroll = useMutation({ mutationFn: () => api.enrollCourse(courseId) });
  useEffect(() => {
    enroll.mutate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [courseId]);

  const { data: tree, isLoading } = useQuery({
    queryKey: ['tree', courseId],
    queryFn: () => api.getCourseTree(courseId),
  });

  if (isLoading)
    return (
      <AppShell>
        <div className="font-bold text-sz-ink-soft">加载课程地图中…</div>
      </AppShell>
    );
  if (!tree)
    return (
      <AppShell>
        <div className="card font-heavy">课程未找到</div>
      </AppShell>
    );

  return (
    <AppShell>
      <div className="mx-auto flex max-w-2xl flex-col gap-12">
        {tree.map((unit, unitIdx) => (
          <section key={unit.unitId}>
            {/* Unit banner */}
            <header
              className="relative overflow-hidden rounded-3xl border-b-[6px] border-black/15 p-5 text-white"
              style={{ background: unit.themeColor }}
            >
              <div className="flex items-center justify-between gap-4">
                <div className="flex-1">
                  <div className="text-xs font-heavy uppercase tracking-widest opacity-80">
                    第 {unit.unitOrder + 1} 单元
                  </div>
                  <div className="mt-1 text-2xl font-heavy">{unit.unitTitle}</div>
                </div>
                <button className="inline-flex items-center gap-2 rounded-2xl border-2 border-white/30 bg-white/15 px-4 py-2 text-sm font-heavy uppercase tracking-wider">
                  <Trophy className="h-4 w-4" /> 单元测验
                </button>
              </div>
              <div className="pointer-events-none absolute -bottom-8 -right-8 text-9xl opacity-20">
                {['🌱', '🌳', '🌟', '🚀', '🏔️'][unitIdx % 5]}
              </div>
            </header>

            {/* Skill path */}
            <ol className="mt-8 flex flex-col items-center gap-8">
              {unit.skills.map((skill, idx) => {
                // Curved path: -2..2 offset using a sine-ish pattern
                const offsets = [-1, 1, 2, 1, -1, -2];
                const offset = offsets[idx % offsets.length] ?? 0;
                return (
                  <SkillNode
                    key={skill.skillId}
                    courseId={courseId}
                    skill={skill}
                    offset={offset}
                    themeColor={unit.themeColor}
                  />
                );
              })}
            </ol>
          </section>
        ))}
      </div>
    </AppShell>
  );
}

function SkillNode({
  courseId,
  skill,
  offset,
  themeColor,
}: {
  courseId: string;
  skill: {
    skillId: string;
    name: string;
    icon: string;
    unlocked: boolean;
    userLevel: number;
    maxLevel: number;
  };
  offset: number;
  themeColor: string;
}) {
  const percent = Math.round((skill.userLevel / skill.maxLevel) * 100);
  const isMastered = skill.userLevel >= skill.maxLevel;
  const inProgress = skill.unlocked && skill.userLevel > 0 && !isMastered;
  const isNext = skill.unlocked && skill.userLevel === 0;

  return (
    <li
      className="flex flex-col items-center gap-2"
      style={{ transform: `translateX(${offset * 36}px)` }}
    >
      <Link
        href={skill.unlocked ? `/learn/courses/${courseId}/skills/${skill.skillId}` : '#'}
        aria-disabled={!skill.unlocked}
        className={clsx(
          'skill-node',
          !skill.unlocked && 'pointer-events-none',
          isNext && 'animate-pulseGlow',
        )}
        style={{
          background: skill.unlocked ? (isMastered ? '#FFC800' : 'white') : '#E5E5E5',
          color: skill.unlocked ? '#3C3C3C' : '#bbbbbb',
          borderColor: themeColor,
        }}
      >
        {skill.unlocked ? (
          <>
            <span className="text-3xl">{skill.icon || '⭐'}</span>
            {isMastered && (
              <span className="absolute -right-1 -top-1 flex h-7 w-7 items-center justify-center rounded-full border-2 border-white bg-sz-gold text-white shadow-pop">
                <Star className="h-4 w-4" fill="white" />
              </span>
            )}
            {inProgress && (
              <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 rounded-full border-2 border-white bg-sz-green px-2 py-0.5 text-[10px] font-heavy text-white">
                Lv {skill.userLevel}/{skill.maxLevel}
              </span>
            )}
            {isNext && (
              <span className="absolute -top-7 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-xl bg-sz-green px-3 py-1 text-xs font-heavy uppercase tracking-wider text-white shadow-pop">
                开始
              </span>
            )}
          </>
        ) : (
          <Lock className="h-7 w-7" />
        )}
      </Link>
      <div className="text-center">
        <div className="font-heavy text-sz-ink">{skill.name}</div>
        {skill.unlocked && !isMastered && (
          <div className="mx-auto mt-1 h-2 w-24 overflow-hidden rounded-full bg-sz-line">
            <div className="h-full rounded-full bg-sz-green" style={{ width: `${percent}%` }} />
          </div>
        )}
      </div>
    </li>
  );
}
