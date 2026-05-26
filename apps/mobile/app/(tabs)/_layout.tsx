import { Tabs } from 'expo-router';

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#3FB984',
        tabBarLabelStyle: { fontWeight: '700' },
      }}
    >
      <Tabs.Screen name="learn" options={{ title: '学习' }} />
      <Tabs.Screen name="league" options={{ title: '联赛' }} />
      <Tabs.Screen name="profile" options={{ title: '我' }} />
    </Tabs>
  );
}
