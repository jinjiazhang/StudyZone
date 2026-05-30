'use client';

import { useEffect, useRef, useState } from 'react';
import clsx from 'clsx';
import { RotateCcw, Eye } from 'lucide-react';
import type { PinyinToWordPrompt } from '@studyzone/shared-types';

/**
 * 看拼音写字 — show a sentence with a blank + the missing character's pinyin;
 * the learner hand-writes the target character on a square canvas. Each stroke
 * is graded by HanziWriter against the canonical stroke order/shape.
 *
 * Interaction:
 *   - The target character is loaded silently into HanziWriter quiz mode.
 *   - User draws stroke-by-stroke; wrong strokes don't ink in and increment `mistakes`.
 *   - HanziWriter's auto-flash hint is disabled; instead a manual "显示轮廓" button
 *     only appears once the learner misses the same stroke 3 times in a row.
 *   - When the character is fully complete the component auto-submits AND keeps
 *     the canonical outline on-screen so the learner can compare their strokes
 *     against the target.
 *   - "重写" resets the quiz.
 *
 * HanziWriter is loaded dynamically (it touches `window`) so SSR stays happy.
 */

/**
 * Surface the "显示轮廓" button once the learner misses the SAME stroke this
 * many times in a row. Aligned with HanziWriter's classic default.
 */
const HINT_BUTTON_REVEAL_THRESHOLD = 3;

// Minimal subset of the HanziWriter API we touch. The real package ships richer
// types but we keep this local to avoid pulling them into shared-types.
type HanziWriterInstance = {
  quiz: (opts: {
    onMistake?: (data: { strokeNum: number; totalMistakes: number }) => void;
    onCorrectStroke?: (data: { strokeNum: number }) => void;
    onComplete?: (data: { character: string; totalMistakes: number }) => void;
    showHintAfterMisses?: number;
    leniency?: number;
  }) => void;
  cancelQuiz: () => void;
  showOutline: () => void;
  hideOutline: () => void;
  showCharacter: () => void;
  hideCharacter: () => void;
};

type HanziWriterModule = {
  create: (
    element: HTMLElement | string,
    character: string,
    options?: Record<string, unknown>,
  ) => HanziWriterInstance;
};

const DEFAULT_BLANK_PLACEHOLDER = '__';

