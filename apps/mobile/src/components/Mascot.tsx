import React from 'react';
import { Image, type ImageSourcePropType, StyleSheet, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
  withSequence,
  Easing,
} from 'react-native-reanimated';
import { useEffect } from 'react';

export type MascotMood = 'happy' | 'cheer' | 'sad' | 'wink';

const moodAssets: Record<MascotMood, ImageSourcePropType> = {
  happy: require('../../assets/mascot/mascot-idle.png'),
  wink: require('../../assets/mascot/mascot-wave.png'),
  sad: require('../../assets/mascot/mascot-thinking.png'),
  cheer: require('../../assets/mascot/mascot-celebrate.png'),
};

interface MascotProps {
  size?: number;
  mood?: MascotMood;
}

export function Mascot({ size = 96, mood = 'happy' }: MascotProps) {
  const translateY = useSharedValue(0);

  useEffect(() => {
    if (mood === 'happy') {
      translateY.value = withRepeat(
        withSequence(
          withTiming(-4, { duration: 1400, easing: Easing.inOut(Easing.ease) }),
          withTiming(0, { duration: 1400, easing: Easing.inOut(Easing.ease) }),
        ),
        -1,
        true,
      );
    } else if (mood === 'cheer') {
      translateY.value = withRepeat(
        withSequence(
          withTiming(-10, { duration: 400, easing: Easing.out(Easing.cubic) }),
          withTiming(2, { duration: 250, easing: Easing.in(Easing.cubic) }),
          withTiming(0, { duration: 250, easing: Easing.out(Easing.cubic) }),
        ),
        -1,
        false,
      );
    } else if (mood === 'wink') {
      translateY.value = withRepeat(
        withSequence(
          withTiming(-3, { duration: 550, easing: Easing.inOut(Easing.ease) }),
          withTiming(0, { duration: 550, easing: Easing.inOut(Easing.ease) }),
        ),
        -1,
        true,
      );
    } else {
      // sad / thinking – gentle sway
      translateY.value = withRepeat(
        withSequence(
          withTiming(-2, { duration: 1200, easing: Easing.inOut(Easing.ease) }),
          withTiming(0, { duration: 1200, easing: Easing.inOut(Easing.ease) }),
        ),
        -1,
        true,
      );
    }
  }, [mood, translateY]);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  return (
    <Animated.View style={[{ width: size, height: size }, animStyle]}>
      <Image source={moodAssets[mood]} style={{ width: size, height: size }} resizeMode="contain" />
    </Animated.View>
  );
}
