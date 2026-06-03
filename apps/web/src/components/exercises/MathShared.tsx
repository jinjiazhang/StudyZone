'use client';

import type { ReactNode } from 'react';
import clsx from 'clsx';

export type ExerciseProps<TPrompt, TPayload> = {
  prompt: TPrompt;
  onSubmit: (payload: TPayload) => void;
  disabled?: boolean;
};

export function MathShell({ label, title, children }: { label: string; title: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-6">
      <div className="text-xs font-heavy uppercase tracking-widest text-sz-ink-soft">{label}</div>
      <h2 className="text-2xl font-heavy text-sz-ink md:text-3xl">{title}</h2>
      {children}
    </div>
  );
}

export function CheckButton({ disabled, onClick }: { disabled?: boolean; onClick: () => void }) {
  return (
    <button disabled={disabled} onClick={onClick} className="btn-primary mt-2">
      检 查
    </button>
  );
}

export function TokenAnswerBank({ placeholder, children }: { placeholder: string; children: ReactNode }) {
  const empty = Array.isArray(children) ? children.length === 0 : !children;
  return (
    <div className="min-h-[88px] rounded-2xl border-b-2 border-dashed border-sz-line bg-sz-mist p-3">
      <div className="flex flex-wrap gap-2">
        {empty && <div className="px-2 py-2 text-sm font-heavy uppercase tracking-wider text-sz-ink-soft">{placeholder}</div>}
        {children}
      </div>
    </div>
  );
}

export function TokenButton({
  children,
  disabled,
  picked,
  onClick,
}: {
  children: ReactNode;
  disabled?: boolean;
  picked?: boolean;
  onClick: () => void;
}) {
  return (
    <button disabled={disabled} onClick={onClick} className={clsx('token-chip', picked && 'token-chip-picked')}>
      {children}
    </button>
  );
}

export function NumberField({
  label,
  value,
  onChange,
  disabled,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}) {
  return (
    <label className="flex flex-col gap-2 text-sm font-heavy text-sz-ink-soft">
      {label}
      <input
        value={value}
        onChange={(event) => onChange(event.target.value.replace(/[^0-9.\-]/g, ''))}
        disabled={disabled}
        inputMode="decimal"
        className="input text-center text-2xl"
      />
    </label>
  );
}

export function ClockFace({ hour, minute }: { hour: number; minute: number }) {
  const minuteAngle = minute * 6;
  const hourAngle = (hour % 12) * 30 + minute * 0.5;
  return (
    <div className="mx-auto grid h-44 w-44 place-items-center rounded-full border-4 border-sz-line bg-white">
      <div className="relative h-36 w-36 rounded-full">
        <div
          className="absolute left-1/2 top-1/2 h-14 w-1 origin-bottom -translate-x-1/2 -translate-y-full rounded-full bg-sz-ink"
          style={{ transform: `translate(-50%, -100%) rotate(${hourAngle}deg)` }}
        />
        <div
          className="absolute left-1/2 top-1/2 h-16 w-0.5 origin-bottom -translate-x-1/2 -translate-y-full rounded-full bg-sz-sky-dark"
          style={{ transform: `translate(-50%, -100%) rotate(${minuteAngle}deg)` }}
        />
        <div className="absolute left-1/2 top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-sz-green" />
      </div>
    </div>
  );
}

export function updateAt(
  setValues: (values: string[]) => void,
  values: string[],
  index: number,
  nextValue: string,
) {
  const next = [...values];
  next[index] = nextValue;
  setValues(next);
}

export function parseJsonOrText(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}
