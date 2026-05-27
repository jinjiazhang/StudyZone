'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Flame, Gem, Heart, BookOpen, Trophy, User, Sparkles } from 'lucide-react';
import clsx from 'clsx';

import { api } from '@/lib/api';
import { useAuthStore } from '@/lib/auth-store';
import { Mascot } from './Mascot';

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
    <div className="min-h-screen bg-white">
      {/* top bar */}
      <header className="sticky top-0 z-30 border-b-2 border-sz-line bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3">
          <Link href="/learn" className="flex items-center gap-2">
            <Mascot size={36} />
            <span className="hidden text-2xl font-heavy text-sz-green sm:inline">
              StudyZone
            </span>
          </Link>
          <div className="flex items-center gap-2 sm:gap-3">
            <Stat icon={<Flame className="h-5 w-5 text-sz-orange" />} value={me?.currentStreak ?? 0} tint="orange" />
            <Stat icon={<Gem className="h-5 w-5 text-sz-sky" />} value={me?.gems ?? 0} tint="sky" />
            <Stat icon={<Heart className="h-5 w-5 text-sz-rose" />} value={me?.hearts ?? 0} tint="rose" />
            <Stat icon={<Sparkles className="h-5 w-5 text-sz-gold" />} value={me?.xpTotal ?? 0} tint="gold" hideOnMobile />
          </div>
        </div>
      </header>

      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-6 md:grid-cols-[220px,1fr] md:px-6 md:py-8">
        {/* left rail (desktop) */}
        <nav className="hidden md:block">
          <ul className="sticky top-24 flex flex-col gap-2 text-base">
            <NavLink href="/learn" current={pathname} icon={<BookOpen className="h-6 w-6" />} label="学习" tint="green" />
            <NavLink href="/league" current={pathname} icon={<Trophy className="h-6 w-6" />} label="联赛" tint="gold" />
            <NavLink href="/profile" current={pathname} icon={<User className="h-6 w-6" />} label="我" tint="sky" />
          </ul>
        </nav>
        <main className="min-h-[60vh] pb-24 md:pb-0">{children}</main>
      </div>

      {/* bottom tabs (mobile) */}
      <nav className="fixed inset-x-0 bottom-0 z-30 border-t-2 border-sz-line bg-white md:hidden">
        <ul className="mx-auto grid max-w-md grid-cols-3 px-2 py-2">
          <BottomTab href="/learn" current={pathname} icon={<BookOpen className="h-6 w-6" />} label="学习" />
          <BottomTab href="/league" current={pathname} icon={<Trophy className="h-6 w-6" />} label="联赛" />
          <BottomTab href="/profile" current={pathname} icon={<User className="h-6 w-6" />} label="我" />
        </ul>
      </nav>
    </div>
  );
}

function Stat({
  icon,
  value,
  tint,
  hideOnMobile,
}: {
  icon: React.ReactNode;
  value: number;
  tint: 'orange' | 'sky' | 'rose' | 'gold';
  hideOnMobile?: boolean;
}) {
  const color = {
    orange: 'text-sz-orange-dark',
    sky: 'text-sz-sky-dark',
    rose: 'text-sz-rose-dark',
    gold: 'text-sz-gold-dark',
  }[tint];
  return (
    <div
      className={clsx(
        'flex items-center gap-1.5 rounded-full border-2 border-sz-line bg-white px-3 py-1 text-sm font-heavy',
        color,
        hideOnMobile && 'hidden sm:flex',
      )}
    >
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
  tint,
}: {
  href: string;
  current: string | null;
  icon: React.ReactNode;
  label: string;
  tint: 'green' | 'gold' | 'sky';
}) {
  const active = current === href || (href !== '/' && current?.startsWith(href));
  const activeStyles = {
    green: 'bg-sz-green-soft text-sz-green-dark border-sz-green',
    gold: 'bg-yellow-50 text-sz-gold-dark border-sz-gold',
    sky: 'bg-sky-50 text-sz-sky-dark border-sz-sky',
  }[tint];
  return (
    <li>
      <Link
        href={href}
        className={clsx(
          'flex items-center gap-3 rounded-2xl border-2 px-4 py-3 font-heavy uppercase tracking-wide transition',
          active ? activeStyles : 'border-transparent text-sz-ink-soft hover:bg-sz-mist',
        )}
      >
        {icon}
        <span>{label}</span>
      </Link>
    </li>
  );
}

function BottomTab({
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
          'flex flex-col items-center justify-center gap-0.5 rounded-xl py-1.5 text-[11px] font-heavy uppercase tracking-wide',
          active ? 'bg-sz-green-soft text-sz-green-dark' : 'text-sz-ink-soft',
        )}
      >
        {icon}
        <span>{label}</span>
      </Link>
    </li>
  );
}
