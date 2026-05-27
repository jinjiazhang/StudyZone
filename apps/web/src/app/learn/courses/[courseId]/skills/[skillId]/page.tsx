'use client';

import { useQuery } from '@tanstack/react-query';
import { useParams, useRouter } from 'next/navigation';
import { Star } from 'lucide-react';
import { api } from '@/lib/api';
import { AppShell } from '@/components/AppShell';
import { Mascot, SpeechBubble } from '@/components/Mascot';

export default function SkillPage() {
  const params = useParams<{ courseId: string; skillId: string }>();
  const router = useRouter();

  const { data: tree } = useQuery({
    queryKey: ['tree', params.courseId],
    queryFn: () => api.getCourseTree(params.courseId),
  });

  const skill = tree?.flatMap((u) => u.skills).find((s) => s.skillId === params.skillId);
  const level = skill?.userLevel ?? 0;
  const max = skill?.maxLevel ?? 5;

  return (
    <AppShell>
      <div className="mx-auto flex max-w-md flex-col items-center gap-6 text-center">
        <div className="flex h-32 w-32 items-center justify-center rounded-full border-4 border-sz-green bg-white text-6xl shadow-node">
          {skill?.icon ?? '⭐'}
        </div>
        <div>
          <div className="text-3xl font-heavy text-sz-ink">{skill?.name ?? '技能'}</div>
          <div className="mt-1 text-sm font-heavy uppercase tracking-wider text-sz-ink-soft">
            等级 {level} / {max}
          </div>
        </div>

        <div className="flex items-center gap-1">
          {Array.from({ length: max }).map((_, i) => (
            <Star
              key={i}
              className={`h-7 w-7 ${i < level ? 'fill-sz-gold text-sz-gold-dark' : 'fill-sz-line text-sz-line'}`}
            />
          ))}
        </div>

        <div className="flex items-end gap-3">
          <Mascot size={72} />
          <SpeechBubble>每练一次升一级，到顶级会冒小金星 ⭐</SpeechBubble>
        </div>

        <button
          className="btn-primary w-full px-8 py-4 text-lg"
          onClick={async () => {
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
        <button
          onClick={() => router.back()}
          className="btn-secondary w-full"
        >
          返回地图
        </button>
      </div>
    </AppShell>
  );
}
