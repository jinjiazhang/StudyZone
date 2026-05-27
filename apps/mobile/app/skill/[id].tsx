import { useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, fonts } from '../../lib/theme';
import { api } from '../../lib/api';
import { useAuthStore } from '../../lib/auth-store';

export default function Skill() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const token = useAuthStore((s) => s.accessToken);

  useEffect(() => {
    if (!id || !token) return;
    (async () => {
      try {
        const { lessonId } = await api.firstLessonOfSkill(id);
        router.replace(`/lesson/${lessonId}`);
      } catch (e) {
        console.error('Failed to load skill lesson', e);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  return (
    <SafeAreaView style={styles.container}>
      <ActivityIndicator size="large" color={colors.green} />
      <Text style={styles.text}>载入关卡…</Text>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.white,
  },
  text: {
    marginTop: 12,
    fontFamily: fonts.heavy,
    color: colors.inkSoft,
    fontSize: 14,
  },
});
