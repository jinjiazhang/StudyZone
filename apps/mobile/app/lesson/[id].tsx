import { useState } from 'react';
import {
  Alert,
  Image,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery, useMutation } from '@tanstack/react-query';
import { ExerciseType } from '@studyzone/shared-types';
import { api } from '../../lib/api';

export default function Lesson() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [cursor, setCursor] = useState(0);
  const [pick, setPick] = useState<number | null>(null);
  const [imagePick, setImagePick] = useState<string | null>(null);
  const [text, setText] = useState('');
  const [wordOrder, setWordOrder] = useState<number[]>([]);
  const [pairs, setPairs] = useState<Record<string, string>>({});
  const [pickedLeft, setPickedLeft] = useState<string | null>(null);
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
        <Text>载入中...</Text>
      </SafeAreaView>
    );
  }

  const activeSession = session;
  const ex = activeSession.exercises[cursor];
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
      ex.type === ExerciseType.SINGLE_CHOICE ||
      ex.type === ExerciseType.PINYIN_CHOICE ||
      ex.type === ExerciseType.POEM_COMPLETE
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
    } else if (ex.type === ExerciseType.WORD_BANK) {
      if (wordOrder.length === 0) return;
      payload = { ordered: wordOrder.map((idx) => (ex.prompt as any).tokens[idx]).filter(Boolean) };
    } else if (ex.type === ExerciseType.MATCH_PAIRS) {
      if (Object.keys(pairs).length !== (ex.prompt as any).left.length) return;
      payload = { pairs };
    } else if (ex.type === ExerciseType.IMAGE_CHOICE) {
      if (!imagePick) return;
      payload = { correctOptionId: imagePick };
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
    setImagePick(null);
    setText('');
    setWordOrder([]);
    setPairs({});
    setPickedLeft(null);
    if (cursor + 1 < activeSession.exercises.length) {
      setCursor(cursor + 1);
    } else {
      const r = await complete.mutateAsync();
      router.replace('/(tabs)/learn');
      Alert.alert('关卡完成', `获得 ${r.xpGained} XP · 连胜 ${r.newStreak}`);
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.progress}>
          {cursor + 1} / {activeSession.exercises.length}
        </Text>

        {ex.type === ExerciseType.TRANSLATE_CHOICE && (
          <ChoiceBlock
            title={(ex.prompt as any).source}
            options={(ex.prompt as any).options}
            pick={pick}
            onPick={setPick}
          />
        )}

        {ex.type === ExerciseType.SINGLE_CHOICE && (
          <ChoiceBlock
            title={(ex.prompt as any).question}
            options={(ex.prompt as any).options}
            pick={pick}
            onPick={setPick}
          />
        )}

        {ex.type === ExerciseType.TRANSLATE_INPUT && (
          <TextInputBlock
            title={(ex.prompt as any).source}
            text={text}
            onText={setText}
            placeholder="输入答案"
          />
        )}

        {ex.type === ExerciseType.LISTEN_INPUT && (
          <TextInputBlock
            title="听音频，输入你听到的内容"
            text={text}
            onText={setText}
            placeholder="输入你听到的句子"
            audioUrl={(ex.prompt as any).audioUrl}
            audioUrlSlow={(ex.prompt as any).audioUrlSlow}
          />
        )}

        {ex.type === ExerciseType.NUMERIC_INPUT && (
          <TextInputBlock
            title={(ex.prompt as any).statement}
            text={text}
            onText={setText}
            keyboardType="numeric"
            placeholder="输入答案"
          />
        )}

        {ex.type === ExerciseType.WORD_BANK && (
          <WordBankBlock
            source={(ex.prompt as any).source}
            tokens={(ex.prompt as any).tokens}
            picked={wordOrder}
            onChange={setWordOrder}
          />
        )}

        {ex.type === ExerciseType.MATCH_PAIRS && (
          <MatchPairsBlock
            left={(ex.prompt as any).left}
            right={(ex.prompt as any).right}
            pairs={pairs}
            pickedLeft={pickedLeft}
            onPairs={setPairs}
            onPickedLeft={setPickedLeft}
          />
        )}

        {ex.type === ExerciseType.IMAGE_CHOICE && (
          <ImageChoiceBlock
            word={(ex.prompt as any).word}
            options={(ex.prompt as any).options}
            pick={imagePick}
            onPick={setImagePick}
            audioUrl={(ex.prompt as any).audioUrl}
          />
        )}

        {ex.type === ExerciseType.PINYIN_CHOICE && (
          <ChoiceBlock
            title={(ex.prompt as any).character}
            options={(ex.prompt as any).options}
            pick={pick}
            onPick={setPick}
          />
        )}

        {ex.type === ExerciseType.POEM_COMPLETE && (
          <ChoiceBlock
            title={`《${(ex.prompt as any).title}》— 选出正确的字`}
            options={(ex.prompt as any).options}
            pick={pick}
            onPick={setPick}
          />
        )}

        <View style={{ marginTop: 24 }}>
          {feedback ? (
            <Pressable onPress={next} style={styles.cta}>
              <Text style={styles.ctaText}>
                {feedback === 'correct' ? '正确，继续' : '差一点，下一题'}
              </Text>
            </Pressable>
          ) : (
            <Pressable onPress={check} style={styles.cta}>
              <Text style={styles.ctaText}>检查答案</Text>
            </Pressable>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function ChoiceBlock({
  title,
  options,
  pick,
  onPick,
}: {
  title: string;
  options: string[];
  pick: number | null;
  onPick: (idx: number) => void;
}) {
  return (
    <View style={{ gap: 8 }}>
      <Text style={styles.prompt}>{title}</Text>
      {options.map((o, i) => (
        <Pressable key={i} onPress={() => onPick(i)} style={[styles.opt, pick === i && styles.optActive]}>
          <Text style={styles.optText}>{o}</Text>
        </Pressable>
      ))}
    </View>
  );
}

function TextInputBlock({
  title,
  text,
  onText,
  placeholder,
  keyboardType = 'default',
  audioUrl,
  audioUrlSlow,
}: {
  title: string;
  text: string;
  onText: (value: string) => void;
  placeholder: string;
  keyboardType?: 'default' | 'numeric';
  audioUrl?: string;
  audioUrlSlow?: string;
}) {
  return (
    <View style={{ gap: 8 }}>
      <Text style={styles.prompt}>{title}</Text>
      {audioUrl && <AudioButton label="播放音频" url={audioUrl} />}
      {audioUrlSlow && <AudioButton label="慢速播放" url={audioUrlSlow} />}
      <TextInput
        value={text}
        onChangeText={onText}
        keyboardType={keyboardType}
        style={styles.input}
        placeholder={placeholder}
      />
    </View>
  );
}

function AudioButton({ label, url }: { label: string; url: string }) {
  return (
    <Pressable onPress={() => Linking.openURL(url)} style={styles.secondaryCta}>
      <Text style={styles.secondaryCtaText}>{label}</Text>
    </Pressable>
  );
}

function WordBankBlock({
  source,
  tokens,
  picked,
  onChange,
}: {
  source: string;
  tokens: string[];
  picked: number[];
  onChange: (next: number[]) => void;
}) {
  const remaining = tokens.map((_, i) => i).filter((idx) => !picked.includes(idx));

  return (
    <View style={{ gap: 12 }}>
      <Text style={styles.prompt}>{source}</Text>
      <View style={styles.answerBank}>
        {picked.map((idx, order) => (
          <Pressable
            key={`${idx}-${order}`}
            onPress={() => onChange(picked.filter((_, i) => i !== order))}
            style={[styles.token, styles.tokenActive]}
          >
            <Text style={styles.tokenText}>{tokens[idx]}</Text>
          </Pressable>
        ))}
      </View>
      <View style={styles.tokenWrap}>
        {remaining.map((idx) => (
          <Pressable key={idx} onPress={() => onChange([...picked, idx])} style={styles.token}>
            <Text style={styles.tokenText}>{tokens[idx]}</Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

function MatchPairsBlock({
  left,
  right,
  pairs,
  pickedLeft,
  onPairs,
  onPickedLeft,
}: {
  left: { id: string; text: string }[];
  right: { id: string; text: string }[];
  pairs: Record<string, string>;
  pickedLeft: string | null;
  onPairs: (pairs: Record<string, string>) => void;
  onPickedLeft: (id: string | null) => void;
}) {
  const usedRight = new Set(Object.values(pairs));

  function toggleLeft(id: string) {
    if (pairs[id]) {
      const { [id]: _removed, ...rest } = pairs;
      onPairs(rest);
      return;
    }
    onPickedLeft(id);
  }

  function pickRight(id: string) {
    if (!pickedLeft || usedRight.has(id)) return;
    onPairs({ ...pairs, [pickedLeft]: id });
    onPickedLeft(null);
  }

  return (
    <View style={{ gap: 12 }}>
      <Text style={styles.prompt}>把左右两列配对</Text>
      <View style={styles.pairColumns}>
        <View style={styles.pairColumn}>
          {left.map((item) => (
            <Pressable
              key={item.id}
              onPress={() => toggleLeft(item.id)}
              style={[
                styles.opt,
                pairs[item.id] ? styles.optActive : null,
                pickedLeft === item.id ? styles.optPicked : null,
              ]}
            >
              <Text style={styles.optText}>{item.text}</Text>
            </Pressable>
          ))}
        </View>
        <View style={styles.pairColumn}>
          {right.map((item) => (
            <Pressable
              key={item.id}
              onPress={() => pickRight(item.id)}
              style={[styles.opt, usedRight.has(item.id) && styles.optActive]}
            >
              <Text style={styles.optText}>{item.text}</Text>
            </Pressable>
          ))}
        </View>
      </View>
    </View>
  );
}

function ImageChoiceBlock({
  word,
  options,
  pick,
  onPick,
  audioUrl,
}: {
  word: string;
  options: { id: string; imageUrl: string; label: string }[];
  pick: string | null;
  onPick: (id: string) => void;
  audioUrl?: string;
}) {
  return (
    <View style={{ gap: 12 }}>
      <Text style={styles.prompt}>{word}</Text>
      {audioUrl && <AudioButton label="播放音频" url={audioUrl} />}
      <View style={styles.imageGrid}>
        {options.map((option) => (
          <Pressable
            key={option.id}
            onPress={() => onPick(option.id)}
            style={[styles.imageOption, pick === option.id && styles.optActive]}
          >
            <Image source={{ uri: option.imageUrl }} style={styles.image} />
            <Text style={styles.imageLabel}>{option.label}</Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, backgroundColor: '#F5F7FA' },
  scroll: { paddingBottom: 24 },
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
  optPicked: { borderColor: '#F2B84B', backgroundColor: '#FFF7DB' },
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
  secondaryCta: {
    backgroundColor: 'white',
    padding: 14,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: '#3FB984',
    alignItems: 'center',
  },
  secondaryCtaText: { color: '#267A59', fontWeight: '800', fontSize: 16 },
  answerBank: {
    minHeight: 76,
    backgroundColor: 'white',
    borderRadius: 14,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    padding: 10,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tokenWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  token: {
    backgroundColor: 'white',
    borderRadius: 14,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  tokenActive: { borderColor: '#3FB984' },
  tokenText: { fontSize: 16, fontWeight: '800', color: '#1F2937' },
  pairColumns: { flexDirection: 'row', gap: 10 },
  pairColumn: { flex: 1, gap: 8 },
  imageGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  imageOption: {
    width: '48%',
    overflow: 'hidden',
    backgroundColor: 'white',
    borderRadius: 14,
    borderWidth: 2,
    borderColor: '#E5E7EB',
  },
  image: { width: '100%', height: 120, backgroundColor: '#E5E7EB' },
  imageLabel: { padding: 10, fontSize: 15, fontWeight: '800', color: '#1F2937' },
});
