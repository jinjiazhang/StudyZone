import { useRef, useState } from 'react';
import { View } from 'react-native';
import type { PinyinToCharacterWritePrompt } from '@studyzone/shared-types';
import { HanziWriterCanvas } from '@/components/HanziWriterCanvas';
import { exerciseStyles as s } from './styles';

/**
 * 看拼音写字 — wraps the shared `HanziWriterCanvas` (which embeds the
 * `hanzi-writer` library inside a WebView) and forwards the result up via
 * `onSubmit`. Behaviour mirrors the web `PinyinToCharacterWrite`:
 *   - Stroke-by-stroke quiz; on completion auto-submits with `completed: true`.
 *   - "写不出来，跳过" surfaces inside HanziWriterCanvas; we treat its `onSkip`
 *     as a manual submission with the canonical mistake budget exceeded.
 *
 * `submittedRef` guards against the Reanimated feedback drawer triggering a
 * re-render that re-fires onComplete.
 */
export function PinyinToCharacterWriteExercise({
  prompt,
  onSubmit,
  disabled,
}: {
  prompt: PinyinToCharacterWritePrompt;
  onSubmit: (payload: {
    character: string;
    mistakes: number;
    completed: boolean;
  }) => void;
  disabled?: boolean;
}) {
  const submittedRef = useRef(false);
  const [completedResult, setCompletedResult] = useState<{
    mistakes: number;
    completed: boolean;
  } | null>(null);

  function reportOnce(result: { mistakes: number; completed: boolean }) {
    if (submittedRef.current) return;
    submittedRef.current = true;
    setCompletedResult(result);
    onSubmit({
      character: prompt.character,
      mistakes: result.mistakes,
      completed: result.completed,
    });
  }

  return (
    <View style={s.container}>
      <HanziWriterCanvas
        character={prompt.character}
        pinyin={prompt.pinyin}
        sentence={prompt.sentence}
        blankPlaceholder={prompt.blankPlaceholder}
        allowedMistakes={prompt.allowedMistakes}
        leniency={prompt.leniency}
        disabled={disabled}
        completedResult={completedResult}
        onComplete={reportOnce}
        onSkip={reportOnce}
      />
    </View>
  );
}
