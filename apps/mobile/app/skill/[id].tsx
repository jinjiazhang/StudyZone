import { useEffect } from 'react';
import { View, Text, Pressable, StyleSheet, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import Constants from 'expo-constants';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function Skill() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const baseUrl =
    (Constants.expoConfig?.extra?.apiUrl as string | undefined) ?? 'http://localhost:4000';

  useEffect(() => {
    (async () => {
      const res = await fetch(`${baseUrl}/api/v1/skills/${id}/first-lesson`);
      const { lessonId } = await res.json();
      router.replace(`/lesson/${lessonId}`);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  return (
    <SafeAreaView style={styles.container}>
      <ActivityIndicator />
      <Text style={{ marginTop: 8, color: '#6B7280' }}>载入关卡…</Text>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F5F7FA' },
});
