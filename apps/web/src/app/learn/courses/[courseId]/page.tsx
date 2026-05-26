'use client';

import { useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import clsx from 'clsx';
import { Lock } from 'lucide-react';
import { api } from '@/lib/api';
import { AppShell } from '@/components/AppShell';

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

  if (isLoading) return <AppShell><div className="text-sz-ink/60">加载中…</div></AppShell>;
  if (!tree) return <AppShell><div>课程未找到</div></AppShell>;

  return (
    <AppShell>
    <div className="flex flex-col gap-10">
      {tree.map((unit) => (
        <section key={unit.unitId}>
          <header
            className="rounded-chunky p-5 text-white shadow-pop"
            style={{ background: unit.themeColor }}
          >
            <div className="text-xs uppercase tracking-wider opacity-80">
              第 {unit.unitOrder + 1} 单元
            </div>
            <div className="text-2xl font-extrabold">{unit.unitTitle}</div>
          </header>

          <ol className="mt-6 flex flex-col items-center gap-6">
            {unit.skills.map((skill, idx) => (
              <SkillNode
                key={skill.skillId}
                courseId={courseId}
                skill={skill}
                offset={idx % 2 === 0 ? -1 : 1}
              />
            ))}
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
}) {
  const percent = Math.round((skill.userLevel / skill.maxLevel) * 100);
  return (
    <li
      className="flex flex-col items-center gap-2"
      style={{ transform: `translateX(${offset * 40}px)` }}
    >
      <Link
        href={skill.unlocked ? `/learn/courses/${courseId}/skills/${skill.skillId}` : '#'}
        className={clsx(
          'relative flex h-24 w-24 items-center justify-center rounded-full text-4xl shadow-pop transition',
          skill.unlocked
            ? 'bg-white hover:-translate-y-1'
            : 'cursor-not-allowed bg-sz-ink/10 text-sz-ink/30',
        )}
      >
        {skill.unlocked ? (
          <span>{skill.icon || '⭐'}</span>
        ) : (
          <Lock className="h-8 w-8" />
        )}
        {skill.unlocked && (
          <span className="absolute -bottom-1 right-0 rounded-full bg-sz-green px-2 py-0.5 text-xs font-bold text-white">
            Lv {skill.userLevel}/{skill.maxLevel}
          </span>
        )}
      </Link>
      <div className="text-center">
        <div className="font-bold text-sz-ink">{skill.name}</div>
        {skill.unlocked && (
          <div className="mt-1 h-2 w-20 overflow-hidden rounded-full bg-sz-ink/10">
            <div className="h-full bg-sz-green" style={{ width: `${percent}%` }} />
          </div>
        )}
      </div>
    </li>
  );
}
