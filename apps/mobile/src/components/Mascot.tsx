import { useEffect } from 'react';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
  withSequence,
  Easing,
} from 'react-native-reanimated';
import Svg, { Rect, Path, Circle, Ellipse, G, Text as SvgText } from 'react-native-svg';

/**
 * StudyZone · 发芽小娃 (Sprout) mascot — flat vector, 6 moods.
 * Ported 1:1 from the design prototype (sz/mascot.jsx).
 */
export type MascotMood = 'happy' | 'cheer' | 'sad' | 'wink' | 'focus' | 'sleep';

const LEAF = '#58CC02';
const LEAF_D = '#46A302';
const SKIN = '#FFF1DF';
const CHEEK = '#FFB3A6';
const EYE = '#3B3733';
const HAIR = '#6B4F39';
const SPROUT_HI = '#7BD93B';
const MOUTH = '#C8412E';
const INK_SOFT = '#7C7A74';

interface MascotProps {
  size?: number;
  mood?: MascotMood;
}

export function Mascot({ size = 96, mood = 'happy' }: MascotProps) {
  const translateY = useSharedValue(0);
  const rotate = useSharedValue(0);
  const scale = useSharedValue(1);

  useEffect(() => {
    translateY.value = 0;
    rotate.value = 0;
    scale.value = 1;

    if (mood === 'cheer') {
      translateY.value = withRepeat(
        withSequence(
          withTiming(-9, { duration: 275, easing: Easing.inOut(Easing.ease) }),
          withTiming(0, { duration: 275, easing: Easing.inOut(Easing.ease) }),
          withTiming(-5, { duration: 275, easing: Easing.inOut(Easing.ease) }),
          withTiming(0, { duration: 275, easing: Easing.inOut(Easing.ease) }),
        ),
        -1,
        false,
      );
      rotate.value = withRepeat(
        withSequence(
          withTiming(2, { duration: 275 }),
          withTiming(-1, { duration: 275 }),
          withTiming(1, { duration: 275 }),
          withTiming(-1, { duration: 275 }),
        ),
        -1,
        false,
      );
    } else if (mood === 'sad') {
      rotate.value = withRepeat(
        withSequence(
          withTiming(-2.5, { duration: 1300, easing: Easing.inOut(Easing.ease) }),
          withTiming(2.5, { duration: 1300, easing: Easing.inOut(Easing.ease) }),
        ),
        -1,
        true,
      );
    } else if (mood === 'sleep') {
      scale.value = withRepeat(
        withSequence(
          withTiming(1.012, { duration: 2000, easing: Easing.inOut(Easing.ease) }),
          withTiming(1, { duration: 2000, easing: Easing.inOut(Easing.ease) }),
        ),
        -1,
        true,
      );
    } else {
      // happy / wink / focus → soft breathe
      translateY.value = withRepeat(
        withSequence(
          withTiming(-3, { duration: 1700, easing: Easing.inOut(Easing.ease) }),
          withTiming(0, { duration: 1700, easing: Easing.inOut(Easing.ease) }),
        ),
        -1,
        true,
      );
      scale.value = withRepeat(
        withSequence(
          withTiming(1.015, { duration: 1700, easing: Easing.inOut(Easing.ease) }),
          withTiming(1, { duration: 1700, easing: Easing.inOut(Easing.ease) }),
        ),
        -1,
        true,
      );
    }
  }, [mood, translateY, rotate, scale]);

  const animStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: translateY.value },
      { rotate: `${rotate.value}deg` },
      { scale: scale.value },
    ],
  }));

  return (
    <Animated.View style={[{ width: size, height: size }, animStyle]}>
      <Svg viewBox="0 0 200 200" width={size} height={size}>
        {/* sprout stem */}
        <Rect x={96} y={30} width={8} height={32} rx={4} fill={LEAF_D} />
        {/* leaves */}
        <Path d="M100 44 C82 40 70 24 76 14 C92 14 104 28 100 44Z" fill={LEAF} />
        <Path d="M100 44 C84 38 76 24 80 17 C90 20 100 32 100 44Z" fill={SPROUT_HI} />
        <Path d="M100 44 C118 40 130 24 124 14 C108 14 96 28 100 44Z" fill={LEAF} />
        <Path d="M100 44 C116 38 124 24 120 17 C110 20 100 32 100 44Z" fill={SPROUT_HI} />

        {/* arms (cheer only) */}
        {mood === 'cheer' && (
          <>
            <G rotation={28} originX={41} originY={112}>
              <Rect x={30} y={92} width={22} height={40} rx={11} fill={LEAF} />
            </G>
            <G rotation={-28} originX={159} originY={112}>
              <Rect x={148} y={92} width={22} height={40} rx={11} fill={LEAF} />
            </G>
          </>
        )}

        {/* hood / body */}
        <Rect x={40} y={58} width={120} height={118} rx={48} fill={LEAF} />
        {/* belly badge Q */}
        <Circle cx={100} cy={160} r={15} fill="#FFE08A" />
        <SvgText x={100} y={167} textAnchor="middle" fontWeight="800" fontSize={17} fill={LEAF_D}>
          Q
        </SvgText>

        {/* face */}
        <Rect x={58} y={70} width={84} height={78} rx={36} fill={SKIN} />
        {/* hair peek */}
        <Path
          d="M70 76 q8 -10 18 -6 q6 -6 14 -2 q9 -5 16 4 q4 8 -2 12 q-23 -8 -46 0 q-4 -4 0 -8z"
          fill={HAIR}
        />
        {/* cheeks */}
        <Circle cx={71} cy={116} r={7.5} fill={CHEEK} opacity={0.85} />
        <Circle cx={129} cy={116} r={7.5} fill={CHEEK} opacity={0.85} />

        <Eyes mood={mood} />
        <Mouth mood={mood} />

        {/* sleep zzz */}
        {mood === 'sleep' && (
          <>
            <SvgText x={150} y={64} fontSize={16} fontWeight="800" fill={INK_SOFT}>z</SvgText>
            <SvgText x={162} y={50} fontSize={20} fontWeight="800" fill={INK_SOFT}>Z</SvgText>
          </>
        )}

        {/* focus brush */}
        {mood === 'focus' && (
          <G rotation={32} originX={153} originY={137}>
            <Rect x={150} y={120} width={6} height={34} rx={3} fill="#C77D2E" />
            <Path d="M150 150 l8 5 l-2 -10z" fill="#34322E" />
          </G>
        )}
      </Svg>
    </Animated.View>
  );
}

