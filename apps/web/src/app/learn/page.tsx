'use client';

import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import Image from 'next/image';
import { ChevronRight } from 'lucide-react';
import { api } from '@/lib/api';
import { AppShell } from '@/components/AppShell';
import { Mascot, SpeechBubble } from '@/components/Mascot';

export default function LearnPage() {
  const { data: subjects } = useQuery({ queryKey: ['subjects'], queryFn: () => api.listSubjects() });
  const { data: courses } = useQuery({ queryKey: ['courses'], queryFn: () => api.listCourses() });
  const courseGroups = subjects
    ?.map((subject) => ({
      subject,
      courses: courses?.filter((course) => course.subjectId === subject.id) ?? [],
    }))
    .filter((group) => group.courses.length > 0);

  return (
    <AppShell>
      <div className="flex flex-col gap-8">
        <section className="flex items-end gap-4">
          <Mascot size={100} mood="cheer" />
          <div className="flex-1">
            <SpeechBubble>选一门课开始学习吧！同时学多门完全没问题，进度互不影响。</SpeechBubble>
          </div>
        </section>

        <section>
          <h1 className="text-2xl font-heavy text-sz-ink">我的课程</h1>
          <p className="mt-1 text-sm font-bold text-sz-ink-soft">点击进入查看课程地图与今日关卡。</p>
        </section>

        <div className="flex flex-col gap-8">
          {courseGroups?.map(({ subject, courses: subjectCourses }) => (
            <section key={subject.id} className="flex flex-col gap-4">
              <div className="flex items-center gap-3">
                <span
                  className="h-4 w-4 rounded-full"
                  style={{ backgroundColor: subject.color }}
                />
                <h2 className="text-xl font-heavy text-sz-ink">{subject.name}</h2>
                <div className="h-0.5 flex-1 rounded-full bg-sz-line" />
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                {subjectCourses.map((c) => (
                  <Link
                    key={c.id}
                    href={`/learn/courses/${c.id}`}
                    className="group flex items-center gap-5 rounded-3xl border-2 border-b-[6px] border-sz-line bg-white p-5 transition-transform duration-100 hover:-translate-y-0.5 active:translate-y-[2px] active:border-b-2"
                  >
                    <div
                      className="flex h-36 w-28 shrink-0 items-center justify-center overflow-hidden rounded-2xl border-2 border-sz-line bg-white shadow-pop"
                      style={{ borderColor: subject.color }}
                    >
                      <Image
                        src={c.coverImageUrl}
                        alt={`${c.name}封面`}
                        width={112}
                        height={144}
                        className="h-full w-full object-contain"
                      />
                    </div>
                    <div className="flex-1">
                      <div className="text-lg font-heavy text-sz-ink">{c.name}</div>
                      <div className="mt-1 text-sm font-bold text-sz-ink-soft">{c.description}</div>
                      <div className="mt-2 inline-flex rounded-full bg-sz-mist px-2.5 py-0.5 text-[11px] font-heavy uppercase tracking-wider text-sz-ink-soft">
                        {subject.name}
                      </div>
                    </div>
                    <ChevronRight className="h-6 w-6 text-sz-line transition-colors group-hover:text-sz-green" />
                  </Link>
                ))}
              </div>
            </section>
          ))}
          {(!courses || courses.length === 0) && (
            <div className="card text-center font-bold text-sz-ink-soft">还没有课程，过会儿再来看看。</div>
          )}
        </div>
      </div>
    </AppShell>
  );
}
