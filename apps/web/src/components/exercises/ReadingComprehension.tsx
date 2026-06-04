'use client';

import { useRef, useState } from 'react';
import clsx from 'clsx';
import { Volume2 } from 'lucide-react';
import type { ReadingComprehensionPrompt } from '@studyzone/shared-types';

export function ReadingComprehensionExercise({
  prompt,
  onSubmit,
  disabled,
}: {
  prompt: ReadingComprehensionPrompt;
  onSubmit: (payload: { correctIndices: number[] }) => void;
  disabled?: boolean;
}) {
  const [picks, setPicks] = useState<(number | null)[]>(() => prompt.questions.map(() => null));
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const allAnswered = picks.every((p) => p !== null);

  function setPick(qIdx: number, optIdx: number) {
    setPicks((prev) => prev.map((p, i) => (i === qIdx ? optIdx : p)));
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="text-xs font-heavy uppercase tracking-widest text-sz-ink-soft">阅读理解</div>
      {prompt.title && <h2 className="text-2xl font-heavy text-sz-ink md:text-3xl">{prompt.title}</h2>}

      {prompt.imageUrl && (
        <div className="overflow-hidden rounded-2xl border-2 border-sz-line bg-sz-mist">
          <img src={prompt.imageUrl} alt="" className="max-h-64 w-full object-contain" />
        </div>
      )}

      <div className="rounded-2xl border-2 border-sz-line bg-white p-5">
        {prompt.audioUrl && (
          <div className="mb-3">
            <button
              type="button"
              onClick={() => {
                if (audioRef.current) {
                  audioRef.current.currentTime = 0;
                  audioRef.current.play();
                }
              }}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-sz-sky text-white shadow-pop-sky"
            >
              <Volume2 className="h-5 w-5" />
            </button>
            <audio ref={audioRef} src={prompt.audioUrl} preload="auto" className="hidden" />
          </div>
        )}
        {prompt.passage.split('\n').map((para, i) => (
          <p key={i} className="mb-2 text-lg leading-relaxed text-sz-ink last:mb-0">
            {para}
          </p>
        ))}
      </div>

      <div className="flex flex-col gap-6">
        {prompt.questions.map((q, qIdx) => (
          <div key={qIdx} className="flex flex-col gap-3">
            <div className="font-heavy text-sz-ink">
              {qIdx + 1}. {q.question}
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              {q.options.map((opt, optIdx) => (
                <button
                  key={optIdx}
                  disabled={disabled}
                  onClick={() => setPick(qIdx, optIdx)}
                  className={clsx('option-tile flex items-center gap-3', picks[qIdx] === optIdx && 'option-tile-active')}
                >
                  <span
                    className={clsx(
                      'flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border-2 text-sm font-heavy',
                      picks[qIdx] === optIdx
                        ? 'border-sz-sky bg-white text-sz-sky-dark'
                        : 'border-sz-line bg-white text-sz-ink-soft',
                    )}
                  >
                    {String.fromCharCode(65 + optIdx)}
                  </span>
                  <span className="flex-1 text-left">{opt}</span>
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      <button
        disabled={!allAnswered || disabled}
        onClick={() => allAnswered && onSubmit({ correctIndices: picks as number[] })}
        className="btn-primary mt-2"
      >
        检 查
      </button>
    </div>
  );
}
