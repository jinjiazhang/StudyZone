import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { checkSession } from '@/lib/session';
import { useAuth } from '@/lib/auth';
import { colors, fonts } from '@/lib/theme';

export default function Index() {
  const router = useRouter();
  const hydrated = useAuth((s) => s.hydrated);
  const accessToken = useAuth((s) => s.accessToken);
  const [checkFailed, setCheckFailed] = useState(false);

  useEffect(() => {
    if (!hydrated) return;

    let cancelled = false;

    async function verifySession() {
      setCheckFailed(false);

      if (!accessToken) {
        router.replace('/login');
        return;
      }

      try {
        const valid = await checkSession();
        if (cancelled) return;

        router.replace(valid ? '/(tabs)/learn' : '/login');
      } catch {
        if (!cancelled) setCheckFailed(true);
      }
    }

    verifySession();

    return () => {
      cancelled = true;
    };
  }, [accessToken, hydrated, router]);

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color={colors.greenDark} />
      <Text style={styles.text}>{checkFailed ? '登录态校验失败，请检查网络后重试' : '正在确认登录状态…'}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 14,
    backgroundColor: colors.white,
  },
  text: {
    fontFamily: fonts.sansBold,
    fontSize: 14,
    color: colors.inkSoft,
  },
});
