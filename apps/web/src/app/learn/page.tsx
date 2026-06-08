'use client';

import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { BookOpen, Plus, Search, X } from 'lucide-react';
import type { CourseDto, EnrollmentDto, SubjectDto } from '@studyzone/shared-types';
import { api } from '@/lib/api';
import { AppShell } from '@/components/AppShell';
import { TopStatsBar } from '@/components/TopStatsBar';
import { TextbookPickerDialog } from '@/components/TextbookPickerDialog';
import { Skeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';

interface ShelfBook {
  course: CourseDto;
  enrollment: EnrollmentDto;
  subject: SubjectDto;
}

export default function LearnPage() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const meQuery = useQuery({ queryKey: ['me'], queryFn: () => api.me() });
  const subjectsQuery = useQuery({ queryKey: ['subjects'], queryFn: () => api.listSubjects() });
  const coursesQuery = useQuery({ queryKey: ['courses'], queryFn: () => api.listCourses() });
  const enrollmentsQuery = useQuery({
    queryKey: ['enrollments'],
    queryFn: () => api.listMyEnrollments(),
  });

  const me = meQuery.data;

  const subjects = subjectsQuery.data ?? [];
  const courses = coursesQuery.data ?? [];
  const enrollments = enrollmentsQuery.data ?? [];

  const [pickerOpen, setPickerOpen] = useState(false);
  const [search, setSearch] = useState('');

  const isLoading = subjectsQuery.isLoading || coursesQuery.isLoading || enrollmentsQuery.isLoading;
  const isError = subjectsQuery.isError || coursesQuery.isError || enrollmentsQuery.isError;
  const retry = () => {
    subjectsQuery.refetch();
    coursesQuery.refetch();
    enrollmentsQuery.refetch();
  };

  const shelfBooks = useMemo(
    () => buildShelfBooks(enrollments, courses, subjects),
    [courses, enrollments, subjects],
  );
  const normalizedSearch = search.trim().toLocaleLowerCase();
  const filteredBooks = useMemo(
    () =>
      normalizedSearch
        ? shelfBooks.filter(({ course, subject }) =>
            `${course.name} ${subject.name}`.toLocaleLowerCase().includes(normalizedSearch),
          )
        : shelfBooks,
    [normalizedSearch, shelfBooks],
  );
  const enrolledCourseIds = useMemo(
    () => new Set(enrollments.map((enrollment) => enrollment.courseId)),
    [enrollments],
  );

  const unenroll = useMutation({
    mutationFn: (courseId: string) => api.unenrollCourse(courseId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['enrollments'] }),
  });

  const confirmRemove = (book: ShelfBook) => {
    if (window.confirm(`确定将《${book.course.name}》从书架移除吗？学习进度会保留。`)) {
      unenroll.mutate(book.course.id);
    }
  };

  return (
    <AppShell>
      <div className="flex flex-col gap-6">
        <TopStatsBar
          leading={
            <img src="/assets/icons/quests.svg" alt="" draggable={false} className="h-[42px] w-[42px]" />
          }
          streak={me?.currentStreak ?? 0}
          gems={me?.gems ?? 0}
          hearts={me?.hearts ?? 0}
          loading={meQuery.isLoading}
        />

        {/* search */}
        <div className="flex items-center gap-2 rounded-full bg-sz-mist px-4 py-2.5">
          <Search className="h-5 w-5 text-sz-ink-soft" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="搜索课本或学科"
            className="flex-1 bg-transparent text-[15px] font-bold text-sz-ink outline-none placeholder:text-sz-ink-soft"
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch('')}
              className="text-sz-ink-soft hover:text-sz-ink"
              aria-label="清除搜索"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {isLoading ? (
          <ShelfSkeleton />
        ) : isError ? (
          <ErrorState onRetry={retry} />
        ) : shelfBooks.length === 0 ? (
          <EmptyState
            title="书架还是空的"
            description="把正在学习的课本添加到书架，之后可以随时继续。"
            action={
              <button
                type="button"
                onClick={() => setPickerOpen(true)}
                className="inline-flex items-center gap-1.5 rounded-2xl border-b-4 border-sz-green-dark bg-sz-green px-5 py-2.5 font-heavy text-white transition-transform duration-100 active:translate-y-[2px] active:border-b-2"
              >
                <Plus className="h-4 w-4 stroke-[3]" /> 添加课本
              </button>
            }
          />
        ) : (
          <>
            {filteredBooks.length === 0 && (
              <div className="flex flex-col items-center gap-1.5 py-6 text-center">
                <Search className="h-9 w-9 text-sz-ink-soft" />
                <div className="text-lg font-heavy text-sz-ink">没有找到相关课本</div>
                <div className="text-sm font-bold text-sz-ink-soft">
                  试试课本名称或“语文、数学、英语”。
                </div>
              </div>
            )}
            <div className="grid grid-cols-2 gap-x-4 gap-y-7 sm:grid-cols-3 lg:grid-cols-4">
              {filteredBooks.map((book) => (
                <ShelfCard
                  key={book.course.id}
                  book={book}
                  disabled={unenroll.isPending}
                  onOpen={() => router.push(`/learn/courses/${book.course.id}`)}
                  onRemove={() => confirmRemove(book)}
                />
              ))}
              <AddCard onClick={() => setPickerOpen(true)} />
            </div>
          </>
        )}
      </div>

      <TextbookPickerDialog
        open={pickerOpen}
        courses={courses}
        subjects={subjects}
        enrolledCourseIds={enrolledCourseIds}
        onClose={() => setPickerOpen(false)}
      />
    </AppShell>
  );
}

