'use client';

import { useMemo, useState } from 'react';
import clsx from 'clsx';
import type { PinyinToCharacterAssemblePrompt } from '@studyzone/shared-types';

/**
 * 看拼音拼字 — 学生拖拽部件到结构槽位组成目标汉字。
 *
 * 交互：
 * - 候选区的部件可拖拽（HTML5 native drag）。
 * - 槽位是 drop target；填入后可点击清除（部件回到候选池）。
 * - 同一部件不能同时在两个槽里，已使用的候选会变灰但仍可见（便于学生纠错）。
 */
export function PinyinToCharacterAssembleExercise({
  prompt,
  onSubmit,
  disabled,
}: {
  prompt: PinyinToCharacterAssemblePrompt;
  onSubmit: (payload: { slotFills: Record<string, string> }) => void;
  disabled?: boolean;
}) {
  const [slotFills, setSlotFills] = useState<Record<string, string>>({});
  const [draggingFrom, setDraggingFrom] = useState<
    { kind: 'pool'; component: string } | { kind: 'slot'; slotId: string } | null
  >(null);
  const [dragOverSlot, setDragOverSlot] = useState<string | null>(null);

  const usedComponents = useMemo(() => new Set(Object.values(slotFills)), [slotFills]);

  const allFilled = prompt.slots.every((s) => slotFills[s.id]);

  function handleSlotDrop(slotId: string) {
    if (disabled || !draggingFrom) return;
    setSlotFills((prev) => {
      const next = { ...prev };
      if (draggingFrom.kind === 'pool') {
        // If another slot already holds this component, vacate it
        // (slots are unique per component to avoid duplicates).
        for (const sid of Object.keys(next)) {
          if (next[sid] === draggingFrom.component) delete next[sid];
        }
        next[slotId] = draggingFrom.component;
      } else if (draggingFrom.kind === 'slot' && draggingFrom.slotId !== slotId) {
        // Swap between slots.
        const moving = next[draggingFrom.slotId];
        const existing = next[slotId];
        if (moving) next[slotId] = moving;
        delete next[draggingFrom.slotId];
        if (existing) next[draggingFrom.slotId] = existing;
      }
      return next;
    });
    setDraggingFrom(null);
    setDragOverSlot(null);
  }

  function clearSlot(slotId: string) {
    if (disabled) return;
    setSlotFills((prev) => {
      const { [slotId]: _, ...rest } = prev;
      return rest;
    });
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="text-xs font-heavy uppercase tracking-widest text-sz-ink-soft">
        看拼音拼字
      </div>

      {/* Pinyin + hint */}
      <div className="flex flex-col items-center gap-2 py-2">
        <span className="text-5xl font-heavy tracking-wider text-sz-sky-dark md:text-6xl">
          {prompt.pinyin}
        </span>
        {prompt.hint ? (
          <span className="text-sm text-sz-ink-soft md:text-base">{prompt.hint}</span>
        ) : null}
      </div>

      {/* Structure template */}
      <div className="flex justify-center py-2">
        <div
          className={clsx(
            'flex gap-0 rounded-2xl border-4 border-dashed border-sz-line bg-sz-mist p-3',
            prompt.structure === 'vertical' ? 'flex-col' : 'flex-row',
          )}
        >
          {prompt.slots.map((slot) => {
            const filled = slotFills[slot.id];
            const isOver = dragOverSlot === slot.id;
            return (
              <button
                key={slot.id}
                type="button"
                disabled={disabled}
                onClick={() => filled && clearSlot(slot.id)}
                draggable={!!filled && !disabled}
                onDragStart={(e) => {
                  if (!filled || disabled) return;
                  setDraggingFrom({ kind: 'slot', slotId: slot.id });
                  e.dataTransfer.effectAllowed = 'move';
                }}
                onDragEnd={() => {
                  setDraggingFrom(null);
                  setDragOverSlot(null);
                }}
                onDragOver={(e) => {
                  if (disabled) return;
                  e.preventDefault();
                  setDragOverSlot(slot.id);
                }}
                onDragLeave={() => setDragOverSlot(null)}
                onDrop={(e) => {
                  e.preventDefault();
                  handleSlotDrop(slot.id);
                }}
                className={clsx(
                  'flex items-center justify-center transition-all',
                  'h-24 w-24 md:h-28 md:w-28',
                  prompt.structure === 'vertical'
                    ? 'border-b-2 border-dashed border-sz-line last:border-b-0'
                    : 'border-r-2 border-dashed border-sz-line last:border-r-0',
                  isOver && 'scale-105 bg-sz-sky/10',
                  filled
                    ? 'cursor-grab text-5xl font-heavy text-sz-ink md:text-6xl'
                    : 'text-3xl font-heavy text-sz-ink-soft/40',
                )}
                aria-label={slot.label ?? slot.id}
              >
                {filled ?? '？'}
              </button>
            );
          })}
        </div>
      </div>

      {/* Reveal preview when fully assembled */}
      {allFilled && (
        <div className="text-center text-sm font-heavy uppercase tracking-widest text-sz-ink-soft">
          你拼出的字：
          <span className="ml-2 text-2xl text-sz-ink">
            {prompt.slots.map((s) => slotFills[s.id]).join('')}
          </span>
        </div>
      )}

      {/* Candidates pool */}
      <div className="flex flex-wrap justify-center gap-3">
        {prompt.candidates.map((component) => {
          const used = usedComponents.has(component);
          return (
            <div
              key={component}
              draggable={!used && !disabled}
              onDragStart={(e) => {
                if (used || disabled) return;
                setDraggingFrom({ kind: 'pool', component });
                e.dataTransfer.effectAllowed = 'move';
              }}
              onDragEnd={() => {
                setDraggingFrom(null);
                setDragOverSlot(null);
              }}
              onClick={() => {
                if (used || disabled) return;
                // Click-to-place fallback for users not drag-friendly:
                // fill the first empty slot.
                const empty = prompt.slots.find((s) => !slotFills[s.id]);
                if (empty) {
                  setSlotFills((prev) => ({ ...prev, [empty.id]: component }));
                }
              }}
              className={clsx(
                'select-none text-4xl font-heavy md:text-5xl',
                'flex h-16 w-16 items-center justify-center rounded-xl border-2 border-b-4 transition-all',
                used
                  ? 'cursor-not-allowed border-sz-line bg-sz-mist text-sz-ink-soft/40'
                  : 'cursor-grab border-sz-line bg-white text-sz-ink hover:-translate-y-0.5 hover:border-sz-sky active:cursor-grabbing',
              )}
            >
              {component}
            </div>
          );
        })}
      </div>

      <button
        disabled={!allFilled || disabled}
        onClick={() => allFilled && onSubmit({ slotFills })}
        className="btn-primary mt-2"
      >
        检 查
      </button>
    </div>
  );
}
