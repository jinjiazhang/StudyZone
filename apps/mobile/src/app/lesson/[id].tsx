import { useEffect, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery, useMutation } from '@tanstack/react-query';
import Animated, { withSpring, withTiming } from 'react-native-reanimated';
import { X, Heart, CheckCircle2, XCircle } from 'lucide-react-native';
import { ExerciseType, type SessionExerciseDto } from '@studyzone/shared-types';

import { api } from '@/lib/api';
import { useAnswerAudio } from '@/lib/audio';
import { colors, fonts, radius } from '@/lib/theme';
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

type Feedback = { result: 'correct' | 'wrong'; canonical?: string };
type QueuedExercise = SessionExerciseDto & { queueKey: string; retry: boolean };

export default function Lesson() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [cursor, setCursor] = useState(0);
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [hearts, setHearts] = useState(5);
  const [exerciseQueue, setExerciseQueue] = useState<QueuedExercise[]>([]);
  const [pendingRedoQueue, setPendingRedoQueue] = useState<QueuedExercise[]>([]);
  const [defeated, setDefeated] = useState(false);
  const [start] = useState(Date.now());
  const { playAnswerSound } = useAnswerAudio();

  const { data: me } = useQuery({ queryKey: ['me'], queryFn: () => api.me() });
  useEffect(() => {
    if (typeof me?.hearts === 'number') setHearts(me.hearts);
  }, [me?.hearts]);

  const { data: session, error: startError } = useQuery({
    queryKey: ['lesson-start-m', id],
    queryFn: () => api.startLesson(id!),
    enabled: !!id,
    refetchOnMount: false,
    retry: false,
  });

  useEffect(() => {
    if (!session) return;
    setCursor(0);
    setFeedback(null);
    setDefeated(false);
    setPendingRedoQueue([]);
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

  const complete = useMutation({ mutationFn: () => api.completeSession(session!.sessionId) });

  if (startError) {
    const outOfHearts = (startError as any)?.body?.code === 'out_of_hearts';
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centeredScreen}>
          <Heart size={64} color={colors.rose} fill={colors.rose} />
          <Text style={styles.screenTitle}>{outOfHearts ? '心数已耗尽' : '关卡加载失败'}</Text>
          <Text style={styles.screenSubtitle}>
            {outOfHearts
              ? '休息一下，等心数恢复或补充后再来挑战吧。'
              : (startError as any)?.body?.message ?? '请稍后再试。'}
          </Text>
          <Pressable onPress={() => router.back()} style={styles.screenBtn}>
            <Text style={styles.feedbackBtnText}>返 回</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  if (defeated) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centeredScreen}>
          <View style={[styles.feedbackIcon, { width: 80, height: 80, borderRadius: 40, backgroundColor: colors.rose }]}>
            <XCircle size={44} color={colors.white} />
          </View>
          <Text style={styles.screenTitle}>心数耗尽，本关失败</Text>
          <Text style={styles.screenSubtitle}>别灰心！等心数恢复后回来，把这关重新拿下。</Text>
          <Pressable onPress={() => router.back()} style={styles.screenBtn}>
            <Text style={styles.feedbackBtnText}>返 回</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  if (!session) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.loadingText}>载入关卡中…</Text>
      </SafeAreaView>
    );
  }

  if (session.exercises.length > 0 && exerciseQueue.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.loadingText}>载入关卡中…</Text>
      </SafeAreaView>
    );
  }

  const current: QueuedExercise | undefined = exerciseQueue[cursor];
  if (!current) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.loadingText}>关卡为空</Text>
      </SafeAreaView>
    );
  }

  const total = exerciseQueue.length;
  const courseId = session.courseId;
  const progress = total > 0 ? (cursor / total) * 100 : 0;
  const redoCount = pendingRedoQueue.length;

  // Gentle slide-up entrance for the feedback drawer (small amplitude).
  const feedbackEntering = (values: any) => {
    'worklet';
    return {
      initialValues: {
        originY: values.targetOriginY + 24,
        opacity: 0,
      },
      animations: {
        originY: withSpring(values.targetOriginY, { damping: 26, stiffness: 260 }),
        opacity: withTiming(1, { duration: 160 }),
      },
    };
  };

  async function handleSubmit(payload: any) {
    if (!current || !session) return;
    const responseMs = Date.now() - start;
    const r = await submit.mutateAsync({ exerciseId: current.id, payload, responseMs });
    void playAnswerSound(r.correct ? 'correct' : 'wrong');
    if (!r.correct) {
      setHearts(r.heartsRemaining);
      // Last heart spent → lesson is locked/failed server-side; show defeat screen.
      if (r.lessonFailed) {
        setFeedback(null);
        setDefeated(true);
        return;
      }
    }
    setFeedback({ result: r.correct ? 'correct' : 'wrong', canonical: r.canonicalAnswer });
    if (!r.correct) {
      setPendingRedoQueue((queue) => {
        const retryIndex = queue.length;
        return [
          ...queue,
          {
            ...current,
            queueKey: `${current.id}:retry:${Date.now()}:${retryIndex}`,
            retry: true,
          },
        ];
      });
    }
  }

  function startRedoRound(redoQueue = pendingRedoQueue) {
    const redoItems = redoQueue.map((exercise, index) => ({
      ...exercise,
      queueKey: `${exercise.id}:retry:${Date.now()}:${index}`,
      retry: true,
    }));
    setPendingRedoQueue([]);
    setExerciseQueue((queue) => [
      ...queue,
      ...redoItems.map((exercise, index) => ({
        ...exercise,
        queueKey: `${exercise.queueKey}:round:${queue.length + index}`,
      })),
    ]);
    setCursor(exerciseQueue.length);
  }

  async function next() {
    setFeedback(null);
    if (cursor + 1 < total) {
      setCursor(cursor + 1);
    } else if (redoCount > 0) {
      startRedoRound();
    } else {
      try {
        const r = await complete.mutateAsync();
        router.replace({
          pathname: '/lesson/complete',
          params: {
            xp: String(r.xpGained),
            gems: String(r.gemsGained ?? 0),
            streak: String(r.newStreak ?? 0),
            courseId,
          },
        });
      } catch (err: any) {
        const pendingExerciseIds = err?.body?.pendingExerciseIds ?? err?.pendingExerciseIds;
        if (Array.isArray(pendingExerciseIds) && pendingExerciseIds.length > 0) {
          const lookup = new Map(session!.exercises.map((exercise) => [exercise.id, exercise]));
          const redoItems = pendingExerciseIds
            .map((exerciseId, index) => {
              const exercise = lookup.get(exerciseId);
              if (!exercise) return null;
              return {
                ...exercise,
                queueKey: `${exercise.id}:server-retry:${Date.now()}:${index}`,
                retry: true,
              };
            })
            .filter((exercise): exercise is QueuedExercise => !!exercise);
          startRedoRound(redoItems);
        } else {
          throw err;
        }
      }
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Top bar: close, progress, hearts */}
      <View style={styles.topBar}>
        <Pressable onPress={() => router.back()} style={styles.closeBtn}>
          <X size={22} color={colors.inkSoft} />
        </Pressable>
        <View style={styles.progressBarWrap}>
          <View style={[styles.progressFill, { width: `${progress}%` }]}>
            <View style={styles.progressShine} />
          </View>
        </View>
        <View style={styles.heartsWrap}>
          <Heart size={22} color={colors.rose} fill={colors.rose} />
          <Text style={styles.heartsText}>{hearts}</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <Text style={styles.counter}>
          {current.retry ? '错题重做' : '本轮练习'} · 第 {cursor + 1} 题 / 共 {total} 题
          {redoCount > 0 ? ` · 待重做 ${redoCount} 题` : ''}
        </Text>

        <ExerciseSwitch
          key={current.queueKey}
          exercise={current}
          disabled={!!feedback}
          onSubmit={handleSubmit}
        />
      </ScrollView>

      {/* Feedback drawer */}
      {feedback && (
        <Animated.View
          entering={feedbackEntering}
          style={[
            styles.feedbackDrawer,
            { borderTopColor: feedback.result === 'correct' ? colors.green : colors.rose },
            { backgroundColor: feedback.result === 'correct' ? colors.greenSoft : '#FFF1F2' },
          ]}
        >
          <View style={styles.feedbackRow}>
            <View
              style={[
                styles.feedbackIcon,
                { backgroundColor: feedback.result === 'correct' ? colors.green : colors.rose },
              ]}
            >
              {feedback.result === 'correct' ? (
                <CheckCircle2 size={28} color={colors.white} />
              ) : (
                <XCircle size={28} color={colors.white} />
              )}
            </View>
            <View style={{ flex: 1 }}>
              <Text
                style={[
                  styles.feedbackTitle,
                  { color: feedback.result === 'correct' ? colors.greenDark : colors.roseDark },
                ]}
              >
                {feedback.result === 'correct' ? '太棒了！' : '差一点…'}
              </Text>
              {feedback.canonical && (
                <Text style={styles.feedbackCanonical}>
                  正确答案：
                  <Text style={{ fontFamily: fonts.heavy, color: colors.ink }}>
                    {feedback.canonical}
                  </Text>
                </Text>
              )}
            </View>
          </View>
          <Pressable
            onPress={next}
            style={[
              styles.feedbackBtn,
              {
                backgroundColor: feedback.result === 'correct' ? colors.green : colors.rose,
                borderColor: feedback.result === 'correct' ? colors.greenDark : colors.roseDark,
              },
            ]}
          >
            <Text style={styles.feedbackBtnText}>
              {cursor + 1 < total ? '继 续' : redoCount > 0 ? '去重做' : '完 成'}
            </Text>
          </Pressable>
        </Animated.View>
      )}
    </SafeAreaView>
  );
}

