'use client';

import type { ReactNode } from 'react';
import clsx from 'clsx';

export function TopStatsBar({
  leading,
  streak,
  gems,
  hearts,
  loading,
}: {
  leading?: ReactNode;
  streak: number;
  gems: number;
  hearts: number;
  loading?: boolean;
}) {
  return (
    <div className="sticky top-0 z-20 -mx-4 flex items-center justify-around border-b-2 border-sz-line bg-white px-4 py-2.5 md:mx-0 md:rounded-b-2xl md:px-6">
      <div className="flex flex-1 items-center justify-center">{leading}</div>
      <Stat src="/assets/icons/streak.svg" cls="h-8 w-[27px]" tint="text-sz-orange" value={streak} loading={loading} />
      <Stat src="/assets/icons/diamond.svg" cls="h-8 w-[26px]" tint="text-sz-sky" value={gems} loading={loading} />
      <Stat src="/assets/icons/heart.svg" cls="h-[34px] w-[34px]" tint="text-sz-rose" value={hearts} loading={loading} />
    </div>
  );
}

function Stat({
  src,
  cls,
  tint,
  value,
  loading,
}: {
  src: string;
  cls: string;
  tint: string;
  value: number;
  loading?: boolean;
}) {
  return (
    <div className="flex flex-1 items-center justify-center gap-1.5">
      <img src={src} alt="" draggable={false} className={cls} />
      <span className={clsx('font-display text-lg font-heavy', tint, loading && 'opacity-0')}>
        {loading ? '00' : value}
      </span>
    </div>
  );
}