export function PinyinToWordExercise({
  prompt,
  onSubmit,
  disabled,
}: {
  prompt: PinyinToWordPrompt;
  onSubmit: (payload: {
    character: string;
    mistakes: number;
    completed: boolean;
  }) => void;
  disabled?: boolean;
}) {
  const targetRef = useRef<HTMLDivElement | null>(null);
  const writerRef = useRef<HanziWriterInstance | null>(null);
  const submittedRef = useRef(false);
  /**
   * Number of times the learner has missed the CURRENT stroke in a row.
   * Resets to 0 every time they get a stroke right or when the quiz resets.
   * Kept in a ref because we only need it inside the HanziWriter callbacks —
   * its value never drives rendering directly (the sticky `hintButtonRevealed`
   * state handles that).
   */
  const consecutiveMistakesRef = useRef(0);
  /**
   * Pin `onSubmit` behind a ref so its identity (the parent re-creates the
   * callback on every render) does NOT become a boot-effect dependency.
   * Without this, every parent re-render (e.g. the feedback drawer animating
   * in) would tear down the HanziWriter and wipe the learner's strokes.
   */
  const onSubmitRef = useRef(onSubmit);
  useEffect(() => {
    onSubmitRef.current = onSubmit;
  }, [onSubmit]);

  const [mistakes, setMistakes] = useState(0);
  const [strokesDone, setStrokesDone] = useState(0);
  const [completed, setCompleted] = useState(false);
  const [showingOutline, setShowingOutline] = useState(false);
  /**
   * Sticky flag — once the hint button has been revealed (either by hitting
   * the consecutive-mistake threshold or by completing the character), it
   * stays visible for the rest of this attempt. We don't yank it away the
   * moment a learner finally gets a stroke right.
   */
  const [hintButtonRevealed, setHintButtonRevealed] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [resetTick, setResetTick] = useState(0);

  const allowedMistakes = prompt.allowedMistakes ?? 3;
  const leniency = prompt.leniency ?? 1.0;
  const placeholder = prompt.blankPlaceholder || DEFAULT_BLANK_PLACEHOLDER;

  // Render the sentence with the blank visually highlighted.
  const [before, after] = splitOnce(prompt.sentence, placeholder);

  // Boot up HanziWriter + the quiz. Re-runs on character change or reset.
  useEffect(() => {
    let cancelled = false;
    submittedRef.current = false;

    async function boot() {
      const host = targetRef.current;
      if (!host) return;
      host.innerHTML = ''; // clear any previous SVG (HanziWriter renders inline)

      try {
        const mod = (await import('hanzi-writer')) as unknown as {
          default: HanziWriterModule;
        };
        if (cancelled) return;

        const writer = mod.default.create(host, prompt.character, {
          width: 280,
          height: 280,
          padding: 8,
          showCharacter: false,
          showOutline: false,
          strokeColor: '#1f2937',
          outlineColor: '#d1d5db',
          highlightColor: '#f43f5e', // wrong-stroke flash
          drawingWidth: 28,
          strokeAnimationSpeed: 1.0,
        });
        writerRef.current = writer;
        consecutiveMistakesRef.current = 0;
        setShowingOutline(false);
        setMistakes(0);
        setStrokesDone(0);
        setHintButtonRevealed(false);
        setCompleted(false);

        writer.quiz({
          // Disable HanziWriter's built-in auto-flash hint. We surface a manual
          // "显示轮廓" button instead so the learner is in control of when to
          // peek at the answer.
          showHintAfterMisses: Number.POSITIVE_INFINITY,
          leniency,
          onMistake: ({ totalMistakes }) => {
            setMistakes(totalMistakes);
            consecutiveMistakesRef.current += 1;
            if (consecutiveMistakesRef.current >= HINT_BUTTON_REVEAL_THRESHOLD) {
              setHintButtonRevealed(true);
            }
          },
          onCorrectStroke: ({ strokeNum }) => {
            setStrokesDone(strokeNum + 1);
            // A correct stroke breaks the "stuck on this stroke" streak.
            consecutiveMistakesRef.current = 0;
          },
          onComplete: ({ totalMistakes }) => {
            setCompleted(true);
            setMistakes(totalMistakes);
            // Reveal the canonical outline so the learner can compare their
            // own strokes against the target shape — and keep the toggle
            // button available afterwards in case they want to hide it.
            try {
              writer.showOutline();
              setShowingOutline(true);
              setHintButtonRevealed(true);
            } catch {
              /* writer may have been torn down */
            }
            if (submittedRef.current) return;
            submittedRef.current = true;
            onSubmitRef.current({
              character: prompt.character,
              mistakes: totalMistakes,
              completed: true,
            });
          },
        });
      } catch (err) {
        console.error('[PinyinToWord] failed to load hanzi-writer', err);
        if (!cancelled) {
          setLoadError(
            '汉字数据加载失败，请检查网络（hanzi-writer 默认从 jsDelivr CDN 拉取笔顺数据）。',
          );
        }
      }
    }

    void boot();
    return () => {
      cancelled = true;
      try {
        writerRef.current?.cancelQuiz();
      } catch {
        /* writer may already be torn down */
      }
      writerRef.current = null;
    };
    // onSubmit intentionally excluded — read via onSubmitRef so parent
    // re-renders don't trigger a full HanziWriter rebuild.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prompt.character, leniency, resetTick]);

  // When the parent flips `disabled` to true the feedback drawer is up — i.e.
  // the attempt has been graded. If the learner skipped without finishing, we
  // need to reveal the canonical character so they see what they were aiming
  // for. Important: when `completed` is true we must NOT touch the writer —
  // calling `cancelQuiz()` here would wipe their drawn strokes from the SVG,
  // and the outline shown by onComplete is already the right visual.
  useEffect(() => {
    if (!disabled) return;
    if (completed) return;
    const writer = writerRef.current;
    if (!writer) return;
    try {
      writer.cancelQuiz();
      writer.showCharacter();
    } catch {
      /* writer may have been torn down */
    }
  }, [disabled, completed]);

  function handleReset() {
    if (disabled) return;
    setResetTick((t) => t + 1);
  }

  function handleToggleHint() {
    if (disabled || !writerRef.current) return;
    if (showingOutline) {
      writerRef.current.hideOutline();
      setShowingOutline(false);
    } else {
      writerRef.current.showOutline();
      setShowingOutline(true);
    }
  }

  const overBudget = mistakes > allowedMistakes;

  return (
    <div className="flex flex-col gap-6">
      <div className="text-xs font-heavy uppercase tracking-widest text-sz-ink-soft">
        看拼音写字
      </div>

      {/* Sentence with highlighted blank */}
      <div className="rounded-2xl border-2 border-sz-line bg-sz-mist px-5 py-4 text-2xl leading-relaxed text-sz-ink md:text-3xl">
        <span>{before}</span>
        <span
          className={clsx(
            'mx-1 inline-flex min-w-[2.2em] flex-col items-center rounded-lg border-2 border-dashed px-2 py-0.5 align-middle',
            completed
              ? 'border-sz-green bg-sz-green-soft text-sz-green-dark'
              : 'border-sz-sky bg-white text-sz-sky-dark',
          )}
        >
          <span className="font-heavy">{completed ? prompt.character : '？'}</span>
          <span className="text-sm font-heavy tracking-wider md:text-base">
            {prompt.pinyin}
          </span>
        </span>
        <span>{after}</span>
      </div>

      {/* Drawing canvas + 田字格 grid */}
      <div className="flex flex-col items-center gap-3">
        <div className="relative h-[280px] w-[280px] rounded-2xl border-2 border-sz-line bg-white">
          {/* 田字格 cross hairs — purely decorative */}
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute left-1/2 top-0 h-full w-px -translate-x-1/2 bg-sz-line/60" />
            <div className="absolute left-0 top-1/2 h-px w-full -translate-y-1/2 bg-sz-line/60" />
            <div className="absolute inset-2 border border-dashed border-sz-line/50" />
          </div>
          <div
            ref={targetRef}
            className="absolute inset-0 flex items-center justify-center"
          />
          {loadError && (
            <div className="absolute inset-0 flex items-center justify-center bg-white/95 p-4 text-center text-sm font-heavy text-sz-rose-dark">
              {loadError}
            </div>
          )}
        </div>

        {/* Status row */}
        <div className="flex items-center gap-4 text-sm font-heavy">
          <span
            className={clsx(
              overBudget ? 'text-sz-rose-dark' : 'text-sz-ink-soft',
            )}
          >
            错笔：{mistakes} / {allowedMistakes}
          </span>
          <span className="text-sz-ink-soft">已写：{strokesDone} 笔</span>
        </div>

        {/* Toolbar — "显示轮廓" stays hidden until the learner has missed the
            same stroke 3 times in a row (or has completed the character). */}
        <div className="flex gap-2">
          <button
            type="button"
            onClick={handleReset}
            disabled={disabled}
            className="btn-secondary flex items-center gap-1.5 px-4 py-2 text-sm"
          >
            <RotateCcw className="h-4 w-4" />
            重 写
          </button>
          {hintButtonRevealed && (
            <button
              type="button"
              onClick={handleToggleHint}
              disabled={disabled || !!loadError}
              className={clsx(
                'flex items-center gap-1.5 px-4 py-2 text-sm',
                showingOutline ? 'btn-primary' : 'btn-secondary',
              )}
            >
              <Eye className="h-4 w-4" />
              {showingOutline ? '隐藏轮廓' : '显示轮廓'}
            </button>
          )}
        </div>
      </div>

      {/* If they're stuck, let them skip-submit so the lesson can advance.
          The judge will mark it wrong, costing a heart — same as any other題. */}
      {!completed && (
        <button
          type="button"
          disabled={disabled}
          onClick={() => {
            if (submittedRef.current) return;
            submittedRef.current = true;
            onSubmitRef.current({
              character: prompt.character,
              mistakes: Math.max(mistakes, allowedMistakes + 1),
              completed: false,
            });
          }}
          className="btn-secondary mt-2"
        >
          写不出来，跳过
        </button>
      )}
    </div>
  );
}

/**
 * Split a string on the first occurrence of `needle`. If the placeholder is
 * missing, fall back to appending the blank at the end so users still see a
 * marker rather than nothing.
 */
function splitOnce(haystack: string, needle: string): [string, string] {
  const idx = haystack.indexOf(needle);
  if (idx === -1) return [haystack, ''];
  return [haystack.slice(0, idx), haystack.slice(idx + needle.length)];
}
