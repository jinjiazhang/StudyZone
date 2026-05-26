'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CheckCircle2, XCircle } from 'lucide-react';

import { api } from '@/lib/api';
import { ExerciseType, type SessionExerciseDto } from '@studyzone/shared-types';
import {
  TranslateChoiceExercise,
  TranslateInputExercise,
  WordBankExercise,
  MatchPairsExercise,
  SingleChoiceExercise,
  NumericInputExercise,
} from '@/components/exercises';

interface AttemptState {
  result: 'correct' | 'wrong';
  canonical?: string;
}

export default function LessonPage() {
  const params = useParams<{ lessonId: string }>();
  const router = useRouter();
  const [cursor, setCursor] = useState(0);
  const [feedback, setFeedback] = useState<AttemptState | null>(null);
  const [startTs] = useState(() => Date.now());

  const { data: session, isLoading } = useQuery({
    queryKey: ['lesson-start', params.lessonId],
    queryFn: () => api.startLesson(params.lessonId),
    refetchOnMount: false,
  });

  const submit = useMutation({
    mutationFn: (args: { exerciseId: string; payload: any; responseMs: number }) =>
      api.submitAttempt(session!.sessionId, args),
  });

  const complete = useMutation({
    mutationFn: () => api.completeSession(session!.sessionId),
  });

  const current: SessionExerciseDto | undefined = session?.exercises[cursor];
  const total = session?.exercises.length ?? 0;
  const progress = total > 0 ? (cursor / total) * 100 : 0;

  async function handleSubmit(payload: any) {
    if (!current || !session) return;
    const responseMs = Date.now() - startTs;
    const res = await submit.mutateAsync({
      exerciseId: current.id,
      payload,
      responseMs,
    });
    setFeedback({
      result: res.correct ? 'correct' : 'wrong',
      canonical: res.canonicalAnswer,
    });
  }

  async function next() {
    setFeedback(null);
    if (cursor + 1 < total) {
      setCursor(cursor + 1);
    } else if (session) {
      const r = await complete.mutateAsync();
      router.push(
        `/learn/lessons/${params.lessonId}/complete?xp=${r.xpGained}&gems=${r.gemsGained}&streak=${r.newStreak}`,
      );
    }
  }

  if (isLoading || !session) return <div className="text-sz-ink/60">载入关卡中…</div>;

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6">
      <header className="flex items-center gap-4">
        <button
          onClick={() => router.back()}
          className="rounded-full p-2 text-sz-ink/40 hover:bg-sz-ink/5 hover:text-sz-ink"
        >
          <X className="h-5 w-5" />
        </button>
        <div className="flex-1">
          <div className="h-3 overflow-hidden rounded-full bg-sz-ink/10">
            <motion.div
              className="h-full bg-sz-green"
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.4 }}
            />
          </div>
        </div>
        <div className="text-sm font-bold text-sz-ink/60">
          {cursor + 1} / {total}
        </div>
      </header>

      {current && (
        <AnimatePresence mode="wait">
          <motion.div
            key={current.id}
            initial={{ x: 30, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -30, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="card"
          >
            <ExerciseSwitch
              exercise={current}
              disabled={!!feedback}
              onSubmit={handleSubmit}
            />
          </motion.div>
        </AnimatePresence>
      )}

      <AnimatePresence>
        {feedback && (
          <motion.div
            initial={{ y: 80 }}
            animate={{ y: 0 }}
            exit={{ y: 80 }}
            className={`-mx-6 flex items-center gap-3 rounded-t-chunky border-t-4 p-6 ${
              feedback.result === 'correct'
                ? 'border-sz-green bg-emerald-50'
                : 'border-sz-rose bg-rose-50'
            }`}
          >
            {feedback.result === 'correct' ? (
              <CheckCircle2 className="h-8 w-8 text-sz-green" />
            ) : (
              <XCircle className="h-8 w-8 text-sz-rose" />
            )}
            <div className="flex-1">
              <div
                className={`text-lg font-extrabold ${
                  feedback.result === 'correct' ? 'text-sz-green' : 'text-sz-rose'
                }`}
              >
                {feedback.result === 'correct' ? '完美!' : '差一点'}
              </div>
              {feedback.canonical && (
                <div className="text-sm text-sz-ink/70">正确答案：{feedback.canonical}</div>
              )}
            </div>
            <button onClick={next} className="btn-primary">
              {cursor + 1 < total ? '继续' : '结算'}
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function ExerciseSwitch({
  exercise,
  disabled,
  onSubmit,
}: {
  exercise: SessionExerciseDto;
  disabled: boolean;
  onSubmit: (payload: any) => void;
}) {
  switch (exercise.type) {
    case ExerciseType.TRANSLATE_CHOICE:
      return (
        <TranslateChoiceExercise
          prompt={exercise.prompt as any}
          onSubmit={onSubmit}
          disabled={disabled}
        />
      );
    case ExerciseType.TRANSLATE_INPUT:
      return (
        <TranslateInputExercise
          prompt={exercise.prompt as any}
          onSubmit={onSubmit}
          disabled={disabled}
        />
      );
    case ExerciseType.WORD_BANK:
      return (
        <WordBankExercise
          prompt={exercise.prompt as any}
          onSubmit={onSubmit}
          disabled={disabled}
        />
      );
    case ExerciseType.MATCH_PAIRS:
      return (
        <MatchPairsExercise
          prompt={exercise.prompt as any}
          onSubmit={onSubmit}
          disabled={disabled}
        />
      );
    case ExerciseType.SINGLE_CHOICE:
      return (
        <SingleChoiceExercise
          prompt={exercise.prompt as any}
          onSubmit={onSubmit}
          disabled={disabled}
        />
      );
    case ExerciseType.NUMERIC_INPUT:
      return (
        <NumericInputExercise
          prompt={exercise.prompt as any}
          onSubmit={onSubmit}
          disabled={disabled}
        />
      );
    default:
      return <div>暂不支持该题型：{exercise.type}</div>;
  }
}
