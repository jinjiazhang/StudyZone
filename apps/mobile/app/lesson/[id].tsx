import { useEffect, useState } from 'react';
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
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  SlideInDown,
  SlideOutDown,
  FadeIn,
} from 'react-native-reanimated';
import { X, Heart, CheckCircle2, XCircle, Volume2 } from 'lucide-react-native';
import { ExerciseType } from '@studyzone/shared-types';
import { api } from '../../lib/api';
import { useAnswerSounds } from '../../lib/answer-sounds';
import { colors, fonts, radius } from '../../lib/theme';
import { HanziWriterCanvas } from '../../components/HanziWriterCanvas';

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
  const [slotFills, setSlotFills] = useState<Record<string, string>>({});
  const [writeResult, setWriteResult] = useState<{ mistakes: number; completed: boolean } | null>(null);
  const [feedback, setFeedback] = useState<{ result: 'correct' | 'wrong'; canonical?: string } | null>(null);
  const [hearts, setHearts] = useState<number>(5);
  const [start] = useState(Date.now());
  const [checkPressed, setCheckPressed] = useState(false);
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
        <Text style={styles.loadingText}>载入关卡中…</Text>
      </SafeAreaView>
    );
  }

  const ex = session.exercises[cursor];
  if (!ex) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.loadingText}>关卡为空</Text>
      </SafeAreaView>
    );
  }

  const total = session.exercises.length;
  const courseId = session.courseId;
  const progress = total > 0 ? (cursor / total) * 100 : 0;

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
    } else if (ex.type === ExerciseType.PINYIN_TO_CHARACTER_ASSEMBLE) {
      const slots = (ex.prompt as any).slots as { id: string }[];
      if (Object.keys(slotFills).length !== slots.length) return;
      payload = { slotFills };
    } else if (ex.type === ExerciseType.PINYIN_TO_CHARACTER_WRITE) {
      if (!writeResult) return;
      payload = {
        character: (ex.prompt as any).character,
        mistakes: writeResult.mistakes,
        completed: writeResult.completed,
      };
    } else {
      Alert.alert('当前移动端版本暂未实现该题型');
      return;
    }

    const r = await submit.mutateAsync(payload);
    void playAnswerSound(r.correct ? 'correct' : 'wrong');
    setFeedback({
      result: r.correct ? 'correct' : 'wrong',
      canonical: r.canonicalAnswer,
    });
    if (!r.correct) setHearts((h) => Math.max(0, h - 1));
  }

  async function next() {
    setFeedback(null);
    setPick(null);
    setImagePick(null);
    setText('');
    setWordOrder([]);
    setPairs({});
    setPickedLeft(null);
    setSlotFills({});
    setWriteResult(null);
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

  const hasAnswer = pick !== null || imagePick !== null || text.trim() !== '' || wordOrder.length > 0 || Object.keys(pairs).length > 0 || Object.keys(slotFills).length > 0 || writeResult !== null;

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

        {/* Exercise blocks */}
        {(ex.type === ExerciseType.TRANSLATE_CHOICE || ex.type === ExerciseType.SINGLE_CHOICE) && (
          <ChoiceBlock
            title={ex.type === ExerciseType.TRANSLATE_CHOICE ? (ex.prompt as any).source : (ex.prompt as any).question}
            label={ex.type === ExerciseType.TRANSLATE_CHOICE ? '翻译此句' : '选择正确答案'}
            options={(ex.prompt as any).options}
            pick={pick}
            onPick={setPick}
            disabled={!!feedback}
          />
        )}

        {ex.type === ExerciseType.PINYIN_CHOICE && (
          <View style={{ gap: 12 }}>
            <Text style={styles.labelSmall}>选择拼音</Text>
            <View style={styles.promptCard}>
              <Text style={styles.giantChar}>{(ex.prompt as any).character}</Text>
            </View>
            <OptionList
              options={(ex.prompt as any).options}
              pick={pick}
              onPick={setPick}
              disabled={!!feedback}
            />
          </View>
        )}

        {ex.type === ExerciseType.POEM_COMPLETE && (
          <View style={{ gap: 12 }}>
            <Text style={styles.labelSmall}>诗词填空</Text>
            <View style={styles.promptCard}>
              <Text style={styles.promptBold}>{(ex.prompt as any).title}</Text>
              <Text style={styles.poemContext}>{(ex.prompt as any).context}</Text>
            </View>
            <OptionList
              options={(ex.prompt as any).options}
              pick={pick}
              onPick={setPick}
              disabled={!!feedback}
            />
          </View>
        )}

        {(ex.type === ExerciseType.TRANSLATE_INPUT || ex.type === ExerciseType.LISTEN_INPUT) && (
          <TextInputBlock
            title={ex.type === ExerciseType.TRANSLATE_INPUT ? (ex.prompt as any).source : '听写'}
            label={ex.type === ExerciseType.TRANSLATE_INPUT ? '翻译此句' : '听音频，输入你听到的内容'}
            text={text}
            onText={setText}
            placeholder={ex.type === ExerciseType.TRANSLATE_INPUT ? '输入翻译…' : '输入你听到的内容…'}
            audioUrl={ex.type === ExerciseType.LISTEN_INPUT ? (ex.prompt as any).audioUrl : undefined}
            audioUrlSlow={ex.type === ExerciseType.LISTEN_INPUT ? (ex.prompt as any).audioUrlSlow : undefined}
            disabled={!!feedback}
          />
        )}

        {ex.type === ExerciseType.NUMERIC_INPUT && (
          <View style={{ gap: 12 }}>
            <Text style={styles.labelSmall}>计算</Text>
            <View style={styles.promptCard}>
              <Text style={styles.mathStatement}>{(ex.prompt as any).statement}</Text>
            </View>
            <TextInput
              value={text}
              onChangeText={setText}
              keyboardType="numeric"
              style={[styles.textInput, { textAlign: 'center', fontSize: 28 }]}
              placeholder="输入答案…"
              placeholderTextColor={colors.inkSoft}
              editable={!feedback}
            />
          </View>
        )}

        {ex.type === ExerciseType.WORD_BANK && (
          <WordBankBlock
            source={(ex.prompt as any).source}
            tokens={(ex.prompt as any).tokens}
            picked={wordOrder}
            onChange={setWordOrder}
            disabled={!!feedback}
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
            disabled={!!feedback}
          />
        )}

        {ex.type === ExerciseType.IMAGE_CHOICE && (
          <ImageChoiceBlock
            word={(ex.prompt as any).word}
            options={(ex.prompt as any).options}
            pick={imagePick}
            onPick={setImagePick}
            audioUrl={(ex.prompt as any).audioUrl}
            disabled={!!feedback}
          />
        )}

        {ex.type === ExerciseType.PINYIN_TO_CHARACTER_ASSEMBLE && (
          <PinyinAssembleBlock
            pinyin={(ex.prompt as any).pinyin}
            hint={(ex.prompt as any).hint}
            structure={(ex.prompt as any).structure}
            slots={(ex.prompt as any).slots}
            candidates={(ex.prompt as any).candidates}
            slotFills={slotFills}
            onSlotFills={setSlotFills}
            disabled={!!feedback}
          />
        )}

        {ex.type === ExerciseType.PINYIN_TO_CHARACTER_WRITE && (
          <HanziWriterCanvas
            character={(ex.prompt as any).character}
            pinyin={(ex.prompt as any).pinyin}
            sentence={(ex.prompt as any).sentence}
            blankPlaceholder={(ex.prompt as any).blankPlaceholder}
            allowedMistakes={(ex.prompt as any).allowedMistakes}
            leniency={(ex.prompt as any).leniency}
            disabled={!!feedback}
            completedResult={writeResult}
            onComplete={setWriteResult}
            onSkip={setWriteResult}
          />
        )}
      </ScrollView>

      {/* Bottom CTA or Feedback drawer */}
      {feedback ? (
        <Animated.View
          entering={SlideInDown.springify().damping(22).stiffness(220)}
          style={[
            styles.feedbackDrawer,
            { borderTopColor: feedback.result === 'correct' ? colors.green : colors.rose },
            { backgroundColor: feedback.result === 'correct' ? colors.greenSoft : '#FFF1F2' },
          ]}
        >
          <View style={styles.feedbackRow}>
            <View style={[styles.feedbackIcon, { backgroundColor: feedback.result === 'correct' ? colors.green : colors.rose }]}>
              {feedback.result === 'correct'
                ? <CheckCircle2 size={28} color={colors.white} />
                : <XCircle size={28} color={colors.white} />
              }
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.feedbackTitle, { color: feedback.result === 'correct' ? colors.greenDark : colors.roseDark }]}>
                {feedback.result === 'correct' ? '太棒了！' : '差一点…'}
              </Text>
              {feedback.canonical && (
                <Text style={styles.feedbackCanonical}>
                  正确答案：<Text style={{ fontFamily: fonts.heavy, color: colors.ink }}>{feedback.canonical}</Text>
                </Text>
              )}
            </View>
            <Pressable
              onPress={next}
              style={[
                styles.feedbackBtn,
                { backgroundColor: feedback.result === 'correct' ? colors.green : colors.rose,
                  borderColor: feedback.result === 'correct' ? colors.greenDark : colors.roseDark },
              ]}
            >
              <Text style={styles.feedbackBtnText}>
                {cursor + 1 < total ? '继 续' : '完 成'}
              </Text>
            </Pressable>
          </View>
        </Animated.View>
      ) : (
        <View style={styles.ctaWrap}>
          <Pressable
            onPress={check}
            disabled={!hasAnswer}
            onPressIn={() => setCheckPressed(true)}
            onPressOut={() => setCheckPressed(false)}
            style={[
              styles.ctaBtn,
              checkPressed && styles.ctaBtnPressed,
              !hasAnswer && { opacity: 0.5 },
            ]}
          >
            <Text style={styles.ctaBtnText}>检 查</Text>
          </Pressable>
        </View>
      )}
    </SafeAreaView>
  );
}

