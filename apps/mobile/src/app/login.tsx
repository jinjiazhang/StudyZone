import { useState } from 'react';
import { View, Text, Pressable, StyleSheet, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Mail, Lock, Sparkles } from 'lucide-react-native';
import { api } from '@/lib/api';
import { useAuthStore } from '@/lib/auth-store';
import { colors, fonts, radius } from '@/lib/theme';
import { Mascot } from '@/components/Mascot';
import { SpeechBubble } from '@/components/SpeechBubble';
import { AuthField } from '@/components/AuthField';

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

          {/* divider */}
          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>或</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* demo card */}
          <View style={styles.demoCard}>
            <Sparkles size={20} color={colors.greenDark} />
            <Text style={styles.demoText}>体验账号已就绪，直接点“登录”即可逛一圈</Text>
          </View>
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
  buttonPressed: { borderBottomWidth: 2, transform: [{ translateY: 3 }] },
  buttonText: {
    color: colors.white,
    fontFamily: fonts.heavy,
    fontSize: 17,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  divider: { flexDirection: 'row', alignItems: 'center', gap: 12, marginVertical: 20 },
  dividerLine: { flex: 1, height: 2, backgroundColor: colors.line },
  dividerText: { fontFamily: fonts.heavy, fontSize: 12, color: colors.inkFaint },
  demoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: colors.greenTint,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: colors.greenSoft,
    borderRadius: radius.md,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  demoText: { flex: 1, fontFamily: fonts.sansBold, fontSize: 12.5, color: colors.greenDark, lineHeight: 18 },
  bottomText: { textAlign: 'center', fontFamily: fonts.sansBold, fontSize: 14, color: colors.inkSoft },
  bottomLink: { fontFamily: fonts.heavy, color: colors.greenDark },
});
