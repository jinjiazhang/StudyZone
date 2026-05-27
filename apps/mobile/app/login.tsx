import { useState } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { api } from '../lib/api';
import { useAuthStore } from '../lib/auth-store';
import { colors, fonts, radius } from '../lib/theme';
import { Mascot } from '../components/Mascot';
import { SpeechBubble } from '../components/SpeechBubble';

export default function Login() {
  const router = useRouter();
  const [email, setEmail] = useState('demo@studyzone.dev');
  const [password, setPassword] = useState('studyzone');
  const setAuth = useAuthStore((s) => s.setAuth);
  const [loading, setLoading] = useState(false);
  const [pressed, setPressed] = useState(false);

  async function onLogin() {
    try {
      setLoading(true);
      const res = await api.login({ email, password });
      setAuth({
        accessToken: res.tokens.accessToken,
        refreshToken: res.tokens.refreshToken,
        user: res.user,
      });
      router.replace('/(tabs)/learn');
    } catch (e: any) {
      Alert.alert('登录失败', e?.body?.message ?? '请重试');
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {/* Mascot + Speech bubble */}
        <View style={styles.mascotRow}>
          <Mascot size={104} mood="wink" />
          <SpeechBubble>欢迎回来！准备好继续学习了吗？</SpeechBubble>
        </View>

        <Text style={styles.title}>登录账号</Text>

        <TextInput
          value={email}
          onChangeText={setEmail}
          placeholder="邮箱"
          autoCapitalize="none"
          keyboardType="email-address"
          style={styles.input}
          placeholderTextColor={colors.inkSoft}
        />
        <TextInput
          value={password}
          onChangeText={setPassword}
          placeholder="密码"
          secureTextEntry
          style={styles.input}
          placeholderTextColor={colors.inkSoft}
        />

        {/* 3D puffy login button */}
        <Pressable
          onPress={onLogin}
          disabled={loading}
          onPressIn={() => setPressed(true)}
          onPressOut={() => setPressed(false)}
          style={[
            styles.button,
            pressed && styles.buttonPressed,
            loading && { opacity: 0.5 },
          ]}
        >
          <Text style={styles.buttonText}>{loading ? '登录中…' : '登 录'}</Text>
        </Pressable>

        <Text style={styles.hint}>
          演示账号：demo@studyzone.dev / studyzone
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
  },
  content: {
    flex: 1,
    padding: 24,
    paddingTop: 40,
    gap: 12,
  },
  mascotRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 28,
    fontFamily: fonts.heavy,
    color: colors.ink,
    marginBottom: 8,
  },
  input: {
    backgroundColor: colors.mist,
    borderRadius: radius.lg,
    borderWidth: 2,
    borderColor: colors.line,
    padding: 14,
    fontSize: 16,
    fontFamily: fonts.sansBold,
    color: colors.ink,
  },
  button: {
    backgroundColor: colors.green,
    padding: 16,
    borderRadius: radius.lg,
    borderWidth: 2,
    borderBottomWidth: 4,
    borderColor: colors.greenDark,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonPressed: {
    borderBottomWidth: 2,
    transform: [{ translateY: 2 }],
  },
  buttonText: {
    color: colors.white,
    fontFamily: fonts.heavy,
    fontSize: 16,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  hint: {
    textAlign: 'center',
    fontSize: 12,
    fontFamily: fonts.regular,
    color: colors.inkSoft,
    marginTop: 8,
  },
});
