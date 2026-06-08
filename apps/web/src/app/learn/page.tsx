'use client';

import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import Image from 'next/image';
import { ChevronRight, BookOpen, Repeat } from 'lucide-react';
import { pickCurrentCourseBySubject } from '@studyzone/shared-types';
import type { SubjectDto } from '@studyzone/shared-types';
import { api } from '@/lib/api';
import { AppShell } from '@/components/AppShell';
import { SpeechBubble } from '@/components/Mascot';
import { SubjectPickerDialog } from '@/components/SubjectPickerDialog';
import { Skeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';

export default function LearnPage() {
  const subjectsQuery = useQuery({ queryKey: ['subjects'], queryFn: () => api.listSubjects() });
  const coursesQuery = useQuery({ queryKey: ['courses'], queryFn: () => api.listCourses() });
  const enrollmentsQuery = useQuery({
    queryKey: ['enrollments'],
    queryFn: () => api.listMyEnrollments(),
  });

  const subjects = subjectsQuery.data;
  const courses = coursesQuery.data;
  const enrollments = enrollmentsQuery.data;

  const isLoading = subjectsQuery.isLoading || coursesQuery.isLoading || enrollmentsQuery.isLoading;
  const isError = subjectsQuery.isError || coursesQuery.isError || enrollmentsQuery.isError;
  const retry = () => {
    subjectsQuery.refetch();
    coursesQuery.refetch();
    enrollmentsQuery.refetch();
  };

  const [pickerSubject, setPickerSubject] = useState<SubjectDto | null>(null);

  const currentBySubject = useMemo(
    () => pickCurrentCourseBySubject(enrollments ?? [], courses ?? []),
    [enrollments, courses],
  );

  const subjectGroups = useMemo(() => {
    if (!subjects || !courses) return [];
    return subjects
      .map((subject) => {
        const subjectCourses = courses.filter((c) => c.subjectId === subject.id);
        return {
          subject,
          subjectCourses,
          current: currentBySubject.get(subject.id),
        };
      })
      .filter((g) => g.subjectCourses.length > 0);
  }, [subjects, courses, currentBySubject]);

  return (
    <AppShell>
      <div className="flex flex-col gap-8">
        <section className="flex items-end gap-4">
          <img src="/assets/icons/quests.svg" alt="" draggable={false} className="h-[88px] w-[88px] shrink-0" />
          <div className="flex-1">
            <SpeechBubble>选一门课开始学习吧！同时学多门完全没问题，进度互不影响。</SpeechBubble>
          </div>
        </section>

        <section>
          <h1 className="text-2xl font-heavy text-sz-ink">我的课程</h1>
          <p className="mt-1 text-sm font-bold text-sz-ink-soft">每个学科只显示你正在学的那本，可以随时切换。</p>
        </section>

        {isLoading ? (
          <LearnSkeleton />
        ) : isError ? (
          <ErrorState onRetry={retry} />
        ) : subjectGroups.length === 0 ? (
          <EmptyState
            title="还没有课程"
            description="课程正在路上，过会儿再来看看吧。"
          />
        ) : (
        <div className="flex flex-col gap-8">
          {subjectGroups.map(({ subject, subjectCourses, current }) => (
            <section key={subject.id} className="flex flex-col gap-4">
              <div className="flex items-center gap-3">
                <span
                  className="h-4 w-4 rounded-full"
                  style={{ backgroundColor: subject.color }}
                />
                <h2 className="text-xl font-heavy text-sz-ink">{subject.name}</h2>
                <div className="h-0.5 flex-1 rounded-full bg-sz-line" />
              </div>

              {current ? (
                <div className="relative">
                  <Link
                    href={`/learn/courses/${current.id}`}
                    className="group flex items-center gap-5 rounded-3xl border-2 border-b-[6px] border-sz-line bg-white p-5 transition-transform duration-100 hover:-translate-y-0.5 active:translate-y-[2px] active:border-b-2"
                  >
                    <div
                      className="flex h-36 w-28 shrink-0 items-center justify-center overflow-hidden rounded-2xl border-2 border-sz-line bg-white shadow-pop"
                      style={{ borderColor: subject.color }}
                    >
                      <Image
                        src={current.coverImageUrl}
                        alt={`${current.name}封面`}
                        width={112}
                        height={144}
                        className="h-full w-full object-contain"
                      />
                    </div>
                    <div className="flex-1 pr-20">
                      <div className="text-lg font-heavy text-sz-ink">{current.name}</div>
                      <div className="mt-1 text-sm font-bold text-sz-ink-soft">{current.description}</div>
                      <div className="mt-2 inline-flex rounded-full bg-sz-mist px-2.5 py-0.5 text-[11px] font-heavy uppercase tracking-wider text-sz-ink-soft">
                        正在学习
                      </div>
                    </div>
                    <ChevronRight className="h-6 w-6 text-sz-line transition-colors group-hover:text-sz-green" />
                  </Link>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      setPickerSubject(subject);
                    }}
                    className="absolute right-4 top-4 inline-flex items-center gap-1 rounded-full border-2 border-b-[3px] border-sz-line bg-white px-3 py-1 text-xs font-heavy text-sz-ink-soft transition-transform duration-100 hover:-translate-y-0.5 hover:text-sz-ink active:translate-y-[1px] active:border-b-2"
                  >
                    <Repeat className="h-3.5 w-3.5" />
                    切换
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setPickerSubject(subject)}
                  className="flex items-center gap-5 rounded-3xl border-2 border-b-[6px] border-dashed border-sz-line bg-white p-5 text-left transition-transform duration-100 hover:-translate-y-0.5 active:translate-y-[2px] active:border-b-2"
                >
                  <div
                    className="flex h-36 w-28 shrink-0 items-center justify-center rounded-2xl border-2 border-dashed bg-sz-mist"
                    style={{ borderColor: subject.color }}
                  >
                    <BookOpen className="h-10 w-10 text-sz-ink-soft" />
                  </div>
                  <div className="flex-1">
                    <div className="text-lg font-heavy text-sz-ink">还没选课本</div>
                    <div className="mt-1 text-sm font-bold text-sz-ink-soft">
                      点击选择一本{subject.name}课本开始学习。
                    </div>
                    <div className="mt-3 inline-flex items-center gap-1 rounded-full bg-sz-green px-3 py-1 text-xs font-heavy text-white">
                      <BookOpen className="h-3.5 w-3.5" />
                      选择课本
                    </div>
                  </div>
                </button>
              )}
            </section>
          ))}
        </div>
        )}
      </div>

      {/* picker */}
      {pickerSubject && (
        <SubjectPickerDialog
          open
          subject={pickerSubject}
          courses={(courses ?? []).filter((c) => c.subjectId === pickerSubject.id)}
          currentCourseId={currentBySubject.get(pickerSubject.id)?.id}
          onClose={() => setPickerSubject(null)}
        />
      )}
    </AppShell>
  );
}

function LearnSkeleton() {
  return (
    <div className="flex flex-col gap-8">
      {Array.from({ length: 2 }).map((_, i) => (
        <section key={i} className="flex flex-col gap-4">
          <div className="flex items-center gap-3">
            <Skeleton className="h-4 w-4 rounded-full" />
            <Skeleton className="h-5 w-24" />
            <div className="h-0.5 flex-1 rounded-full bg-sz-line" />
          </div>
          <div className="flex items-center gap-5 rounded-3xl border-2 border-b-[6px] border-sz-line bg-white p-5">
            <Skeleton className="h-36 w-28 shrink-0 rounded-2xl" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-5 w-40" />
              <Skeleton className="h-4 w-56" />
              <Skeleton className="h-5 w-20 rounded-full" />
            </div>
          </div>
        </section>
      ))}
    </div>
  );
}
