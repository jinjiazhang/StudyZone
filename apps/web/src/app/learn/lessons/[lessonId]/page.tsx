'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CheckCircle2, XCircle, Heart } from 'lucide-react';

import { api } from '@/lib/api';
import { ExerciseType, type SessionExerciseDto } from '@studyzone/shared-types';
import {
  TranslateChoiceExercise,
  TranslateInputExercise,
  WordBankExercise,
  MatchPairsExercise,
  SingleChoiceExercise,
  NumericInputExercise,
  ListenInputExercise,
  ImageChoiceExercise,
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
  const [hearts, setHearts] = useState<number>(5);
  const [startTs] = useState(() => Date.now());

  const { data: me } = useQuery({ queryKey: ['me'], queryFn: () => api.me() });
  useEffect(() => {
    if (typeof me?.hearts === 'number') setHearts(me.hearts);
  }, [me?.hearts]);

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
    if (!res.correct) setHearts((h: number) => Math.max(0, h - 1));
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

  if (isLoading || !session)
    return (
      <main className="flex min-h-screen items-center justify-center text-base font-heavy text-sz-ink-soft">
        载入关卡中…
      </main>
    );

  return (
    <main className="flex min-h-screen flex-col bg-white">
      {/* Top bar: close, progress, hearts */}
      <header className="sticky top-0 z-20 border-b-2 border-sz-line bg-white">
        <div className="mx-auto flex max-w-3xl items-center gap-4 px-4 py-3 md:px-6">
          <button
            onClick={() => router.back()}
            className="rounded-full p-2 text-sz-ink-soft transition hover:bg-sz-mist hover:text-sz-ink"
            aria-label="退出关卡"
          >
            <X className="h-6 w-6" />
          </button>
          <div className="flex-1">
            <div className="progress">
              <motion.div
                className="progress-fill"
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.4 }}
              />
            </div>
          </div>
          <div className="flex items-center gap-1.5 font-heavy text-sz-rose-dark">
            <Heart className="h-6 w-6 fill-sz-rose text-sz-rose" />
            <span>{hearts}</span>
          </div>
        </div>
      </header>

      <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col px-4 py-8 md:px-6">
        <div className="mb-3 text-xs font-heavy uppercase tracking-widest text-sz-ink-soft">
          第 {cursor + 1} 题 / 共 {total} 题
        </div>
        {current && (
          <AnimatePresence mode="wait">
            <motion.div
              key={current.id}
              initial={{ x: 30, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -30, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="flex-1"
            >
              <ExerciseSwitch
                exercise={current}
                disabled={!!feedback}
                onSubmit={handleSubmit}
              />
            </motion.div>
          </AnimatePresence>
        )}
      </div>

      {/* Feedback drawer */}
      <AnimatePresence>
        {feedback && (
          <motion.div
            initial={{ y: 200 }}
            animate={{ y: 0 }}
            exit={{ y: 200 }}
            transition={{ type: 'spring', damping: 22, stiffness: 220 }}
            className={`sticky bottom-0 z-20 border-t-4 ${
              feedback.result === 'correct'
                ? 'border-sz-green bg-sz-green-soft'
                : 'border-sz-rose bg-rose-50'
            }`}
          >
            <div className="mx-auto flex max-w-3xl items-center gap-4 px-4 py-6 md:px-6">
              <div
                className={`flex h-14 w-14 items-center justify-center rounded-full ${
                  feedback.result === 'correct' ? 'bg-sz-green' : 'bg-sz-rose'
                }`}
              >
                {feedback.result === 'correct' ? (
                  <CheckCircle2 className="h-8 w-8 text-white" />
                ) : (
                  <XCircle className="h-8 w-8 text-white" />
                )}
              </div>
              <div className="flex-1">
                <div
                  className={`text-2xl font-heavy ${
                    feedback.result === 'correct' ? 'text-sz-green-dark' : 'text-sz-rose-dark'
                  }`}
                >
                  {feedback.result === 'correct' ? '太棒了！' : '差一点…'}
                </div>
                {feedback.canonical && (
                  <div className="mt-1 text-sm font-bold text-sz-ink-soft">
                    正确答案：<span className="font-heavy text-sz-ink">{feedback.canonical}</span>
                  </div>
                )}
              </div>
              <button
                onClick={next}
                className={
                  feedback.result === 'correct' ? 'btn-primary px-8' : 'btn-danger px-8'
                }
              >
                {cursor + 1 < total ? '继 续' : '完 成'}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
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
      return <TranslateChoiceExercise prompt={exercise.prompt as any} onSubmit={onSubmit} disabled={disabled} />;
    case ExerciseType.TRANSLATE_INPUT:
      return <TranslateInputExercise prompt={exercise.prompt as any} onSubmit={onSubmit} disabled={disabled} />;
    case ExerciseType.LISTEN_INPUT:
      return <ListenInputExercise prompt={exercise.prompt as any} onSubmit={onSubmit} disabled={disabled} />;
    case ExerciseType.IMAGE_CHOICE:
      return <ImageChoiceExercise prompt={exercise.prompt as any} onSubmit={onSubmit} disabled={disabled} />;
    case ExerciseType.WORD_BANK:
      return <WordBankExercise prompt={exercise.prompt as any} onSubmit={onSubmit} disabled={disabled} />;
    case ExerciseType.MATCH_PAIRS:
      return <MatchPairsExercise prompt={exercise.prompt as any} onSubmit={onSubmit} disabled={disabled} />;
    case ExerciseType.SINGLE_CHOICE:
      return <SingleChoiceExercise prompt={exercise.prompt as any} onSubmit={onSubmit} disabled={disabled} />;
    case ExerciseType.NUMERIC_INPUT:
      return <NumericInputExercise prompt={exercise.prompt as any} onSubmit={onSubmit} disabled={disabled} />;
    default:
      return <div className="card font-heavy">暂不支持该题型：{exercise.type}</div>;
  }
}
