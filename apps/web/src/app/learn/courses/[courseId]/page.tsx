'use client';

import { useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import clsx from 'clsx';
import { CheckCircle2, Lock, PlayCircle, Trophy } from 'lucide-react';
import { api } from '@/lib/api';
import { AppShell } from '@/components/AppShell';

export default function CoursePage() {
  const params = useParams<{ courseId: string }>();
  const courseId = params.courseId;

  const enroll = useMutation({ mutationFn: () => api.enrollCourse(courseId) });
  useEffect(() => {
    enroll.mutate();
  }, [courseId]);

  const { data: tree, isLoading } = useQuery({
    queryKey: ['tree', courseId],
    queryFn: () => api.getCourseTree(courseId),
  });

  if (isLoading) {
    return <AppShell><div className="font-bold text-sz-ink-soft">加载课程地图中…</div></AppShell>;
  }
  if (!tree) {
    return <AppShell><div className="card font-heavy">课程未找到</div></AppShell>;
  }

  return (
    <AppShell>
      <div className="mx-auto flex max-w-3xl flex-col gap-12">
        {tree.map((unit, unitIdx) => (
          <section key={unit.unitId}>
            <header
              className="relative overflow-hidden rounded-3xl border-b-[6px] border-black/15 p-5 text-white"
              style={{ background: unit.themeColor }}
            >
              <div className="flex items-center justify-between gap-4">
                <div className="flex-1">
                  <div className="text-xs font-heavy uppercase tracking-widest opacity-80">第 {unit.unitOrder + 1} 单元</div>
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

            <ol className="mt-8 flex flex-col items-center gap-8">
              {unit.lessons.map((lesson, idx) => {
                const offsets = [-1, 1, 2, 1, -1, -2];
                const offset = offsets[idx % offsets.length] ?? 0;
                return (
                  <LessonNode
                    key={lesson.lessonId}
                    courseId={courseId}
                    lesson={lesson}
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

function LessonNode({
  courseId,
  lesson,
  offset,
  themeColor,
}: {
  courseId: string;
  lesson: {
    lessonId: string;
    name: string;
    icon: string;
    unlocked: boolean;
    completed: boolean;
  };
  offset: number;
  themeColor: string;
}) {
  const isNext = lesson.unlocked && !lesson.completed;

  return (
    <li className="flex flex-col items-center gap-2" style={{ transform: `translateX(${offset * 36}px)` }}>
      <Link
        href={lesson.unlocked ? `/learn/lessons/${lesson.lessonId}` : '#'}
        aria-disabled={!lesson.unlocked}
        className={clsx('lesson-node', !lesson.unlocked && 'pointer-events-none', isNext && 'animate-pulseGlow')}
        style={{
          background: lesson.unlocked ? (lesson.completed ? '#FFC800' : 'white') : '#E5E5E5',
          color: lesson.unlocked ? '#3C3C3C' : '#bbbbbb',
          borderColor: themeColor,
        }}
      >
        {!lesson.unlocked && <Lock className="h-7 w-7" />}
        {lesson.unlocked && !lesson.completed && <span className="text-3xl">{lesson.icon || '📘'}</span>}
        {lesson.completed && <CheckCircle2 className="h-8 w-8 text-white" />}
        {isNext && (
          <span className="absolute -top-7 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-xl bg-sz-green px-3 py-1 text-xs font-heavy uppercase tracking-wider text-white shadow-pop">
            <PlayCircle className="mr-1 inline h-3.5 w-3.5" /> 开始
          </span>
        )}
      </Link>
      <div className="text-center">
        <div className="font-heavy text-sz-ink">{lesson.name}</div>
        <div className="mt-1 text-xs font-bold text-sz-ink-soft">
          {lesson.completed ? '已完成' : lesson.unlocked ? '待开始' : '未解锁'}
        </div>
      </div>
    </li>
  );
}
