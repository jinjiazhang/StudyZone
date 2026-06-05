'use client';

import { RotateCw } from 'lucide-react';
import clsx from 'clsx';
import { Mascot } from '@/components/Mascot';

/**
 * Friendly error state with a retry action. Used when a query fails — pass the
 * query's `refetch` (or a router refresh) as `onRetry`.
 */
export function ErrorState({
  title = '出了点小问题',
  description = '加载失败了，检查下网络再试一次吧。',
  onRetry,
  className,
}: {
  title?: string;
  description?: string;
  onRetry?: () => void;
  className?: string;
}) {
  return (
    <div
      className={clsx(
        'flex flex-col items-center gap-4 rounded-3xl border-2 border-sz-line bg-white px-6 py-10 text-center',
        className,
      )}
    >
      <Mascot size={96} mood="sad" />
      <div className="flex flex-col gap-1">
        <h3 className="text-lg font-heavy text-sz-ink">{title}</h3>
        <p className="max-w-xs font-bold text-sz-ink-soft">{description}</p>
      </div>
      {onRetry && (
        <button onClick={onRetry} className="btn-primary px-6">
          <RotateCw className="h-5 w-5" />
          重试
        </button>
      )}
    </div>
  );
}
