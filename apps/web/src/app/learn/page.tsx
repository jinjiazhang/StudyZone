'use client';

import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import clsx from 'clsx';
import { api } from '@/lib/api';
import { AppShell } from '@/components/AppShell';

export default function LearnPage() {
  const { data: subjects } = useQuery({ queryKey: ['subjects'], queryFn: () => api.listSubjects() });
  const { data: courses } = useQuery({ queryKey: ['courses'], queryFn: () => api.listCourses() });

  return (
    <AppShell>
      <div className="flex flex-col gap-8">
      <section>
        <h1 className="text-2xl font-extrabold text-sz-ink">选一门课开始学习</h1>
        <p className="mt-1 text-sm text-sz-ink/60">同时学多门完全没问题，进度互不影响。</p>
      </section>

      <div className="grid gap-4 md:grid-cols-2">
        {courses?.map((c) => {
          const subject = subjects?.find((s) => s.id === c.subjectId);
          return (
            <Link
              key={c.id}
              href={`/learn/courses/${c.id}`}
              className="card group flex items-center gap-4 transition hover:-translate-y-0.5 hover:shadow-pop"
            >
              <div
                className={clsx(
                  'flex h-16 w-16 items-center justify-center rounded-chunky text-3xl',
                )}
                style={{ background: subject?.color ?? '#3FB984', color: 'white' }}
              >
                {c.flagEmoji || subject?.icon || '📘'}
              </div>
              <div className="flex-1">
                <div className="text-lg font-extrabold text-sz-ink">{c.name}</div>
                <div className="text-sm text-sz-ink/60">{c.description}</div>
              </div>
              <div className="text-sz-ink/30 transition group-hover:text-sz-green">→</div>
            </Link>
          );
        })}
      </div>
      </div>
    </AppShell>
  );
}
