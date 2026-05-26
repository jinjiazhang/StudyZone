'use client';

import { useQuery } from '@tanstack/react-query';
import { useParams, useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { AppShell } from '@/components/AppShell';

/**
 * Skill detail — for v1 we just auto-enter the next available lesson.
 * The skill view (multiple lessons inside one skill) can be expanded later.
 */
export default function SkillPage() {
  const params = useParams<{ courseId: string; skillId: string }>();
  const router = useRouter();

  // For MVP: we ask the API for the course tree and start the first lesson
  // of the skill. A dedicated /api/v1/skills/:id/next endpoint would be cleaner.
  const { data: tree } = useQuery({
    queryKey: ['tree', params.courseId],
    queryFn: () => api.getCourseTree(params.courseId),
  });

  const skill = tree?.flatMap((u) => u.skills).find((s) => s.skillId === params.skillId);

  return (
    <AppShell>
    <div className="card flex flex-col items-center gap-4 text-center">
      <div className="text-5xl">{skill?.icon ?? '⭐'}</div>
      <div className="text-2xl font-extrabold">{skill?.name ?? '技能'}</div>
      <div className="text-sz-ink/60">
        Lv {skill?.userLevel ?? 0} / {skill?.maxLevel ?? 5}
      </div>
      <button
        className="btn-primary mt-4"
        onClick={async () => {
          // Find first lesson via API: we just call the skill's first lesson
          // by fetching a lesson list endpoint. For brevity we use a server
          // helper through course tree level 1 lesson id (resolved below).
          const res = await fetch(
            `${process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000'}/api/v1/skills/${params.skillId}/first-lesson`,
            { credentials: 'omit' },
          );
          const { lessonId } = (await res.json()) as { lessonId: string };
          router.push(`/learn/lessons/${lessonId}`);
        }}
      >
        开始练习 →
      </button>
    </div>
    </AppShell>
  );
}
