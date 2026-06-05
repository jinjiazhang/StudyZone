import { useEffect, useRef, useState } from 'react';
import { Pressable, Text } from 'react-native';
import { exerciseStyles as s } from './styles';
import { hapticPress } from '@/lib/haptics';
import { useSubmitFooter } from './SubmitFooter';

/**
 * Per-exercise primary "检 查" CTA. Inside the lesson screen it registers into
 * the shared pinned footer (Duolingo keeps the button docked to the bottom);
 * everywhere else it falls back to rendering inline.
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
  const footer = useSubmitFooter();

  // Keep the latest onPress without re-registering the footer every render.
  const onPressRef = useRef(onPress);
  onPressRef.current = onPress;

  useEffect(() => {
    if (!footer) return;
    footer.set({
      label,
      disabled: !!disabled,
      press: () => onPressRef.current(),
    });
    return () => footer.clear();
  }, [footer, label, disabled]);

  // Footer host draws the docked button; nothing to render inline here.
  if (footer) return null;

  return (
    <Pressable
      onPress={() => {
        hapticPress();
        onPress();
      }}
      disabled={disabled}
      onPressIn={() => setPressed(true)}
      onPressOut={() => setPressed(false)}
      style={[
        s.submitBtn,
        pressed && !disabled && s.submitBtnPressed,
        disabled && s.submitBtnDisabled,
      ]}
    >
      <Text style={[s.submitBtnText, disabled && s.submitBtnTextDisabled]}>{label}</Text>
    </Pressable>
  );
}
