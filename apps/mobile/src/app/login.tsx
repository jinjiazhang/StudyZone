import { useEffect, useState } from 'react';
import { View, Text, Pressable, StyleSheet, Alert } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Mail, Lock } from 'lucide-react-native';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { colors, fonts, radius } from '@/lib/theme';
import { Mascot } from '@/components/Mascot';
import { SpeechBubble } from '@/components/SpeechBubble';
import { AuthField } from '@/components/AuthField';

const LAST_LOGIN_KEY = 'studyzone-last-login';
const DEFAULT_LOGIN = {
  email: 'tiantianzh@qq.com',
  password: '00000000',
};

function normalizeLogin(login?: Partial<typeof DEFAULT_LOGIN>) {
  const email = login?.email || DEFAULT_LOGIN.email;
  const password =
    email === DEFAULT_LOGIN.email
      ? DEFAULT_LOGIN.password
      : (login?.password || DEFAULT_LOGIN.password);

  return { email, password };
}

export default function Login() {
  const router = useRouter();
  const [email, setEmail] = useState(DEFAULT_LOGIN.email);
  const [password, setPassword] = useState(DEFAULT_LOGIN.password);
  const setAuth = useAuth((s) => s.setAuth);
  const [loading, setLoading] = useState(false);
  const [pressed, setPressed] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    async function loadLastLogin() {
      try {
        const raw = await SecureStore.getItemAsync(LAST_LOGIN_KEY);
        if (!raw || !mounted) return;

        const parsed = JSON.parse(raw) as Partial<typeof DEFAULT_LOGIN>;
        const normalized = normalizeLogin(parsed);

        if (normalized.email !== parsed.email || normalized.password !== parsed.password) {
          await SecureStore.setItemAsync(LAST_LOGIN_KEY, JSON.stringify(normalized));
        }

        setEmail(normalized.email);
        setPassword(normalized.password);
      } catch {
        // Keep the default credentials if stored data is unreadable.
      }
    }

    loadLastLogin();

    return () => {
      mounted = false;
    };
  }, []);

  async function onLogin() {
    try {
      setLoading(true);
      setError(null);
      const res = await api.login({ email, password });
      setAuth({
        accessToken: res.tokens.accessToken,
        refreshToken: res.tokens.refreshToken,
        user: res.user,
      });
      await SecureStore.setItemAsync(LAST_LOGIN_KEY, JSON.stringify({ email, password }));
      router.replace('/(tabs)/learn');
    } catch (e: any) {
      setError(e?.body?.message ?? '登录失败，请重试');
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {/* Mascot + Speech bubble */}
        <View style={styles.mascotCol}>
          <Mascot size={104} mood="wink" />
          <View style={styles.bubbleWrap}>
            <SpeechBubble tail="bottom">欢迎回来！咱们继续昨天的进度 👋</SpeechBubble>
          </View>
        </View>

        <View style={styles.form}>
          <AuthField
            label="邮箱"
            icon={Mail}
            placeholder="you@studyzone.cn"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
          />
          <AuthField
            label="密码"
            icon={Lock}
            placeholder="输入密码"
            value={password}
            onChangeText={setPassword}
            secure
          />

          <Pressable onPress={() => Alert.alert('忘记密码', '请联系老师或客服重置密码。')}>
            <Text style={styles.forgot}>忘记密码？</Text>
          </Pressable>

          {error && (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>⚠️ {error}</Text>
            </View>
          )}

          {/* 3D puffy login button */}
          <Pressable
            onPress={onLogin}
            disabled={loading}
            onPressIn={() => setPressed(true)}
            onPressOut={() => setPressed(false)}
            style={[styles.button, pressed && styles.buttonPressed, loading && { opacity: 0.5 }]}
          >
            <Text style={styles.buttonText}>{loading ? '登录中…' : '登 录'}</Text>
          </Pressable>
        </View>

        <Text style={styles.bottomText}>
          还没有账号？
          <Text style={styles.bottomLink} onPress={() => router.replace('/register')}>
            {' '}注册
          </Text>
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.white },
  content: { flex: 1, paddingHorizontal: 26, paddingTop: 16, paddingBottom: 24 },
  mascotCol: { alignItems: 'center', marginTop: 8, marginBottom: 14 },
  bubbleWrap: { marginTop: 10 },
  form: { flex: 1, marginTop: 8 },
  forgot: {
    textAlign: 'right',
    fontFamily: fonts.heavy,
    fontSize: 13,
    color: colors.sky,
    marginTop: 2,
    marginBottom: 18,
  },
  button: {
    backgroundColor: colors.green,
    paddingVertical: 16,
    borderRadius: radius.lg,
    borderWidth: 2,
    borderBottomWidth: 5,
    borderColor: colors.greenDark,
    alignItems: 'center',
  },
  buttonPressed: { borderBottomWidth: 0, transform: [{ translateY: 5 }] },
  errorBox: {
    backgroundColor: '#FFF1F2',
    borderWidth: 2,
    borderColor: colors.rose,
    borderRadius: radius.md,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 14,
  },
  errorText: { fontFamily: fonts.heavy, fontSize: 13, color: colors.roseDark },
  buttonText: {
    color: colors.white,
    fontFamily: fonts.heavy,
    fontSize: 17,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  bottomText: { textAlign: 'center', fontFamily: fonts.sansBold, fontSize: 14, color: colors.inkSoft },
  bottomLink: { fontFamily: fonts.heavy, color: colors.greenDark },
});
