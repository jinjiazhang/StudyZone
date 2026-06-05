import type { ReactNode } from 'react';
import clsx from 'clsx';
import { Mascot } from '@/components/Mascot';

/**
 * Friendly empty state: mascot + title + hint + optional call to action.
 * Used when a query succeeds but there's nothing to show yet.
 */
export function EmptyState({
  title,
  description,
  action,
  mood = 'happy',
  className,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
  mood?: 'happy' | 'cheer' | 'sad' | 'wink';
  className?: string;
}) {
  return (
    <div
      className={clsx(
        'flex flex-col items-center gap-4 rounded-3xl border-2 border-dashed border-sz-line bg-white px-6 py-10 text-center',
        className,
      )}
    >
      <Mascot size={96} mood={mood} />
      <div className="flex flex-col gap-1">
        <h3 className="text-lg font-heavy text-sz-ink">{title}</h3>
        {description && <p className="max-w-xs font-bold text-sz-ink-soft">{description}</p>}
      </div>
      {action}
    </div>
  );
}