/* ─── Sub-components ─── */

function ChoiceBlock({ title, label, options, pick, onPick, disabled }: {
  title: string; label: string; options: string[]; pick: number | null;
  onPick: (i: number) => void; disabled: boolean;
}) {
  return (
    <View style={{ gap: 12 }}>
      <Text style={styles.labelSmall}>{label}</Text>
      <View style={styles.promptCard}>
        <Text style={styles.promptBold}>{title}</Text>
      </View>
      <OptionList options={options} pick={pick} onPick={onPick} disabled={disabled} />
    </View>
  );
}

function OptionList({ options, pick, onPick, disabled }: {
  options: string[]; pick: number | null; onPick: (i: number) => void; disabled: boolean;
}) {
  return (
    <View style={{ gap: 8 }}>
      {options.map((o, i) => {
        const selected = pick === i;
        return (
          <Pressable
            key={i}
            onPress={() => !disabled && onPick(i)}
            style={[styles.optionTile, selected && styles.optionTileActive]}
          >
            <View style={[styles.optionBadge, selected && { backgroundColor: colors.sky, borderColor: colors.sky }]}>
              <Text style={[styles.optionBadgeText, selected && { color: colors.white }]}>{i + 1}</Text>
            </View>
            <Text style={[styles.optionText, selected && { color: colors.skyDark }]}>{o}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

function TextInputBlock({ title, label, text, onText, placeholder, audioUrl, audioUrlSlow, disabled }: {
  title: string; label: string; text: string; onText: (v: string) => void;
  placeholder: string; audioUrl?: string; audioUrlSlow?: string; disabled: boolean;
}) {
  return (
    <View style={{ gap: 12 }}>
      <Text style={styles.labelSmall}>{label}</Text>
      <View style={styles.promptCard}>
        <Text style={styles.promptBold}>{title}</Text>
      </View>
      {audioUrl && (
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <Pressable onPress={() => Linking.openURL(audioUrl)} style={styles.audioBtn}>
            <Volume2 size={20} color={colors.sky} />
            <Text style={styles.audioBtnText}>播放</Text>
          </Pressable>
          {audioUrlSlow && (
            <Pressable onPress={() => Linking.openURL(audioUrlSlow)} style={styles.audioBtn}>
              <Text style={styles.audioBtnText}>🐢 慢速</Text>
            </Pressable>
          )}
        </View>
      )}
      <TextInput
        value={text}
        onChangeText={onText}
        style={styles.textInput}
        placeholder={placeholder}
        placeholderTextColor={colors.inkSoft}
        multiline
        editable={!disabled}
      />
    </View>
  );
}

function WordBankBlock({ source, tokens, picked, onChange, disabled }: {
  source: string; tokens: string[]; picked: number[]; onChange: (n: number[]) => void; disabled: boolean;
}) {
  const remaining = tokens.map((_, i) => i).filter((idx) => !picked.includes(idx));
  return (
    <View style={{ gap: 12 }}>
      <Text style={styles.labelSmall}>排列词语</Text>
      <View style={styles.promptCard}>
        <Text style={styles.promptBold}>{source}</Text>
      </View>
      <View style={styles.answerBank}>
        {picked.length === 0 && <Text style={styles.answerPlaceholder}>点击下方词语组成句子</Text>}
        {picked.map((idx, order) => (
          <Pressable
            key={`${idx}-${order}`}
            onPress={() => !disabled && onChange(picked.filter((_, i) => i !== order))}
            style={[styles.tokenChip, styles.tokenChipPicked]}
          >
            <Text style={[styles.tokenText, { color: colors.skyDark }]}>{tokens[idx]}</Text>
          </Pressable>
        ))}
      </View>
      <View style={styles.tokenPool}>
        {remaining.map((idx) => (
          <Pressable
            key={idx}
            onPress={() => !disabled && onChange([...picked, idx])}
            style={styles.tokenChip}
          >
            <Text style={styles.tokenText}>{tokens[idx]}</Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

function MatchPairsBlock({ left, right, pairs, pickedLeft, onPairs, onPickedLeft, disabled }: {
  left: { id: string; text: string }[]; right: { id: string; text: string }[];
  pairs: Record<string, string>; pickedLeft: string | null;
  onPairs: (p: Record<string, string>) => void; onPickedLeft: (id: string | null) => void; disabled: boolean;
}) {
  const usedRight = new Set(Object.values(pairs));

  function toggleLeft(id: string) {
    if (disabled) return;
    if (pairs[id]) {
      const { [id]: _, ...rest } = pairs;
      onPairs(rest);
      return;
    }
    onPickedLeft(id);
  }

  function pickRight(id: string) {
    if (disabled || !pickedLeft || usedRight.has(id)) return;
    onPairs({ ...pairs, [pickedLeft]: id });
    onPickedLeft(null);
  }

  return (
    <View style={{ gap: 12 }}>
      <Text style={styles.labelSmall}>匹配配对</Text>
      <View style={styles.pairColumns}>
        <View style={styles.pairColumn}>
          {left.map((item) => (
            <Pressable
              key={item.id}
              onPress={() => toggleLeft(item.id)}
              style={[
                styles.optionTile,
                pairs[item.id] && { borderColor: colors.green, backgroundColor: '#F0FFF4' },
                pickedLeft === item.id && { borderColor: colors.gold, backgroundColor: colors.cream },
              ]}
            >
              <Text style={styles.optionText}>{item.text}</Text>
            </Pressable>
          ))}
        </View>
        <View style={styles.pairColumn}>
          {right.map((item) => (
            <Pressable
              key={item.id}
              onPress={() => pickRight(item.id)}
              style={[
                styles.optionTile,
                usedRight.has(item.id) && { borderColor: colors.green, backgroundColor: '#F0FFF4' },
              ]}
            >
              <Text style={styles.optionText}>{item.text}</Text>
            </Pressable>
          ))}
        </View>
      </View>
    </View>
  );
}

function ImageChoiceBlock({ word, options, pick, onPick, audioUrl, disabled }: {
  word: string; options: { id: string; imageUrl: string; label: string }[];
  pick: string | null; onPick: (id: string) => void; audioUrl?: string; disabled: boolean;
}) {
  return (
    <View style={{ gap: 12 }}>
      <Text style={styles.labelSmall}>选择图片</Text>
      <View style={styles.promptCard}>
        <Text style={styles.promptBold}>{word}</Text>
        {audioUrl && (
          <Pressable onPress={() => Linking.openURL(audioUrl)} style={{ marginTop: 8 }}>
            <Volume2 size={20} color={colors.sky} />
          </Pressable>
        )}
      </View>
      <View style={styles.imageGrid}>
        {options.map((option) => {
          const selected = pick === option.id;
          return (
            <Pressable
              key={option.id}
              onPress={() => !disabled && onPick(option.id)}
              style={[styles.imageOption, selected && { borderColor: colors.sky }]}
            >
              <Image source={{ uri: option.imageUrl }} style={styles.image} />
              <Text style={[styles.imageLabel, selected && { backgroundColor: '#EFF6FF', color: colors.skyDark }]}>
                {option.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

function PinyinAssembleBlock({
  pinyin,
  hint,
  structure,
  slots,
  candidates,
  slotFills,
  onSlotFills,
  disabled,
}: {
  pinyin: string;
  hint?: string;
  structure: 'horizontal' | 'vertical';
  slots: { id: string; label?: string }[];
  candidates: string[];
  slotFills: Record<string, string>;
  onSlotFills: (v: Record<string, string>) => void;
  disabled: boolean;
}) {
  const usedComponents = new Set(Object.values(slotFills));
  const allFilled = slots.every((s) => slotFills[s.id]);

  function placeComponent(component: string) {
    if (disabled || usedComponents.has(component)) return;
    const empty = slots.find((s) => !slotFills[s.id]);
    if (!empty) return;
    onSlotFills({ ...slotFills, [empty.id]: component });
  }

  function clearSlot(slotId: string) {
    if (disabled || !slotFills[slotId]) return;
    const { [slotId]: _, ...rest } = slotFills;
    onSlotFills(rest);
  }

  return (
    <View style={{ gap: 12 }}>
      <Text style={styles.labelSmall}>看拼音拼字</Text>

      <View style={[styles.promptCard, { alignItems: 'center' }]}>
        <Text style={styles.assemblePinyin}>{pinyin}</Text>
        {hint ? <Text style={styles.assembleHint}>{hint}</Text> : null}
      </View>

      {/* Structure template */}
      <View style={styles.assembleTemplateWrap}>
        <View
          style={[
            styles.assembleTemplate,
            structure === 'vertical' ? { flexDirection: 'column' } : { flexDirection: 'row' },
          ]}
        >
          {slots.map((slot, i) => {
            const filled = slotFills[slot.id];
            const isLast = i === slots.length - 1;
            return (
              <Pressable
                key={slot.id}
                onPress={() => filled && clearSlot(slot.id)}
                disabled={disabled || !filled}
                style={[
                  styles.assembleSlot,
                  structure === 'vertical'
                    ? !isLast && { borderBottomWidth: 2, borderBottomColor: colors.line, borderStyle: 'dashed' }
                    : !isLast && { borderRightWidth: 2, borderRightColor: colors.line, borderStyle: 'dashed' },
                ]}
              >
                <Text style={filled ? styles.assembleSlotChar : styles.assembleSlotEmpty}>
                  {filled ?? '？'}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      {allFilled && (
        <Text style={styles.assembleReveal}>
          你拼出的字：
          <Text style={styles.assembleRevealChar}>
            {' ' + slots.map((s) => slotFills[s.id]).join('')}
          </Text>
        </Text>
      )}

      {/* Candidates pool */}
      <View style={styles.assemblePool}>
        {candidates.map((c) => {
          const used = usedComponents.has(c);
          return (
            <Pressable
              key={c}
              onPress={() => placeComponent(c)}
              disabled={disabled || used}
              style={[styles.assembleCandidate, used && styles.assembleCandidateUsed]}
            >
              <Text style={[styles.assembleCandidateText, used && { color: colors.inkSoft, opacity: 0.4 }]}>
                {c}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

/* ─── Styles ─── */

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.white },
  loadingText: { fontFamily: fonts.heavy, color: colors.inkSoft, textAlign: 'center', marginTop: 100, fontSize: 16 },

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
  closeBtn: {
    borderRadius: radius.full,
    padding: 6,
  },
  progressBarWrap: {
    flex: 1,
    height: 16,
    borderRadius: radius.full,
    backgroundColor: colors.line,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: radius.full,
    backgroundColor: colors.green,
  },
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

  // Labels & prompts
  labelSmall: {
    fontFamily: fonts.heavy,
    fontSize: 10,
    color: colors.inkSoft,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  promptCard: {
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    borderWidth: 2,
    borderColor: colors.line,
    padding: 16,
  },
  promptBold: { fontFamily: fonts.heavy, fontSize: 20, color: colors.ink },
  giantChar: { fontFamily: fonts.heavy, fontSize: 56, color: colors.ink, textAlign: 'center' },
  mathStatement: { fontFamily: fonts.heavy, fontSize: 36, color: colors.ink, textAlign: 'center' },
  poemContext: { fontFamily: fonts.regular, fontSize: 15, color: colors.inkSoft, lineHeight: 24, marginTop: 8 },

  // Option tiles (3D puffy)
  optionTile: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: radius.lg,
    borderWidth: 2,
    borderBottomWidth: 4,
    borderColor: colors.line,
    backgroundColor: colors.white,
  },
  optionTileActive: {
    borderColor: colors.sky,
    backgroundColor: '#EFF6FF',
  },
  optionBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: colors.line,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionBadgeText: { fontFamily: fonts.heavy, fontSize: 12, color: colors.inkSoft },
  optionText: { fontFamily: fonts.heavy, fontSize: 16, color: colors.ink, flex: 1 },

  // Text input
  textInput: {
    backgroundColor: colors.mist,
    borderRadius: radius.lg,
    borderWidth: 2,
    borderColor: colors.line,
    padding: 14,
    fontSize: 16,
    fontFamily: fonts.sansBold,
    color: colors.ink,
    minHeight: 60,
  },

  // Audio button
  audioBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#EFF6FF',
    borderRadius: radius.lg,
    borderWidth: 2,
    borderColor: colors.sky,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  audioBtnText: { fontFamily: fonts.heavy, fontSize: 14, color: colors.skyDark },

  // Word bank
  answerBank: {
    minHeight: 60,
    borderRadius: radius.lg,
    borderWidth: 2,
    borderColor: colors.line,
    borderStyle: 'dashed',
    backgroundColor: colors.mist,
    padding: 10,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  answerPlaceholder: { fontFamily: fonts.sansBold, color: colors.inkSoft, fontSize: 13 },
  tokenPool: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  tokenChip: {
    borderRadius: radius.md,
    borderWidth: 2,
    borderBottomWidth: 4,
    borderColor: colors.line,
    backgroundColor: colors.white,
    paddingVertical: 8,
    paddingHorizontal: 14,
  },
  tokenChipPicked: { borderColor: colors.sky },
  tokenText: { fontFamily: fonts.heavy, fontSize: 15, color: colors.ink },

  // Pair columns
  pairColumns: { flexDirection: 'row', gap: 10 },
  pairColumn: { flex: 1, gap: 8 },

  // Image grid
  imageGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  imageOption: {
    width: '47%',
    overflow: 'hidden',
    borderRadius: radius.lg,
    borderWidth: 2,
    borderColor: colors.line,
  },
  image: { width: '100%', aspectRatio: 4 / 3, backgroundColor: colors.mist },
  imageLabel: {
    padding: 10,
    fontFamily: fonts.heavy,
    fontSize: 14,
    color: colors.ink,
    textAlign: 'center',
  },

  // CTA button
  ctaWrap: { paddingHorizontal: 16, paddingVertical: 12, borderTopWidth: 2, borderTopColor: colors.line },
  ctaBtn: {
    backgroundColor: colors.green,
    borderRadius: radius.lg,
    borderWidth: 2,
    borderBottomWidth: 4,
    borderColor: colors.greenDark,
    paddingVertical: 14,
    alignItems: 'center',
  },
  ctaBtnPressed: { borderBottomWidth: 2, transform: [{ translateY: 2 }] },
  ctaBtnText: { fontFamily: fonts.heavy, fontSize: 16, color: colors.white, textTransform: 'uppercase', letterSpacing: 0.8 },

  // Feedback drawer
  feedbackDrawer: {
    borderTopWidth: 4,
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  feedbackRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  feedbackIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  feedbackTitle: { fontFamily: fonts.heavy, fontSize: 22 },
  feedbackCanonical: { fontFamily: fonts.sansBold, fontSize: 13, color: colors.inkSoft, marginTop: 4 },
  feedbackBtn: {
    borderRadius: radius.lg,
    borderWidth: 2,
    borderBottomWidth: 4,
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  feedbackBtnText: { fontFamily: fonts.heavy, fontSize: 14, color: colors.white, textTransform: 'uppercase' },

  // Pinyin → character assemble
  assemblePinyin: {
    fontFamily: fonts.heavy,
    fontSize: 36,
    letterSpacing: 2,
    color: colors.skyDark,
    textAlign: 'center',
  },
  assembleHint: {
    fontFamily: fonts.regular,
    fontSize: 14,
    color: colors.inkSoft,
    marginTop: 6,
    textAlign: 'center',
  },
  assembleTemplateWrap: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  assembleTemplate: {
    borderWidth: 3,
    borderColor: colors.line,
    borderStyle: 'dashed',
    borderRadius: radius.lg,
    backgroundColor: colors.mist,
    padding: 8,
  },
  assembleSlot: {
    width: 88,
    height: 88,
    alignItems: 'center',
    justifyContent: 'center',
  },
  assembleSlotChar: { fontFamily: fonts.heavy, fontSize: 48, color: colors.ink },
  assembleSlotEmpty: { fontFamily: fonts.heavy, fontSize: 28, color: colors.inkSoft, opacity: 0.35 },
  assembleReveal: {
    textAlign: 'center',
    fontFamily: fonts.heavy,
    fontSize: 12,
    color: colors.inkSoft,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
  },
  assembleRevealChar: { fontFamily: fonts.heavy, fontSize: 22, color: colors.ink, textTransform: 'none' },
  assemblePool: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 10,
    marginTop: 4,
  },
  assembleCandidate: {
    width: 60,
    height: 60,
    borderRadius: radius.lg,
    borderWidth: 2,
    borderBottomWidth: 4,
    borderColor: colors.line,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  assembleCandidateUsed: {
    backgroundColor: colors.mist,
    borderBottomWidth: 2,
  },
  assembleCandidateText: { fontFamily: fonts.heavy, fontSize: 30, color: colors.ink },
});
