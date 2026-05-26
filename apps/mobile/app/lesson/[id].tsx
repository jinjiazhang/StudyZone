/**
 * Mobile lesson player — simplified MVP supporting the most common types:
 * translate_choice, single_choice, translate_input, numeric_input.
 * Other types will fall back to a placeholder until ported.
 */
import { useState } from 'react';
import { View, Text, Pressable, StyleSheet, TextInput, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery, useMutation } from '@tanstack/react-query';
import { api } from '../../lib/api';
import { ExerciseType } from '@studyzone/shared-types';

export default function Lesson() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [cursor, setCursor] = useState(0);
  const [pick, setPick] = useState<number | null>(null);
  const [text, setText] = useState('');
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null);
  const [start] = useState(Date.now());

  const { data: session } = useQuery({
    queryKey: ['lesson-start-m', id],
    queryFn: () => api.startLesson(id!),
    enabled: !!id,
    refetchOnMount: false,
  });

  const submit = useMutation({
    mutationFn: (payload: any) =>
      api.submitAttempt(session!.sessionId, {
        exerciseId: session!.exercises[cursor]!.id,
        payload,
        responseMs: Date.now() - start,
      }),
  });

  const complete = useMutation({ mutationFn: () => api.completeSession(session!.sessionId) });

  if (!session) {
    return (
      <SafeAreaView style={styles.container}>
        <Text>载入中…</Text>
      </SafeAreaView>
    );
  }

  const ex = session.exercises[cursor];
  if (!ex) {
    return (
      <SafeAreaView style={styles.container}>
        <Text>关卡为空</Text>
      </SafeAreaView>
    );
  }

  async function check() {
    let payload: any = null;
    if (
      ex.type === ExerciseType.TRANSLATE_CHOICE ||
      ex.type === ExerciseType.SINGLE_CHOICE
    ) {
      if (pick === null) return;
      payload = { correctIndex: pick };
    } else if (
      ex.type === ExerciseType.TRANSLATE_INPUT ||
      ex.type === ExerciseType.LISTEN_INPUT
    ) {
      if (!text.trim()) return;
      payload = { accepted: [text.trim()] };
    } else if (ex.type === ExerciseType.NUMERIC_INPUT) {
      if (text === '') return;
      payload = { value: Number(text) };
    } else {
      Alert.alert('当前移动端版本暂未实现该题型');
      return;
    }

    const r = await submit.mutateAsync(payload);
    setFeedback(r.correct ? 'correct' : 'wrong');
  }

  async function next() {
    setFeedback(null);
    setPick(null);
    setText('');
    if (cursor + 1 < session.exercises.length) {
      setCursor(cursor + 1);
    } else {
      const r = await complete.mutateAsync();
      router.replace(`/(tabs)/learn`);
      Alert.alert('关卡完成', `获得 ${r.xpGained} XP · 连胜 ${r.newStreak}`);
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.progress}>
        {cursor + 1} / {session.exercises.length}
      </Text>

      {ex.type === ExerciseType.TRANSLATE_CHOICE && (
        <View style={{ gap: 8 }}>
          <Text style={styles.prompt}>{(ex.prompt as any).source}</Text>
          {(ex.prompt as any).options.map((o: string, i: number) => (
            <Pressable
              key={i}
              onPress={() => setPick(i)}
              style={[styles.opt, pick === i && styles.optActive]}
            >
              <Text style={styles.optText}>{o}</Text>
            </Pressable>
          ))}
        </View>
      )}

      {ex.type === ExerciseType.SINGLE_CHOICE && (
        <View style={{ gap: 8 }}>
          <Text style={styles.prompt}>{(ex.prompt as any).question}</Text>
          {(ex.prompt as any).options.map((o: string, i: number) => (
            <Pressable
              key={i}
              onPress={() => setPick(i)}
              style={[styles.opt, pick === i && styles.optActive]}
            >
              <Text style={styles.optText}>{o}</Text>
            </Pressable>
          ))}
        </View>
      )}

      {(ex.type === ExerciseType.TRANSLATE_INPUT ||
        ex.type === ExerciseType.LISTEN_INPUT ||
        ex.type === ExerciseType.NUMERIC_INPUT) && (
        <View style={{ gap: 8 }}>
          <Text style={styles.prompt}>
            {ex.type === ExerciseType.NUMERIC_INPUT
              ? (ex.prompt as any).statement
              : (ex.prompt as any).source}
          </Text>
          <TextInput
            value={text}
            onChangeText={setText}
            keyboardType={ex.type === ExerciseType.NUMERIC_INPUT ? 'numeric' : 'default'}
            style={styles.input}
            placeholder="输入答案"
          />
        </View>
      )}

      <View style={{ marginTop: 24 }}>
        {feedback ? (
          <Pressable onPress={next} style={styles.cta}>
            <Text style={styles.ctaText}>
              {feedback === 'correct' ? '正确，继续 →' : '差一点，下一题'}
            </Text>
          </Pressable>
        ) : (
          <Pressable onPress={check} style={styles.cta}>
            <Text style={styles.ctaText}>检查答案</Text>
          </Pressable>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, backgroundColor: '#F5F7FA' },
  progress: { color: '#6B7280', marginBottom: 12 },
  prompt: {
    fontSize: 22,
    fontWeight: '800',
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  opt: {
    padding: 14,
    borderRadius: 14,
    backgroundColor: 'white',
    borderWidth: 2,
    borderColor: '#E5E7EB',
  },
  optActive: { borderColor: '#3FB984', backgroundColor: '#E6F4EC' },
  optText: { fontSize: 16, fontWeight: '700' },
  input: {
    backgroundColor: 'white',
    borderRadius: 14,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    padding: 16,
    fontSize: 18,
  },
  cta: { backgroundColor: '#3FB984', padding: 16, borderRadius: 16, alignItems: 'center' },
  ctaText: { color: 'white', fontWeight: '800', fontSize: 16 },
});