/* ─── Switch ─── */

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
    case ExerciseType.LISTEN_INPUT:
      return (
        <ListenInputExercise
          prompt={exercise.prompt as any}
          onSubmit={onSubmit}
          disabled={disabled}
        />
      );
    case ExerciseType.IMAGE_CHOICE:
      return (
        <ImageChoiceExercise
          prompt={exercise.prompt as any}
          onSubmit={onSubmit}
          disabled={disabled}
        />
      );
    case ExerciseType.WORD_BANK:
      return (
        <WordBankExercise prompt={exercise.prompt as any} onSubmit={onSubmit} disabled={disabled} />
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
    case ExerciseType.EXPRESSION_INPUT:
      return (
        <ExpressionInputExercise
          prompt={exercise.prompt as any}
          onSubmit={onSubmit}
          disabled={disabled}
        />
      );
    case ExerciseType.MULTI_NUMERIC_INPUT:
      return (
        <MultiNumericInputExercise
          prompt={exercise.prompt as any}
          onSubmit={onSubmit}
          disabled={disabled}
        />
      );
    case ExerciseType.ORDER_SEQUENCE:
      return (
        <OrderSequenceExercise
          prompt={exercise.prompt as any}
          onSubmit={onSubmit}
          disabled={disabled}
        />
      );
    case ExerciseType.COMPARE_INPUT:
      return (
        <CompareInputExercise
          prompt={exercise.prompt as any}
          onSubmit={onSubmit}
          disabled={disabled}
        />
      );
    case ExerciseType.MATH_DRAG_FILL:
      return (
        <MathDragFillExercise
          prompt={exercise.prompt as any}
          onSubmit={onSubmit}
          disabled={disabled}
        />
      );
    case ExerciseType.GEOMETRY_CHOICE:
      return (
        <GeometryChoiceExercise
          prompt={exercise.prompt as any}
          onSubmit={onSubmit}
          disabled={disabled}
        />
      );
    case ExerciseType.CLOCK_INPUT:
      return (
        <ClockInputExercise
          prompt={exercise.prompt as any}
          onSubmit={onSubmit}
          disabled={disabled}
        />
      );
    case ExerciseType.UNIT_CONVERSION:
      return (
        <UnitConversionExercise
          prompt={exercise.prompt as any}
          onSubmit={onSubmit}
          disabled={disabled}
        />
      );
    case ExerciseType.FRACTION_INPUT:
      return (
        <FractionInputExercise
          prompt={exercise.prompt as any}
          onSubmit={onSubmit}
          disabled={disabled}
        />
      );
    case ExerciseType.TABLE_READ:
      return (
        <TableReadExercise
          prompt={exercise.prompt as any}
          onSubmit={onSubmit}
          disabled={disabled}
        />
      );
    case ExerciseType.NUMBER_LINE:
      return (
        <NumberLineExercise
          prompt={exercise.prompt as any}
          onSubmit={onSubmit}
          disabled={disabled}
        />
      );
    case ExerciseType.GEOMETRY_DRAW:
      return (
        <GeometryDrawExercise
          prompt={exercise.prompt as any}
          onSubmit={onSubmit}
          disabled={disabled}
        />
      );
    case ExerciseType.PINYIN_CHOICE:
      return (
        <PinyinChoiceExercise
          prompt={exercise.prompt as any}
          onSubmit={onSubmit}
          disabled={disabled}
        />
      );
    case ExerciseType.POEM_COMPLETE:
      return (
        <PoemCompleteExercise
          prompt={exercise.prompt as any}
          onSubmit={onSubmit}
          disabled={disabled}
        />
      );
    case ExerciseType.PINYIN_TO_WORD:
      return (
        <PinyinToWordExercise
          prompt={exercise.prompt as any}
          onSubmit={onSubmit}
          disabled={disabled}
        />
      );
    case ExerciseType.POEM_MULTI_BLANK:
      return (
        <PoemMultiBlankExercise
          prompt={exercise.prompt as any}
          onSubmit={onSubmit}
          disabled={disabled}
        />
      );
    case ExerciseType.WORD_BUILD:
      return (
        <WordBuildExercise
          prompt={exercise.prompt as any}
          onSubmit={onSubmit}
          disabled={disabled}
        />
      );
    case ExerciseType.LISTEN_CHOICE:
      return (
        <ListenChoiceExercise
          prompt={exercise.prompt as any}
          onSubmit={onSubmit}
          disabled={disabled}
        />
      );
    case ExerciseType.TRUE_FALSE:
      return (
        <TrueFalseExercise
          prompt={exercise.prompt as any}
          onSubmit={onSubmit}
          disabled={disabled}
        />
      );
    case ExerciseType.DIALOGUE_COMPLETE:
      return (
        <DialogueCompleteExercise
          prompt={exercise.prompt as any}
          onSubmit={onSubmit}
          disabled={disabled}
        />
      );
    case ExerciseType.READING_COMPREHENSION:
      return (
        <ReadingComprehensionExercise
          prompt={exercise.prompt as any}
          onSubmit={onSubmit}
          disabled={disabled}
        />
      );
    case ExerciseType.PICTURE_ORDER:
      return (
        <PictureOrderExercise
          prompt={exercise.prompt as any}
          onSubmit={onSubmit}
          disabled={disabled}
        />
      );
    default:
      Alert.alert('当前移动端版本暂未实现该题型');
      return (
        <View style={styles.unsupported}>
          <Text style={styles.unsupportedText}>暂不支持该题型：{exercise.type}</Text>
        </View>
      );
  }
}

