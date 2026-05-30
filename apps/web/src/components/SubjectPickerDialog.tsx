'use client';

import { useEffect } from 'react';
import Image from 'next/image';
import { X } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { CourseDto, SubjectDto } from '@studyzone/shared-types';
import { api } from '@/lib/api';

interface SubjectPickerDialogProps {
  open: boolean;
  subject: SubjectDto;
  courses: CourseDto[];
  currentCourseId?: string;
  onClose: () => void;
}

export function SubjectPickerDialog({
  open,
  subject,
  courses,
  currentCourseId,
  onClose,
}: SubjectPickerDialogProps) {
  const queryClient = useQueryClient();

  const enroll = useMutation({
    mutationFn: (courseId: string) => api.enrollCourse(courseId),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['enrollments'] }),
        queryClient.invalidateQueries({ queryKey: ['courses'] }),
      ]);
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
        className="w-full max-w-lg rounded-3xl border-2 border-b-[6px] border-sz-line bg-white p-6 shadow-pop"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center gap-3">
          <span
            className="h-4 w-4 rounded-full"
            style={{ backgroundColor: subject.color }}
          />
          <h3 className="flex-1 text-lg font-heavy text-sz-ink">选择 {subject.name} 课本</h3>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-1 text-sz-ink-soft hover:text-sz-ink"
            aria-label="关闭"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex max-h-[60vh] flex-col gap-3 overflow-y-auto pr-1">
          {courses.map((c) => {
            const isCurrent = c.id === currentCourseId;
            return (
              <button
                key={c.id}
                type="button"
                disabled={enroll.isPending}
                onClick={() => {
                  if (isCurrent) {
                    onClose();
                    return;
                  }
                  enroll.mutate(c.id);
                }}
                className={`group flex items-center gap-4 rounded-2xl border-2 border-b-[4px] p-3 text-left transition-transform duration-100 hover:-translate-y-0.5 active:translate-y-[2px] active:border-b-2 disabled:cursor-not-allowed disabled:opacity-60 ${
                  isCurrent ? 'border-sz-green bg-sz-mist' : 'border-sz-line bg-white'
                }`}
              >
                <div
                  className="flex h-24 w-20 shrink-0 items-center justify-center overflow-hidden rounded-xl border-2 border-sz-line bg-white"
                  style={{ borderColor: subject.color }}
                >
                  <Image
                    src={c.coverImageUrl}
                    alt={`${c.name}封面`}
                    width={80}
                    height={96}
                    className="h-full w-full object-contain"
                  />
                </div>
                <div className="flex-1">
                  <div className="text-base font-heavy text-sz-ink">{c.name}</div>
                  <div className="mt-1 text-xs font-bold text-sz-ink-soft line-clamp-2">
                    {c.description}
                  </div>
                  {isCurrent && (
                    <div className="mt-2 inline-flex rounded-full bg-sz-green px-2 py-0.5 text-[10px] font-heavy uppercase tracking-wider text-white">
                      正在学习
                    </div>
                  )}
                </div>
              </button>
            );
          })}
          {courses.length === 0 && (
            <div className="rounded-2xl border-2 border-dashed border-sz-line p-6 text-center text-sm font-bold text-sz-ink-soft">
              该学科暂无课本。
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
