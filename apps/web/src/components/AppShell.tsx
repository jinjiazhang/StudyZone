'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Flame, Gem, Heart, BookOpen, Trophy, User } from 'lucide-react';
import clsx from 'clsx';

import { api } from '@/lib/api';
import { useAuthStore } from '@/lib/auth-store';

export function AppShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const accessToken = useAuthStore((s) => s.accessToken);

  useEffect(() => {
    if (!accessToken) router.replace('/login');
  }, [accessToken, router]);

  const { data: me } = useQuery({
    queryKey: ['me'],
    queryFn: () => api.me(),
    enabled: !!accessToken,
  });

  if (!accessToken) return null;

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-10 border-b border-sz-ink/5 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <Link href="/learn" className="flex items-center gap-2">
            <span className="text-2xl">🦊</span>
            <span className="text-xl font-extrabold text-sz-green">StudyZone</span>
          </Link>
          <div className="flex items-center gap-5 text-sm font-bold">
            <Stat icon={<Flame className="h-5 w-5 text-orange-500" />} value={me?.currentStreak ?? 0} />
            <Stat icon={<Gem className="h-5 w-5 text-sky-500" />} value={me?.gems ?? 0} />
            <Stat icon={<Heart className="h-5 w-5 text-rose-500" />} value={me?.hearts ?? 0} />
          </div>
        </div>
      </header>

      <div className="mx-auto grid max-w-5xl gap-8 px-6 py-8 md:grid-cols-[200px,1fr]">
        <nav className="hidden md:block">
          <ul className="flex flex-col gap-1 text-sm font-bold">
            <NavLink href="/learn" current={pathname} icon={<BookOpen className="h-4 w-4" />} label="学习" />
            <NavLink href="/league" current={pathname} icon={<Trophy className="h-4 w-4" />} label="联赛" />
            <NavLink href="/profile" current={pathname} icon={<User className="h-4 w-4" />} label="我" />
          </ul>
        </nav>
        <main className="min-h-[60vh]">{children}</main>
      </div>
    </div>
  );
}

function Stat({ icon, value }: { icon: React.ReactNode; value: number }) {
  return (
    <div className="flex items-center gap-1.5">
      {icon}
      <span>{value}</span>
    </div>
  );
}

function NavLink({
  href,
  current,
  icon,
  label,
}: {
  href: string;
  current: string | null;
  icon: React.ReactNode;
  label: string;
}) {
  const active = current === href || (href !== '/' && current?.startsWith(href));
  return (
    <li>
      <Link
        href={href}
        className={clsx(
          'flex items-center gap-2 rounded-chunky px-3 py-2 transition',
          active ? 'bg-sz-green/10 text-sz-green' : 'text-sz-ink/70 hover:bg-white',
        )}
      >
        {icon}
        {label}
      </Link>
    </li>
  );
}
