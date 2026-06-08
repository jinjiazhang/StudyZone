import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import type { UserPublic } from '@studyzone/shared-types';
import { avatarColor, avatarInitial } from '@studyzone/shared-logic';

import { colors, fonts } from '@/lib/theme';

type AvatarUser = Pick<UserPublic, 'id' | 'nickname' | 'avatarUrl'>;

export function Avatar({
  user,
  size = 40,
  onPress,
}: {
  user: AvatarUser;
  size?: number;
  onPress?: () => void;
}) {
  const circle = { width: size, height: size, borderRadius: size / 2 };

  const content = user.avatarUrl ? (
    <Image
      source={{ uri: user.avatarUrl }}
      style={[circle, styles.image]}
      resizeMode="cover"
    />
  ) : (
    <View style={[circle, styles.fallback, { backgroundColor: avatarColor(user.id) }]}>
      <Text style={[styles.initial, { fontSize: size * 0.5 }]}>{avatarInitial(user.nickname)}</Text>
    </View>
  );

  if (onPress) {
    return (
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`查看 ${user.nickname} 的资料`}
        hitSlop={6}
        onPress={onPress}
        style={({ pressed }) => pressed && styles.pressed}
      >
        {content}
      </Pressable>
    );
  }

  return content;
}

const styles = StyleSheet.create({
  image: {
    backgroundColor: colors.mist,
  },
  fallback: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  initial: {
    color: colors.white,
    fontFamily: fonts.heavy,
  },
  pressed: {
    opacity: 0.65,
  },
});
