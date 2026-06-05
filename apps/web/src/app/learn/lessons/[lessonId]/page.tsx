'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CheckCircle2, XCircle, Heart } from 'lucide-react';

import { api } from '@/lib/api';
import { playAnswerSound, preloadAnswerSounds } from '@/lib/answer-sounds';
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
  PinyinChoiceExercise,
  PoemCompleteExercise,
  PinyinToWordExercise,
  PoemMultiBlankExercise,
  WordBuildExercise,
  ClockInputExercise,
  CompareInputExercise,
  ExpressionInputExercise,
  FractionInputExercise,
  GeometryChoiceExercise,
  GeometryDrawExercise,
  MathDragFillExercise,
  MultiNumericInputExercise,
  NumberLineExercise,
  OrderSequenceExercise,
  TableReadExercise,
  UnitConversionExercise,
  ListenChoiceExercise,
  TrueFalseExercise,
  DialogueCompleteExercise,
  ReadingComprehensionExercise,
  PictureOrderExercise,
} from '@/components/exercises';

interface AttemptState {
  result: 'correct' | 'wrong';
  canonical?: string;
}

type QueuedExercise = SessionExerciseDto & { queueKey: string; retry: boolean };

export default function LessonPage() {
  const params = useParams<{ lessonId: string }>();
  const router = useRouter();
  const [cursor, setCursor] = useState(0);
  const [feedback, setFeedback] = useState<AttemptState | null>(null);
  const [hearts, setHearts] = useState<number>(5);
  const [exerciseQueue, setExerciseQueue] = useState<QueuedExercise[]>([]);
  const [redoCount, setRedoCount] = useState(0);
  const [startTs] = useState(() => Date.now());

  const { data: me } = useQuery({ queryKey: ['me'], queryFn: () => api.me() });
  useEffect(() => {
    if (typeof me?.hearts === 'number') setHearts(me.hearts);
  }, [me?.hearts]);

  useEffect(() => {
    preloadAnswerSounds();
  }, []);

  const { data: session, isLoading } = useQuery({
    queryKey: ['lesson-start', params.lessonId],
    queryFn: () => api.startLesson(params.lessonId),
    refetchOnMount: false,
  });

  useEffect(() => {
    if (!session) return;
    setCursor(0);
    setFeedback(null);
    setRedoCount(0);
    setExerciseQueue(
      session.exercises.map((exercise, index) => ({
        ...exercise,
        queueKey: `${exercise.id}:initial:${index}`,
        retry: false,
      })),
    );
  }, [session?.sessionId]);

  const submit = useMutation({
    mutationFn: (args: { exerciseId: string; payload: any; responseMs: number }) =>
      api.submitAttempt(session!.sessionId, args),
  });

  const complete = useMutation({
    mutationFn: () => api.completeSession(session!.sessionId),
  });

  const current: QueuedExercise | undefined = exerciseQueue[cursor];
  const total = exerciseQueue.length;
  const progress = total > 0 ? (cursor / total) * 100 : 0;

  async function handleSubmit(payload: any) {
    if (!current || !session) return;
    preloadAnswerSounds();
    const responseMs = Date.now() - startTs;
    const res = await submit.mutateAsync({
      exerciseId: current.id,
      payload,
      responseMs,
    });
    playAnswerSound(res.correct ? 'correct' : 'wrong');
    setFeedback({
      result: res.correct ? 'correct' : 'wrong',
      canonical: res.canonicalAnswer,
    });
    if (!res.correct) {
      setHearts((h: number) => Math.max(0, h - 1));
      if (!current.retry) setRedoCount((count) => count + 1);
      setExerciseQueue((queue) => [
        ...queue,
        {
          ...current,
          queueKey: `${current.id}:retry:${Date.now()}:${queue.length}`,
          retry: true,
        },
      ]);
    } else if (current.retry) {
      setRedoCount((count) => Math.max(0, count - 1));
    }
  }

  async function next() {
    setFeedback(null);
    if (cursor + 1 < total) {
      setCursor(cursor + 1);
    } else if (session) {
      const r = await complete.mutateAsync();
      router.push(
        `/learn/lessons/${params.lessonId}/complete?xp=${r.xpGained}&gems=${r.gemsGained}&streak=${r.newStreak}&courseId=${session.courseId}`,
      );
    }
  }

  if (isLoading || !session || (session.exercises.length > 0 && exerciseQueue.length === 0))
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
          {current?.retry ? '错题重做' : '本轮练习'} · 第 {cursor + 1} 题 / 共 {total} 题
          {redoCount > 0 && (
            <span className="ml-2 text-sz-rose-dark">待重做 {redoCount} 题</span>
          )}
        </div>
        {current && (
          <AnimatePresence mode="wait">
            <motion.div
              key={current.queueKey}
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
                {cursor + 1 < total ? (redoCount > 0 ? '去重做' : '继 续') : '完 成'}
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
    case ExerciseType.EXPRESSION_INPUT:
      return <ExpressionInputExercise prompt={exercise.prompt as any} onSubmit={onSubmit} disabled={disabled} />;
    case ExerciseType.MULTI_NUMERIC_INPUT:
      return <MultiNumericInputExercise prompt={exercise.prompt as any} onSubmit={onSubmit} disabled={disabled} />;
    case ExerciseType.ORDER_SEQUENCE:
      return <OrderSequenceExercise prompt={exercise.prompt as any} onSubmit={onSubmit} disabled={disabled} />;
    case ExerciseType.COMPARE_INPUT:
      return <CompareInputExercise prompt={exercise.prompt as any} onSubmit={onSubmit} disabled={disabled} />;
    case ExerciseType.MATH_DRAG_FILL:
      return <MathDragFillExercise prompt={exercise.prompt as any} onSubmit={onSubmit} disabled={disabled} />;
    case ExerciseType.GEOMETRY_CHOICE:
      return <GeometryChoiceExercise prompt={exercise.prompt as any} onSubmit={onSubmit} disabled={disabled} />;
    case ExerciseType.CLOCK_INPUT:
      return <ClockInputExercise prompt={exercise.prompt as any} onSubmit={onSubmit} disabled={disabled} />;
    case ExerciseType.UNIT_CONVERSION:
      return <UnitConversionExercise prompt={exercise.prompt as any} onSubmit={onSubmit} disabled={disabled} />;
    case ExerciseType.FRACTION_INPUT:
      return <FractionInputExercise prompt={exercise.prompt as any} onSubmit={onSubmit} disabled={disabled} />;
    case ExerciseType.TABLE_READ:
      return <TableReadExercise prompt={exercise.prompt as any} onSubmit={onSubmit} disabled={disabled} />;
    case ExerciseType.NUMBER_LINE:
      return <NumberLineExercise prompt={exercise.prompt as any} onSubmit={onSubmit} disabled={disabled} />;
    case ExerciseType.GEOMETRY_DRAW:
      return <GeometryDrawExercise prompt={exercise.prompt as any} onSubmit={onSubmit} disabled={disabled} />;
    case ExerciseType.PINYIN_CHOICE:
      return <PinyinChoiceExercise prompt={exercise.prompt as any} onSubmit={onSubmit} disabled={disabled} />;
    case ExerciseType.POEM_COMPLETE:
      return <PoemCompleteExercise prompt={exercise.prompt as any} onSubmit={onSubmit} disabled={disabled} />;
    case ExerciseType.PINYIN_TO_WORD:
      return <PinyinToWordExercise prompt={exercise.prompt as any} onSubmit={onSubmit} disabled={disabled} />;
    case ExerciseType.POEM_MULTI_BLANK:
      return <PoemMultiBlankExercise prompt={exercise.prompt as any} onSubmit={onSubmit} disabled={disabled} />;
    case ExerciseType.WORD_BUILD:
      return <WordBuildExercise prompt={exercise.prompt as any} onSubmit={onSubmit} disabled={disabled} />;
    case ExerciseType.LISTEN_CHOICE:
      return <ListenChoiceExercise prompt={exercise.prompt as any} onSubmit={onSubmit} disabled={disabled} />;
    case ExerciseType.TRUE_FALSE:
      return <TrueFalseExercise prompt={exercise.prompt as any} onSubmit={onSubmit} disabled={disabled} />;
    case ExerciseType.DIALOGUE_COMPLETE:
      return <DialogueCompleteExercise prompt={exercise.prompt as any} onSubmit={onSubmit} disabled={disabled} />;
    case ExerciseType.READING_COMPREHENSION:
      return <ReadingComprehensionExercise prompt={exercise.prompt as any} onSubmit={onSubmit} disabled={disabled} />;
    case ExerciseType.PICTURE_ORDER:
      return <PictureOrderExercise prompt={exercise.prompt as any} onSubmit={onSubmit} disabled={disabled} />;
    default:
      return <div className="card font-heavy">暂不支持该题型：{exercise.type}</div>;
  }
}
