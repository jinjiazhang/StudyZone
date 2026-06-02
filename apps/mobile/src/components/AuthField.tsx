import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  type KeyboardTypeOptions,
} from 'react-native';
import type { ComponentType } from 'react';
import { Eye, EyeOff } from 'lucide-react-native';
import { colors, fonts, radius } from '@/lib/theme';

type IconCmp = ComponentType<{ size?: number; color?: string }>;

interface AuthFieldProps {
  label: string;
  icon: IconCmp;
  placeholder?: string;
  value: string;
  onChangeText: (v: string) => void;
  secure?: boolean;
  keyboardType?: KeyboardTypeOptions;
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  maxLength?: number;
}

export function AuthField({
  label,
  icon: Icon,
  placeholder,
  value,
  onChangeText,
  secure = false,
  keyboardType,
  autoCapitalize = 'none',
  maxLength,
}: AuthFieldProps) {
  const [show, setShow] = useState(false);
  const [focused, setFocused] = useState(false);

  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>{label}</Text>
      <View style={[styles.field, focused && styles.fieldFocused]}>
        <Icon size={20} color={colors.inkFaint} />
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={colors.inkFaint}
          secureTextEntry={secure && !show}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          maxLength={maxLength}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          style={styles.input}
        />
        {secure && (
          <Pressable onPress={() => setShow((s) => !s)} hitSlop={8}>
            {show ? (
              <EyeOff size={19} color={colors.inkFaint} />
            ) : (
              <Eye size={19} color={colors.inkFaint} />
            )}
          </Pressable>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginBottom: 14 },
  label: {
    fontFamily: fonts.sansBold,
    fontSize: 12.5,
    color: colors.inkSoft,
    marginBottom: 7,
    marginLeft: 4,
  },
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    height: 54,
    paddingHorizontal: 14,
    borderRadius: radius.md,
    borderWidth: 2,
    borderColor: colors.line,
    backgroundColor: colors.bgSoft,
  },
  fieldFocused: {
    borderColor: colors.sky,
    backgroundColor: colors.white,
  },
  input: {
    flex: 1,
    fontFamily: fonts.sansBold,
    fontSize: 16,
    color: colors.ink,
    padding: 0,
  },
});
