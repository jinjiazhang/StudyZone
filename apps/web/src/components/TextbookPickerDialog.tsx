'use client';

import { useEffect } from 'react';
import Image from 'next/image';
import { BookOpen, X } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { CourseDto, SubjectDto } from '@studyzone/shared-types';
import { api } from '@/lib/api';

interface TextbookPickerDialogProps {
  open: boolean;
  courses: CourseDto[];
  subjects: SubjectDto[];
  enrolledCourseIds: Set<string>;
  onClose: () => void;
}

export function TextbookPickerDialog({
  open,
  courses,
  subjects,
  enrolledCourseIds,
  onClose,
}: TextbookPickerDialogProps) {
  const queryClient = useQueryClient();
  const availableCourses = courses.filter((course) => !enrolledCourseIds.has(course.id));

  const enroll = useMutation({
    mutationFn: (courseId: string) => api.enrollCourse(courseId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['enrollments'] });
      onClose();
    },
  });

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
      onClick={onClose}
    >
      <div
        className="flex w-full max-w-lg flex-col rounded-3xl border-2 border-b-[6px] border-sz-line bg-white shadow-pop"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b-2 border-sz-line p-5">
          <h3 className="text-lg font-heavy text-sz-ink">添加课本</h3>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-1 text-sz-ink-soft hover:text-sz-ink"
            aria-label="关闭"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex max-h-[64vh] flex-col gap-6 overflow-y-auto p-5">
          {subjects.map((subject) => {
            const subjectCourses = availableCourses.filter(
              (course) => course.subjectId === subject.id,
            );
            if (subjectCourses.length === 0) return null;

            return (
              <div key={subject.id} className="flex flex-col gap-2.5">
                <div className="flex items-center gap-2">
                  <span
                    className="h-3 w-3 rounded-full"
                    style={{ backgroundColor: subject.color }}
                  />
                  <h4 className="text-base font-heavy text-sz-ink">{subject.name}</h4>
                </div>
                {subjectCourses.map((course) => (
                  <button
                    key={course.id}
                    type="button"
                    disabled={enroll.isPending}
                    onClick={() => enroll.mutate(course.id)}
                    className="flex items-center gap-3 rounded-2xl border-2 border-sz-line bg-white p-2.5 text-left transition-transform duration-100 hover:-translate-y-0.5 active:translate-y-[1px] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <div
                      className="flex h-[88px] w-[66px] shrink-0 items-center justify-center overflow-hidden rounded-lg border bg-white"
                      style={{ borderColor: subject.color, backgroundColor: `${subject.color}1A` }}
                    >
                      {course.coverImageUrl ? (
                        <Image
                          src={course.coverImageUrl}
                          alt={`${course.name}封面`}
                          width={66}
                          height={88}
                          className="h-full w-full object-contain"
                        />
                      ) : (
                        <BookOpen className="h-7 w-7" style={{ color: subject.color }} />
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="font-heavy text-sz-ink line-clamp-2">{course.name}</div>
                      <div className="mt-1 text-xs font-bold text-sz-ink-soft line-clamp-2">
                        {course.description}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            );
          })}

          {availableCourses.length === 0 && (
            <div className="flex flex-col items-center gap-2 rounded-3xl border-2 border-dashed border-sz-line p-8 text-center">
              <BookOpen className="h-10 w-10 text-sz-green" />
              <div className="text-base font-heavy text-sz-ink">全部课本都在书架上了</div>
              <div className="text-sm font-bold text-sz-ink-soft">
                之后有新课本时，可以继续从这里添加。
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