function Eyes({ mood }: { mood: MascotMood }) {
  if (mood === 'sleep') {
    return (
      <G stroke={EYE} strokeWidth={3.4} strokeLinecap="round" fill="none">
        <Path d="M74 100 q8 7 16 0" />
        <Path d="M110 100 q8 7 16 0" />
      </G>
    );
  }
  if (mood === 'wink') {
    return (
      <G>
        <Ellipse cx={82} cy={101} rx={6.5} ry={8} fill={EYE} />
        <Circle cx={84.2} cy={98.5} r={2.1} fill="#fff" />
        <Path d="M110 102 q8 6 16 0" stroke={EYE} strokeWidth={3.4} strokeLinecap="round" fill="none" />
      </G>
    );
  }
  if (mood === 'focus') {
    return (
      <G>
        <Rect x={76} y={100} width={13} height={6.5} rx={3.2} fill={EYE} />
        <Rect x={111} y={100} width={13} height={6.5} rx={3.2} fill={EYE} />
      </G>
    );
  }
  if (mood === 'sad') {
    return (
      <G>
        <Ellipse cx={83} cy={103} rx={6} ry={7.5} fill={EYE} />
        <Ellipse cx={117} cy={103} rx={6} ry={7.5} fill={EYE} />
        <Circle cx={85} cy={100.5} r={2} fill="#fff" />
        <Circle cx={119} cy={100.5} r={2} fill="#fff" />
        <Path d="M74 92 q9 -4 17 1" stroke={EYE} strokeWidth={3} strokeLinecap="round" fill="none" />
        <Path d="M126 92 q-9 -4 -17 1" stroke={EYE} strokeWidth={3} strokeLinecap="round" fill="none" />
      </G>
    );
  }
  // happy / cheer
  return (
    <G>
      <Ellipse cx={83} cy={100} rx={7} ry={9} fill={EYE} />
      <Ellipse cx={117} cy={100} rx={7} ry={9} fill={EYE} />
      <Circle cx={85.6} cy={96.8} r={2.4} fill="#fff" />
      <Circle cx={119.6} cy={96.8} r={2.4} fill="#fff" />
    </G>
  );
}

function Mouth({ mood }: { mood: MascotMood }) {
  if (mood === 'cheer') return <Path d="M88 118 q12 16 24 0 q-12 7 -24 0z" fill={MOUTH} />;
  if (mood === 'happy')
    return <Path d="M90 117 q10 11 20 0" stroke={MOUTH} strokeWidth={3.6} fill="none" strokeLinecap="round" />;
  if (mood === 'wink')
    return <Path d="M91 117 q9 9 18 0" stroke={MOUTH} strokeWidth={3.6} fill="none" strokeLinecap="round" />;
  if (mood === 'focus') return <Rect x={93} y={118} width={14} height={4.5} rx={2.2} fill={MOUTH} />;
  if (mood === 'sad')
    return <Path d="M91 122 q9 -8 18 0" stroke={MOUTH} strokeWidth={3.4} fill="none" strokeLinecap="round" />;
  if (mood === 'sleep') return <Ellipse cx={100} cy={119} rx={5} ry={6} fill={MOUTH} />;
  return null;
}
