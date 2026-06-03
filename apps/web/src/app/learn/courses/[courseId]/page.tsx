'use client';

import { useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import clsx from 'clsx';
import { BookOpen, Check, Lock, PlayCircle, Star } from 'lucide-react';
import type { UnitMapDecorationDto } from '@studyzone/shared-types';
import { api } from '@/lib/api';
import { AppShell } from '@/components/AppShell';
import { MapDecoration } from '@/components/MapDecoration';

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
    return (
      <AppShell>
        <div className="font-bold text-sz-ink-soft">加载课程地图中…</div>
      </AppShell>
    );
  }
  if (!tree) {
    return (
      <AppShell>
        <div className="card font-heavy">课程未找到</div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="mx-auto flex max-w-3xl flex-col gap-12">
        {tree.map((unit, unitIdx) => {
          const completedCount = unit.lessons.filter((lesson) => lesson.completed).length;
          const unitLocked = unit.lessons.every((lesson) => !lesson.unlocked);

          return (
            <section key={unit.unitId} className={clsx(unitLocked && 'opacity-70')}>
              <header
                className="relative overflow-hidden rounded-3xl border-b-[6px] border-black/15 p-5 text-white"
                style={{ background: unit.themeColor }}
              >
                <div className="flex-1">
                  <div className="text-xs font-heavy uppercase tracking-widest opacity-80">
                    第 {unit.unitOrder + 1} 单元
                  </div>
                  <div className="mt-1 text-2xl font-heavy">{unit.unitTitle}</div>
                  <div className="mt-2 text-sm font-heavy opacity-90">
                    {completedCount}/{unit.lessons.length} 关完成
                  </div>
                </div>
                <div className="pointer-events-none absolute -bottom-8 -right-8 text-9xl opacity-20">
                  {['🌱', '🌳', '🌟', '🚀', '🏔️'][unitIdx % 5]}
                </div>
              </header>

              <ol className="mt-8 flex flex-col items-center gap-8">
                {unit.lessons.map((lesson, idx) => {
                  const offsets = [-1, 1, 2, 1, -1, -2];
                  const offset = offsets[idx % offsets.length] ?? 0;
                  const decorations = (unit.mapDecorations ?? []).filter(
                    (decoration) => decoration.anchorLessonOrder === lesson.order,
                  );
                  return (
                    <LessonNode
                      key={lesson.lessonId}
                      courseId={courseId}
                      lesson={lesson}
                      offset={offset}
                      themeColor={unit.themeColor}
                      decorations={decorations}
                    />
                  );
                })}
              </ol>
            </section>
          );
        })}
      </div>
    </AppShell>
  );
}

function LessonNode({
  courseId,
  lesson,
  offset,
  themeColor,
  decorations,
}: {
  courseId: string;
  lesson: {
    lessonId: string;
    name: string;
    icon: string;
    order: number;
    unlocked: boolean;
    completed: boolean;
  };
  offset: number;
  themeColor: string;
  decorations: UnitMapDecorationDto[];
}) {
  const isNext = lesson.unlocked && !lesson.completed;
  const isLocked = !lesson.unlocked;
  const visibleDecorations = decorations.filter(
    (decoration) => lesson.unlocked || !decoration.hiddenWhenLocked,
  );

  return (
    <li
      className="flex flex-col items-center gap-3"
      style={{ transform: `translateX(${offset * 38}px)` }}
    >
      <div className="relative h-24 w-24">
        {visibleDecorations.map((decoration) => (
          <LessonDecoration key={decoration.id} decoration={decoration} offset={offset} />
        ))}
        <Link
          href={lesson.unlocked ? `/learn/lessons/${lesson.lessonId}` : '#'}
          aria-disabled={!lesson.unlocked}
          className={clsx(
            'lesson-node-duo',
            isLocked && 'lesson-node-duo-locked pointer-events-none',
            lesson.completed && 'lesson-node-duo-completed',
            isNext && 'lesson-node-duo-current animate-pulseGlow',
          )}
          style={{ ['--unit-color' as string]: themeColor }}
        >
          <span className="lesson-node-duo-shine" />
          {isLocked && <Lock className="relative z-10 h-8 w-8" />}
          {lesson.unlocked && !lesson.completed && !isNext && (
            <BookOpen className="relative z-10 h-9 w-9" />
          )}
          {isNext && <Star className="relative z-10 h-10 w-10 fill-current" />}
          {lesson.completed && <Check className="relative z-10 h-10 w-10 stroke-[4]" />}
          {isNext && (
            <span className="absolute -top-12 left-1/2 z-20 -translate-x-1/2 whitespace-nowrap rounded-2xl border-2 border-sz-line bg-white px-5 py-2 text-xl font-heavy text-sz-sky shadow-pop after:absolute after:left-1/2 after:top-full after:h-4 after:w-4 after:-translate-x-1/2 after:-translate-y-2 after:rotate-45 after:border-b-2 after:border-r-2 after:border-sz-line after:bg-white">
              <PlayCircle className="mr-1 inline h-5 w-5" /> 开始
            </span>
          )}
        </Link>
      </div>
      <div className="text-center">
        <div className="font-heavy text-sz-ink">{lesson.name}</div>
        <div className="mt-1 text-xs font-bold text-sz-ink-soft">
          {lesson.completed ? '已完成' : lesson.unlocked ? '待开始' : '未解锁'}
        </div>
      </div>
    </li>
  );
}

function LessonDecoration({
  decoration,
  offset,
}: {
  decoration: UnitMapDecorationDto;
  offset: number;
}) {
  const side = getDecorationSide(decoration, offset);

  return (
    <div
      data-rive-decoration={decoration.id}
      className={clsx(
        'pointer-events-none absolute top-1/2 z-0 -translate-y-1/2 opacity-95',
        side === 'left' ? 'right-[calc(100%+34px)]' : 'left-[calc(100%+34px)]',
      )}
      style={{
        width: decoration.size ?? 112,
        height: decoration.size ?? 112,
        transform: `translate(${decoration.offsetX ?? 0}px, calc(-50% + ${
          decoration.offsetY ?? 0
        }px))`,
      }}
    >
      <MapDecoration decoration={decoration} />
    </div>
  );
}

function getDecorationSide(
  decoration: UnitMapDecorationDto,
  offset: number,
): UnitMapDecorationDto['side'] {
  if (decoration.side === 'left' && offset <= 0) return 'right';
  if (decoration.side === 'right' && offset >= 2) return 'left';
  return decoration.side;
}