/* ─── Styles ─── */

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.white },
  loadingText: {
    fontFamily: fonts.heavy,
    color: colors.inkSoft,
    textAlign: 'center',
    marginTop: 100,
    fontSize: 16,
  },

  // Top bar
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 2,
    borderBottomColor: colors.line,
  },
  closeBtn: { borderRadius: radius.full, padding: 6 },
  progressBarWrap: {
    flex: 1,
    height: 16,
    borderRadius: radius.full,
    backgroundColor: colors.line,
    overflow: 'hidden',
  },
  progressFill: { height: '100%', borderRadius: radius.full, backgroundColor: colors.green },
  progressShine: {
    position: 'absolute',
    top: 3,
    left: 8,
    right: 8,
    height: 4,
    borderRadius: radius.full,
    backgroundColor: 'rgba(255,255,255,0.5)',
  },
  heartsWrap: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  heartsText: { fontFamily: fonts.heavy, fontSize: 16, color: colors.roseDark },

  scroll: { padding: 16, paddingBottom: 24 },
  counter: {
    fontFamily: fonts.heavy,
    fontSize: 10,
    color: colors.inkSoft,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    marginBottom: 12,
  },

  // Feedback drawer
  feedbackDrawer: { borderTopWidth: 4, paddingHorizontal: 16, paddingVertical: 16 },
  feedbackRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  feedbackIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  feedbackTitle: { fontFamily: fonts.heavy, fontSize: 22 },
  feedbackCanonical: {
    fontFamily: fonts.sansBold,
    fontSize: 13,
    color: colors.inkSoft,
    marginTop: 4,
  },
  feedbackBtn: {
    marginTop: 14,
    borderRadius: radius.lg,
    borderWidth: 2,
    borderBottomWidth: 4,
    paddingVertical: 15,
    alignItems: 'center',
  },
  feedbackBtnText: {
    fontFamily: fonts.heavy,
    fontSize: 16,
    color: colors.white,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },

  unsupported: {
    padding: 16,
    borderRadius: radius.lg,
    borderWidth: 2,
    borderColor: colors.line,
    backgroundColor: colors.mist,
  },
  unsupportedText: { fontFamily: fonts.heavy, fontSize: 14, color: colors.inkSoft },

  // Full-screen states (out of hearts / defeat)
  centeredScreen: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    paddingHorizontal: 32,
  },
  screenTitle: { fontFamily: fonts.heavy, fontSize: 22, color: colors.ink, textAlign: 'center' },
  screenSubtitle: {
    fontFamily: fonts.sansBold,
    fontSize: 14,
    color: colors.inkSoft,
    textAlign: 'center',
    lineHeight: 20,
  },
  screenBtn: {
    marginTop: 8,
    borderRadius: radius.lg,
    borderWidth: 2,
    borderBottomWidth: 4,
    borderColor: colors.greenDark,
    backgroundColor: colors.green,
    paddingVertical: 14,
    paddingHorizontal: 40,
    alignItems: 'center',
  },
});
