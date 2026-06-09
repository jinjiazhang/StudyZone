'use client';

import { useEffect, useRef } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import clsx from 'clsx';
import { BookOpen, Check, Lock, PlayCircle, Star } from 'lucide-react';
import type { UnitMapDecorationDto } from '@studyzone/shared-types';
import { api } from '@/lib/api';
import { AppShell } from '@/components/AppShell';
import { TopStatsBar } from '@/components/TopStatsBar';
import { MapDecoration } from '@/components/MapDecoration';
import { Skeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';

export default function CoursePage() {
  const params = useParams<{ courseId: string }>();
  const courseId = params.courseId;

  const enroll = useMutation({ mutationFn: () => api.enrollCourse(courseId) });
  useEffect(() => {
    enroll.mutate();
  }, [courseId]);

  const meQuery = useQuery({ queryKey: ['me'], queryFn: () => api.me() });
  const me = meQuery.data;

  const treeQuery = useQuery({
    queryKey: ['tree', courseId],
    queryFn: () => api.getCourseTree(courseId),
  });
  const tree = treeQuery.data;

  // Reopen the course at the unit the user was last studying. Falls back to the
  // first unit that still has an incomplete lesson.
  const enrollmentsQuery = useQuery({
    queryKey: ['enrollments'],
    queryFn: () => api.listMyEnrollments(),
  });
  const currentUnitId =
    enrollmentsQuery.data?.find((e) => e.courseId === courseId)?.currentUnitId ?? null;

  const sectionRefs = useRef<Map<string, HTMLElement>>(new Map());
  const hasScrolledRef = useRef(false);
  useEffect(() => {
    if (hasScrolledRef.current) return;
    if (!tree || tree.length === 0 || enrollmentsQuery.isLoading) return;
    const targetUnitId =
      (currentUnitId && tree.some((u) => u.unitId === currentUnitId) ? currentUnitId : null) ??
      tree.find((u) => u.lessons.some((l) => !l.completed))?.unitId ??
      tree[0]?.unitId;
    const el = targetUnitId ? sectionRefs.current.get(targetUnitId) : null;
    if (el) {
      el.scrollIntoView({ block: 'start' });
      hasScrolledRef.current = true;
    }
  }, [tree, currentUnitId, enrollmentsQuery.isLoading]);

  if (treeQuery.isLoading) {
    return (
      <AppShell>
        <CourseMapSkeleton />
      </AppShell>
    );
  }
  if (treeQuery.isError) {
    return (
      <AppShell>
        <ErrorState onRetry={() => treeQuery.refetch()} />
      </AppShell>
    );
  }
  if (!tree || tree.length === 0) {
    return (
      <AppShell>
        <EmptyState title="课程还没有内容" description="这门课的关卡正在制作中，敬请期待。" />
      </AppShell>
    );
  }

  return (
    <AppShell>
      <TopStatsBar
        leading={
          <Link href="/learn" aria-label="返回学习主页">
            <img
              src="/assets/icons/tab-learn.svg"
              alt=""
              draggable={false}
              className="h-[34px] w-[34px]"
            />
          </Link>
        }
        streak={me?.currentStreak ?? 0}
        gems={me?.gems ?? 0}
        hearts={me?.hearts ?? 0}
        loading={meQuery.isLoading}
      />
      <div className="mx-auto mt-6 flex max-w-3xl flex-col gap-12">
        {tree.map((unit, unitIdx) => {
          return (
            <section
              key={unit.unitId}
              ref={(el) => {
                if (el) sectionRefs.current.set(unit.unitId, el);
                else sectionRefs.current.delete(unit.unitId);
              }}
            >
              <div className="sticky top-14 z-10 -mx-1 bg-white px-1 pb-3 pt-2">
              <header
                className="relative overflow-hidden rounded-3xl border-b-[6px] border-black/15 p-5 text-white"
                style={{ background: unit.themeColor }}
              >
                <div className="flex-1">
                  <div className="text-xs font-heavy uppercase tracking-widest opacity-80">
                    第 {unit.unitOrder + 1} 单元
                  </div>
                  <div className="mt-1 text-2xl font-heavy">{unit.unitTitle}</div>
                </div>
                <div className="pointer-events-none absolute -bottom-8 -right-8 text-9xl opacity-20">
                  {['🌱', '🌳', '🌟', '🚀', '🏔️'][unitIdx % 5]}
                </div>
              </header>
              </div>

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
      className="flex flex-col items-center"
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

function CourseMapSkeleton() {
  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-12">
      {Array.from({ length: 2 }).map((_, u) => (
        <section key={u}>
          <Skeleton className="h-24 w-full rounded-3xl" />
          <div className="mt-8 flex flex-col items-center gap-6">
            {Array.from({ length: 4 }).map((_, n) => (
              <Skeleton
                key={n}
                className="h-16 w-16 rounded-full"
                /* zig-zag like the real lesson nodes */
              />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
