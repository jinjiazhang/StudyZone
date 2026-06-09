import { Tabs } from 'expo-router';
import { Image, StyleSheet, View, type ImageSourcePropType } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { SvgUri } from 'react-native-svg';

import { colors } from '@/lib/theme';

const LEARN_ICON = require('../../../assets/icons/tab-learn.svg') as ImageSourcePropType;
const LEAGUE_ICON = require('../../../assets/icons/tab-league.svg') as ImageSourcePropType;
const FRIENDS_ICON = require('../../../assets/icons/tab-friends.svg') as ImageSourcePropType;
const PROFILE_ICON = require('../../../assets/icons/tab-profile.svg') as ImageSourcePropType;

function TabIcon({
  accessibilityLabel,
  focused,
  source,
}: {
  accessibilityLabel: string;
  focused: boolean;
  source: ImageSourcePropType;
}) {
  return (
    <View style={[styles.iconFrame, focused && styles.iconFrameActive]}>
      <SvgUri
        accessibilityLabel={accessibilityLabel}
        height={40}
        uri={Image.resolveAssetSource(source).uri}
        width={40}
      />
    </View>
  );
}

export default function TabsLayout() {
  const insets = useSafeAreaInsets();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
        tabBarHideOnKeyboard: true,
        tabBarIconStyle: styles.tabBarIcon,
        tabBarStyle: {
          backgroundColor: colors.white,
          borderTopWidth: 1.5,
          borderTopColor: colors.line,
          height: 64 + insets.bottom,
          paddingBottom: insets.bottom,
          paddingTop: 5,
        },
        tabBarItemStyle: styles.tabBarItem,
      }}
    >
      <Tabs.Screen
        name="learn"
        options={{
          title: '学习',
          tabBarAccessibilityLabel: '学习',
          tabBarIcon: ({ focused }) => (
            <TabIcon accessibilityLabel="学习" focused={focused} source={LEARN_ICON} />
          ),
        }}
      />
      <Tabs.Screen
        name="league"
        options={{
          title: '联赛',
          tabBarAccessibilityLabel: '联赛',
          tabBarIcon: ({ focused }) => (
            <TabIcon accessibilityLabel="联赛" focused={focused} source={LEAGUE_ICON} />
          ),
        }}
      />
      <Tabs.Screen
        name="friends"
        options={{
          title: '关注',
          tabBarAccessibilityLabel: '关注',
          tabBarIcon: ({ focused }) => (
            <TabIcon accessibilityLabel="关注" focused={focused} source={FRIENDS_ICON} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: '我的',
          tabBarAccessibilityLabel: '我的',
          tabBarIcon: ({ focused }) => (
            <TabIcon accessibilityLabel="我的" focused={focused} source={PROFILE_ICON} />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  iconFrame: {
    alignItems: 'center',
    borderColor: 'transparent',
    borderRadius: 14,
    borderWidth: 3,
    height: 54,
    justifyContent: 'center',
    width: 58,
  },
  iconFrameActive: {
    backgroundColor: '#F0FAFF',
    borderColor: '#84D8F7',
  },
  tabBarIcon: {
    height: 54,
    width: 58,
  },
  tabBarItem: {
    alignItems: 'center',
    height: 59,
    justifyContent: 'center',
    padding: 0,
  },
});
