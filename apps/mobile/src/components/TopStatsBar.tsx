import type { ReactNode } from 'react';
import {
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
  type ImageSourcePropType,
} from 'react-native';
import { SvgUri } from 'react-native-svg';

import { colors, fonts } from '@/lib/theme';

const STREAK_ICON = require('../../assets/icons/streak.svg') as ImageSourcePropType;
const DIAMOND_ICON = require('../../assets/icons/diamond.svg') as ImageSourcePropType;
const HEART_ICON = require('../../assets/icons/heart.svg') as ImageSourcePropType;

export function LocalSvg({
  height,
  source,
  width,
}: {
  height: number;
  source: ImageSourcePropType;
  width: number;
}) {
  return <SvgUri height={height} uri={Image.resolveAssetSource(source).uri} width={width} />;
}

export function TopStatsBar({
  gems,
  hearts,
  leading,
  leadingAccessibilityLabel,
  loading,
  onLeadingPress,
  streak,
}: {
  gems: number;
  hearts: number;
  leading: ReactNode;
  leadingAccessibilityLabel?: string;
  loading: boolean;
  onLeadingPress?: () => void;
  streak: number;
}) {
  const leadingContent = onLeadingPress ? (
    <Pressable
      accessibilityLabel={leadingAccessibilityLabel}
      accessibilityRole="button"
      hitSlop={8}
      onPress={onLeadingPress}
      style={({ pressed }) => [styles.leading, pressed && styles.pressed]}
    >
      {leading}
    </Pressable>
  ) : (
    <View style={styles.leading}>{leading}</View>
  );

  return (
    <View style={styles.bar}>
      {leadingContent}
      <TopStat
        icon={STREAK_ICON}
        iconHeight={32}
        iconWidth={27}
        loading={loading}
        tint={colors.orange}
        value={streak}
      />
      <TopStat
        icon={DIAMOND_ICON}
        iconHeight={32}
        iconWidth={26}
        loading={loading}
        tint={colors.sky}
        value={gems}
      />
      <TopStat
        icon={HEART_ICON}
        iconHeight={34}
        iconWidth={34}
        loading={loading}
        tint={colors.rose}
        value={hearts}
      />
    </View>
  );
}

function TopStat({
  icon,
  iconHeight,
  iconWidth,
  loading,
  tint,
  value,
}: {
  icon: ImageSourcePropType;
  iconHeight: number;
  iconWidth: number;
  loading: boolean;
  tint: string;
  value: number;
}) {
  return (
    <View style={styles.stat}>
      <LocalSvg height={iconHeight} source={icon} width={iconWidth} />
      <Text style={[styles.value, { color: tint }, loading && styles.valueLoading]}>
        {loading ? '00' : value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    alignItems: 'center',
    backgroundColor: colors.white,
    flexDirection: 'row',
    justifyContent: 'space-around',
    minHeight: 72,
    paddingBottom: 12,
    paddingHorizontal: 16,
    paddingTop: 10,
  },
  leading: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    minHeight: 48,
  },
  stat: {
    alignItems: 'center',
    flex: 1,
    flexDirection: 'row',
    gap: 7,
    justifyContent: 'center',
    minHeight: 48,
  },
  pressed: {
    opacity: 0.65,
  },
  value: {
    fontFamily: fonts.display,
    fontSize: 19,
    lineHeight: 24,
  },
  valueLoading: {
    opacity: 0,
  },
});
