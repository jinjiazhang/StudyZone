'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Flame, Gem, Heart, BookOpen, Trophy, User, Users, Sparkles } from 'lucide-react';
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
        <div className="mx-auto flex max-w-[84rem] items-center justify-between px-6 py-3 md:justify-end md:px-8">
          <Link href="/learn" className="flex items-center gap-2 md:hidden">
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

      <div className="mx-auto grid max-w-[84rem] gap-10 px-4 py-6 md:grid-cols-[260px,1fr] md:px-8 md:py-8">
        {/* left rail (desktop) */}
        <nav className="hidden border-r-2 border-sz-line pr-5 md:block">
          <div className="sticky top-24 flex flex-col gap-7">
            <Link href="/learn" className="flex items-center gap-3 px-4">
              <Mascot size={42} />
              <span className="text-[1.65rem] font-heavy leading-none text-sz-green">
                StudyZone
              </span>
            </Link>
            <ul className="flex flex-col gap-3">
              <NavLink href="/learn" current={pathname} icon={<BookOpen className="h-8 w-8" />} label="学习" tint="green" />
              <NavLink href="/league" current={pathname} icon={<Trophy className="h-8 w-8" />} label="联赛" tint="gold" />
              <NavLink href="/friends" current={pathname} icon={<Users className="h-8 w-8" />} label="好友" tint="rose" />
              <NavLink href="/profile" current={pathname} icon={<User className="h-8 w-8" />} label="我" tint="sky" />
            </ul>
          </div>
        </nav>
        <main className="min-h-[60vh] pb-24 md:pb-0 md:text-[1.03rem]">{children}</main>
      </div>

      {/* bottom tabs (mobile) */}
      <nav className="fixed inset-x-0 bottom-0 z-30 border-t-2 border-sz-line bg-white md:hidden">
        <ul className="mx-auto grid max-w-md grid-cols-4 px-2 py-2">
          <BottomTab href="/learn" current={pathname} icon={<BookOpen className="h-6 w-6" />} label="学习" />
          <BottomTab href="/league" current={pathname} icon={<Trophy className="h-6 w-6" />} label="联赛" />
          <BottomTab href="/friends" current={pathname} icon={<Users className="h-6 w-6" />} label="好友" />
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
  tint: 'green' | 'gold' | 'sky' | 'rose';
}) {
  const active = current === href || (href !== '/' && current?.startsWith(href));
  const activeStyles = {
    green: 'bg-sz-green-soft text-sz-green-dark border-sz-green',
    gold: 'bg-yellow-50 text-sz-gold-dark border-sz-gold',
    sky: 'bg-sky-50 text-sz-sky-dark border-sz-sky',
    rose: 'bg-rose-50 text-sz-rose-dark border-sz-rose',
  }[tint];
  return (
    <li>
      <Link
        href={href}
        className={clsx(
          'flex h-[68px] items-center gap-4 rounded-[1.25rem] border-2 px-5 text-xl font-heavy transition',
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
