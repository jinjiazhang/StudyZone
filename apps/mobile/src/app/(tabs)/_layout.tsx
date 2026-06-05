import type { ComponentType } from 'react';
import { Tabs } from 'expo-router';
import { View, StyleSheet } from 'react-native';
import { BookOpen, Trophy, Users, User } from 'lucide-react-native';
import { colors, fonts } from '@/lib/theme';

type IconCmp = ComponentType<{ size?: number; color?: string; strokeWidth?: number }>;

/** Active tab icon sits inside a soft green pill (genre convention). */
function TabIcon({ Icon, color, focused }: { Icon: IconCmp; color: string; focused: boolean }) {
  return (
    <View style={[styles.iconPill, focused && styles.iconPillActive]}>
      <Icon size={24} color={color} strokeWidth={focused ? 2.6 : 2.3} />
    </View>
  );
}

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.greenDark,
        tabBarInactiveTintColor: colors.inkFaint,
        tabBarLabelStyle: { fontFamily: fonts.heavy, fontSize: 11, letterSpacing: 0.4 },
        tabBarStyle: {
          backgroundColor: colors.white,
          borderTopWidth: 2,
          borderTopColor: colors.line,
          paddingTop: 6,
        },
        tabBarItemStyle: {
          paddingVertical: 2,
        },
      }}
    >
      <Tabs.Screen
        name="learn"
        options={{
          title: '学习',
          tabBarIcon: ({ color, focused }) => <TabIcon Icon={BookOpen} color={color} focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="league"
        options={{
          title: '联赛',
          tabBarIcon: ({ color, focused }) => <TabIcon Icon={Trophy} color={color} focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="friends"
        options={{
          title: '好友',
          tabBarIcon: ({ color, focused }) => <TabIcon Icon={Users} color={color} focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: '我的',
          tabBarIcon: ({ color, focused }) => <TabIcon Icon={User} color={color} focused={focused} />,
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  iconPill: {
    width: 48,
    height: 30,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconPillActive: {
    backgroundColor: colors.greenTint,
  },
});
