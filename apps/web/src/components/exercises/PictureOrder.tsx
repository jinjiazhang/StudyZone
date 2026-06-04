'use client';

import { useMemo, useState } from 'react';
import clsx from 'clsx';
import { Volume2 } from 'lucide-react';
import type { PictureOrderPrompt } from '@studyzone/shared-types';

export function PictureOrderExercise({
  prompt,
  onSubmit,
  disabled,
}: {
  prompt: PictureOrderPrompt;
  onSubmit: (payload: { orderedIds: string[] }) => void;
  disabled?: boolean;
}) {
  const [picked, setPicked] = useState<number[]>([]);
  const remaining = useMemo(
    () => prompt.items.map((_, index) => index).filter((index) => !picked.includes(index)),
    [picked, prompt.items],
  );

  function playAudio(url?: string) {
    if (!url) return;
    const audio = new Audio(url);
    void audio.play();
  }

  function Card({ index, order }: { index: number; order?: number }) {
    const item = prompt.items[index]!;
    return (
      <button
        disabled={disabled}
        onClick={() =>
          order === undefined
            ? setPicked([...picked, index])
            : setPicked(picked.filter((_, i) => i !== order))
        }
        className={clsx(
          'relative overflow-hidden rounded-2xl border-2 border-b-[4px] bg-white text-left font-heavy text-sz-ink transition-transform duration-100 active:translate-y-[2px] active:border-b-2',
          order !== undefined ? 'border-sz-sky bg-sky-50' : 'border-sz-line hover:bg-sz-mist',
          item.imageUrl ? 'w-32' : 'px-4 py-3',
        )}
      >
        {order !== undefined && (
          <span className="absolute left-1 top-1 z-10 flex h-6 w-6 items-center justify-center rounded-full bg-sz-sky text-xs font-heavy text-white">
            {order + 1}
          </span>
        )}
        {item.imageUrl && (
          <div className="aspect-square bg-sz-mist">
            <img src={item.imageUrl} alt={item.text ?? ''} className="h-full w-full object-cover" />
          </div>
        )}
        {item.text && <div className={clsx(item.imageUrl && 'px-2 py-1.5 text-sm')}>{item.text}</div>}
        {item.audioUrl && (
          <span
            role="button"
            onClick={(e) => {
              e.stopPropagation();
              playAudio(item.audioUrl);
            }}
            className="absolute bottom-1 right-1 flex h-7 w-7 items-center justify-center rounded-full bg-sz-sky text-white"
          >
            <Volume2 className="h-4 w-4" />
          </span>
        )}
      </button>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="text-xs font-heavy uppercase tracking-widest text-sz-ink-soft">排序</div>
      <h2 className="text-2xl font-heavy text-sz-ink md:text-3xl">{prompt.instruction}</h2>

      <div className="flex min-h-[120px] flex-wrap items-start gap-3 rounded-2xl border-2 border-dashed border-sz-line bg-sz-mist p-3">
        {picked.length === 0 && (
          <span className="m-auto text-sm font-heavy text-sz-ink-soft">按正确顺序点击下方卡片</span>
        )}
        {picked.map((itemIndex, order) => (
          <Card key={`${itemIndex}-${order}`} index={itemIndex} order={order} />
        ))}
      </div>

      <div className="flex flex-wrap gap-3">
        {remaining.map((itemIndex) => (
          <Card key={itemIndex} index={itemIndex} />
        ))}
      </div>

      <button
        disabled={picked.length !== prompt.items.length || disabled}
        onClick={() => onSubmit({ orderedIds: picked.map((index) => prompt.items[index]!.id) })}
        className="btn-primary mt-2"
      >
        检 查
      </button>
    </div>
  );
}
