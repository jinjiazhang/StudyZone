import { useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';
import Svg, { Line } from 'react-native-svg';
import type { GeometryDrawPrompt } from '@studyzone/shared-types';
import { colors } from '@/lib/theme';
import { exerciseStyles as s } from './styles';
import { SubmitButton } from './SubmitButton';
import { MathShell, mathStyles, parseJsonOrText, type ExerciseProps } from './MathShared';

export function GeometryDrawExercise({
  prompt,
  onSubmit,
  disabled,
}: ExerciseProps<GeometryDrawPrompt, { drawing: unknown }>) {
  const [text, setText] = useState('');
  const [selected, setSelected] = useState<string[]>([]);
  const points = prompt.canvas?.points ?? [];

  if (points.length >= 2) {
    const width = prompt.canvas?.width ?? 320;
    const height = prompt.canvas?.height ?? 200;
    const [from, to] = selected;
    const fromPoint = points.find((point) => point.id === from);
    const toPoint = points.find((point) => point.id === to);
    return (
      <MathShell label="几何作图" title={prompt.instruction}>
        <View style={mathStyles.drawCanvas}>
          {fromPoint && toPoint && (
            <Svg style={mathStyles.drawLineLayer} viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none">
              <Line x1={fromPoint.x} y1={fromPoint.y} x2={toPoint.x} y2={toPoint.y} stroke={colors.sky} strokeWidth={6} strokeLinecap="round" />
            </Svg>
          )}
          {points.map((point) => {
            const active = selected.includes(point.id);
            return (
              <Pressable
                key={point.id}
                disabled={disabled}
                onPress={() => setSelected((current) => nextPointSelection(current, point.id))}
                style={[
                  mathStyles.drawPoint,
                  active && mathStyles.drawPointActive,
                  { left: `${(point.x / width) * 100}%`, top: `${(point.y / height) * 100}%` },
                ]}
              >
                <Text style={[mathStyles.drawPointText, active && mathStyles.drawPointTextActive]}>
                  {point.label ?? point.id}
                </Text>
              </Pressable>
            );
          })}
        </View>
        <SubmitButton
          disabled={selected.length !== 2 || disabled}
          onPress={() => onSubmit({ drawing: { lines: [{ from: selected[0], to: selected[1] }] } })}
        />
      </MathShell>
    );
  }

  return (
    <MathShell label="几何作图" title={prompt.instruction}>
      <TextInput
        value={text}
        onChangeText={setText}
        editable={!disabled}
        multiline
        style={[s.textInput, mathStyles.drawInput]}
        placeholder='输入作图数据，例如 {"lines":[{"from":"A","to":"B"}]}'
        placeholderTextColor={colors.inkSoft}
      />
      <SubmitButton disabled={text.trim() === '' || disabled} onPress={() => onSubmit({ drawing: parseJsonOrText(text) })} />
    </MathShell>
  );
}

function nextPointSelection(current: string[], id: string): string[] {
  if (current.includes(id)) return current.filter((pointId) => pointId !== id);
  if (current.length >= 2) return [current[1]!, id];
  return [...current, id];
}
