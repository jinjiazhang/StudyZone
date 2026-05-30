import { useEffect, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery, useMutation } from '@tanstack/react-query';
import Animated, { withSpring, withTiming } from 'react-native-reanimated';
import { X, Heart, CheckCircle2, XCircle } from 'lucide-react-native';
import { ExerciseType, type SessionExerciseDto } from '@studyzone/shared-types';

import { api } from '@/lib/api';
import { useAnswerSounds } from '@/lib/answer-sounds';
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
} from '@/components/exercises';

type Feedback = { result: 'correct' | 'wrong'; canonical?: string };

export default function Lesson() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [cursor, setCursor] = useState(0);
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [hearts, setHearts] = useState(5);
  const [start] = useState(Date.now());
  const { playAnswerSound } = useAnswerSounds();

  const { data: me } = useQuery({ queryKey: ['me'], queryFn: () => api.me() });
  useEffect(() => {
    if (typeof me?.hearts === 'number') setHearts(me.hearts);
  }, [me?.hearts]);

  const { data: session } = useQuery({
    queryKey: ['lesson-start-m', id],
    queryFn: () => api.startLesson(id!),
    enabled: !!id,
    refetchOnMount: false,
  });

  const submit = useMutation({
    mutationFn: (args: { exerciseId: string; payload: any; responseMs: number }) =>
      api.submitAttempt(session!.sessionId, args),
  });

  const complete = useMutation({ mutationFn: () => api.completeSession(session!.sessionId) });

  if (!session) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.loadingText}>载入关卡中…</Text>
      </SafeAreaView>
    );
  }

  const current: SessionExerciseDto | undefined = session.exercises[cursor];
  if (!current) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.loadingText}>关卡为空</Text>
      </SafeAreaView>
    );
  }

  const total = session.exercises.length;
  const courseId = session.courseId;
  const progress = total > 0 ? (cursor / total) * 100 : 0;

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
    setFeedback({ result: r.correct ? 'correct' : 'wrong', canonical: r.canonicalAnswer });
    if (!r.correct) setHearts((h) => Math.max(0, h - 1));
  }

  async function next() {
    setFeedback(null);
    if (cursor + 1 < total) {
      setCursor(cursor + 1);
    } else {
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
          第 {cursor + 1} 题 / 共 {total} 题
        </Text>

        <ExerciseSwitch
          key={current.id}
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
              <Text style={styles.feedbackBtnText}>{cursor + 1 < total ? '继 续' : '完 成'}</Text>
            </Pressable>
          </View>
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
    borderRadius: radius.lg,
    borderWidth: 2,
    borderBottomWidth: 4,
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  feedbackBtnText: {
    fontFamily: fonts.heavy,
    fontSize: 14,
    color: colors.white,
    textTransform: 'uppercase',
  },

  unsupported: {
    padding: 16,
    borderRadius: radius.lg,
    borderWidth: 2,
    borderColor: colors.line,
    backgroundColor: colors.mist,
  },
  unsupportedText: { fontFamily: fonts.heavy, fontSize: 14, color: colors.inkSoft },
});
