'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect } from 'react';
import clsx from 'clsx';

import { useAuthStore } from '@/lib/auth-store';
import { Mascot } from './Mascot';

export function AppShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const accessToken = useAuthStore((s) => s.accessToken);

  useEffect(() => {
    if (!accessToken) router.replace('/login');
  }, [accessToken, router]);

  if (!accessToken) return null;

  return (
    <div className="min-h-screen bg-white">
      <div className="mx-auto grid max-w-[84rem] gap-10 px-4 py-6 md:grid-cols-[260px,1fr] md:px-8 md:py-8">
        {/* left rail (desktop) */}
        <nav className="hidden border-r-2 border-sz-line pr-5 md:block">
          <div className="sticky top-8 flex flex-col gap-7">
            <Link href="/learn" className="flex items-center gap-3 px-4">
              <Mascot size={42} />
              <span className="font-display text-[1.65rem] font-heavy leading-none text-sz-green">
                StudyZone
              </span>
            </Link>
            <ul className="flex flex-col gap-3">
              <NavLink href="/learn" current={pathname} icon="tab-learn" label="学习" />
              <NavLink href="/league" current={pathname} icon="tab-league" label="联赛" />
              <NavLink href="/friends" current={pathname} icon="tab-friends" label="好友" />
              <NavLink href="/profile" current={pathname} icon="tab-profile" label="档案" />
            </ul>
          </div>
        </nav>
        <main className="min-h-[60vh] pb-24 md:pb-0 md:text-[1.03rem]">{children}</main>
      </div>

      {/* bottom tabs (mobile) */}
      <nav className="fixed inset-x-0 bottom-0 z-30 border-t-2 border-sz-line bg-white md:hidden">
        <ul className="mx-auto grid max-w-md grid-cols-4 px-2 py-2">
          <BottomTab href="/learn" current={pathname} icon="tab-learn" label="学习" />
          <BottomTab href="/league" current={pathname} icon="tab-league" label="联赛" />
          <BottomTab href="/friends" current={pathname} icon="tab-friends" label="好友" />
          <BottomTab href="/profile" current={pathname} icon="tab-profile" label="档案" />
        </ul>
      </nav>
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
  icon: string;
  label: string;
}) {
  const active = current === href || (href !== '/' && current?.startsWith(href));
  return (
    <li>
      <Link
        href={href}
        className={clsx(
          'flex h-[68px] items-center gap-4 rounded-[1.25rem] px-4 text-xl font-heavy transition',
          active ? 'bg-[#F0FAFF] text-sz-ink' : 'text-sz-ink-soft hover:bg-sz-mist',
        )}
      >
        <span
          className={clsx(
            'flex h-[54px] w-[58px] shrink-0 items-center justify-center rounded-2xl border-[3px]',
            active ? 'border-[#84D8F7] bg-[#F0FAFF]' : 'border-transparent',
          )}
        >
          <img src={`/assets/icons/${icon}.svg`} alt="" draggable={false} className="h-10 w-10" />
        </span>
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
  icon: string;
  label: string;
}) {
  const active = current === href || (href !== '/' && current?.startsWith(href));
  return (
    <li>
      <Link
        href={href}
        className={clsx(
          'flex flex-col items-center justify-center gap-0.5 py-1 text-[11px] font-heavy uppercase tracking-wide',
          active ? 'text-sz-ink' : 'text-sz-ink-soft',
        )}
      >
        <span
          className={clsx(
            'flex h-[46px] w-[52px] items-center justify-center rounded-xl border-[3px]',
            active ? 'border-[#84D8F7] bg-[#F0FAFF]' : 'border-transparent',
          )}
        >
          <img src={`/assets/icons/${icon}.svg`} alt="" draggable={false} className="h-8 w-8" />
        </span>
        <span>{label}</span>
      </Link>
    </li>
  );
}