function buildShelfBooks(
  enrollments: EnrollmentDto[],
  courses: CourseDto[],
  subjects: SubjectDto[],
): ShelfBook[] {
  const courseById = new Map(courses.map((course) => [course.id, course]));
  const subjectById = new Map(subjects.map((subject) => [subject.id, subject]));

  return [...enrollments]
    .sort((a, b) => b.lastActiveAt.localeCompare(a.lastActiveAt))
    .flatMap((enrollment) => {
      const course = courseById.get(enrollment.courseId);
      const subject = subjectById.get(enrollment.subjectId);
      return course && subject ? [{ course, enrollment, subject }] : [];
    });
}

function ShelfCard({
  book,
  disabled,
  onOpen,
  onRemove,
}: {
  book: ShelfBook;
  disabled: boolean;
  onOpen: () => void;
  onRemove: () => void;
}) {
  return (
    <div className="group relative">
      <button
        type="button"
        disabled={disabled}
        onClick={onOpen}
        className="block w-full text-left transition-transform duration-100 hover:-translate-y-0.5 active:translate-y-[2px] disabled:opacity-60"
      >
        <div
          className="flex aspect-[0.76] items-center justify-center overflow-hidden rounded-xl border border-sz-line bg-white shadow-pop"
          style={{ backgroundColor: `${book.subject.color}1A` }}
        >
          {book.course.coverImageUrl ? (
            <Image
              src={book.course.coverImageUrl}
              alt={`${book.course.name}封面`}
              width={160}
              height={210}
              className="h-full w-full bg-white object-contain"
            />
          ) : (
            <div className="flex flex-col items-center gap-2.5 p-4">
              <BookOpen className="h-10 w-10" style={{ color: book.subject.color }} />
              <span className="font-heavy text-lg" style={{ color: book.subject.color }}>
                {book.subject.name}
              </span>
            </div>
          )}
        </div>
        <div className="mt-2 min-h-[38px] font-heavy text-[15px] leading-tight text-sz-ink line-clamp-2">
          {book.course.name}
        </div>
      </button>
      <button
        type="button"
        disabled={disabled}
        onClick={onRemove}
        aria-label="移除课本"
        className="absolute right-1.5 top-1.5 flex h-7 w-7 items-center justify-center rounded-full border-2 border-sz-line bg-white text-sz-ink-soft opacity-0 shadow-pop transition hover:text-sz-rose-dark group-hover:opacity-100"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}

function AddCard({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex aspect-[0.76] flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed border-sz-line bg-white text-sz-ink-soft transition-transform duration-100 hover:-translate-y-0.5 active:translate-y-[2px]"
    >
      <span className="flex h-16 w-16 items-center justify-center rounded-full border-2 border-sz-line">
        <Plus className="h-8 w-8 stroke-[2.5] text-sz-ink-soft" />
      </span>
      <span className="font-heavy text-sm">添加课本</span>
    </button>
  );
}

function ShelfSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-x-4 gap-y-7 sm:grid-cols-3 lg:grid-cols-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i}>
          <Skeleton className="aspect-[0.76] w-full rounded-xl" />
          <Skeleton className="mt-2 h-4 w-[88%]" />
          <Skeleton className="mt-1.5 h-3 w-[40%]" />
        </div>
      ))}
    </div>
  );
}
