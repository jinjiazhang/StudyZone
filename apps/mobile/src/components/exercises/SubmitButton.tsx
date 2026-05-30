import { useState } from 'react';
import { Pressable, Text } from 'react-native';
import { exerciseStyles as s } from './styles';

/**
 * Per-exercise primary "检 查" CTA. Mirrors the web `btn-primary` button each
 * exercise renders inline at the bottom.
 */
export function SubmitButton({
  onPress,
  disabled,
  label = '检 查',
}: {
  onPress: () => void;
  disabled?: boolean;
  label?: string;
}) {
  const [pressed, setPressed] = useState(false);
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      onPressIn={() => setPressed(true)}
      onPressOut={() => setPressed(false)}
      style={[
        s.submitBtn,
        pressed && !disabled && s.submitBtnPressed,
        disabled && s.submitBtnDisabled,
      ]}
    >
      <Text style={s.submitBtnText}>{label}</Text>
    </Pressable>
  );
}
