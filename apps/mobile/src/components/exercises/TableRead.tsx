import { useState } from 'react';
import { ScrollView, Text, TextInput, View } from 'react-native';
import type { TableReadPrompt } from '@studyzone/shared-types';
import { colors } from '@/lib/theme';
import { exerciseStyles as s } from './styles';
import { SubmitButton } from './SubmitButton';
import { MathShell, mathStyles, type ExerciseProps } from './MathShared';

export function TableReadExercise({
  prompt,
  onSubmit,
  disabled,
}: ExerciseProps<TableReadPrompt, { accepted: string[]; value?: number }>) {
  const [text, setText] = useState('');
  const numeric = Number(text);
  return (
    <MathShell label="读表" title={prompt.question}>
      <ScrollView horizontal style={mathStyles.tableScroll}>
        <View style={mathStyles.table}>
          <View style={[mathStyles.tableRow, mathStyles.tableHead]}>
            {prompt.columns.map((column) => <Text key={column} style={mathStyles.tableCell}>{column}</Text>)}
          </View>
          {prompt.rows.map((row, rowIndex) => (
            <View key={rowIndex} style={mathStyles.tableRow}>
              {prompt.columns.map((column) => <Text key={column} style={mathStyles.tableCell}>{String(row[column] ?? '')}</Text>)}
            </View>
          ))}
        </View>
      </ScrollView>
      <TextInput
        value={text}
        onChangeText={setText}
        editable={!disabled}
        style={[s.textInput, mathStyles.centerInput]}
        placeholder="输入答案"
        placeholderTextColor={colors.inkSoft}
      />
      <SubmitButton
        disabled={text.trim() === '' || disabled}
        onPress={() => onSubmit({ accepted: [text], value: Number.isFinite(numeric) ? numeric : undefined })}
      />
    </MathShell>
  );
}
