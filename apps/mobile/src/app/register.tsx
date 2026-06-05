import { useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChevronLeft, User, Mail, Lock } from 'lucide-react-native';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { colors, fonts, radius } from '@/lib/theme';
import { Mascot } from '@/components/Mascot';
import { SpeechBubble } from '@/components/SpeechBubble';
import { AuthField } from '@/components/AuthField';

export default function Register() {
  const router = useRouter();
  const [nickname, setNickname] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const setAuth = useAuth((s) => s.setAuth);
  const [loading, setLoading] = useState(false);
  const [pressed, setPressed] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onRegister() {
    if (nickname.trim().length < 2) {
      setError('昵称至少需要 2 个字符');
      return;
    }
    if (password.length < 8) {
      setError('密码至少需要 8 位');
      return;
    }
    try {
      setLoading(true);
      setError(null);
      const res = await api.register({ email: email.trim(), nickname: nickname.trim(), password });
      setAuth({
        accessToken: res.tokens.accessToken,
        refreshToken: res.tokens.refreshToken,
        user: res.user,
      });
      router.replace('/(tabs)/learn');
    } catch (e: any) {
      setError(e?.body?.message ?? '注册失败，请重试');
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Pressable style={styles.backBtn} onPress={() => router.replace('/login')} hitSlop={8}>
          <ChevronLeft size={20} color={colors.inkSoft} />
          <Text style={styles.backText}>返回</Text>
        </Pressable>

        <View style={styles.mascotCol}>
          <Mascot size={96} mood="cheer" />
          <View style={styles.bubbleWrap}>
            <SpeechBubble tail="bottom">太好啦，咱们一起开始吧！🌱</SpeechBubble>
          </View>
        </View>

        <View style={styles.form}>
          <AuthField
            label="昵称"
            icon={User}
            placeholder="给自己起个名字"
            value={nickname}
            onChangeText={setNickname}
            maxLength={30}
          />
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
            placeholder="至少 8 位"
            value={password}
            onChangeText={setPassword}
            secure
          />

          <Text style={styles.terms}>注册即表示同意《用户协议》与《隐私政策》</Text>

          {error && (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>⚠️ {error}</Text>
            </View>
          )}

          <Pressable
            onPress={onRegister}
            disabled={loading}
            onPressIn={() => setPressed(true)}
            onPressOut={() => setPressed(false)}
            style={[styles.button, pressed && styles.buttonPressed, loading && { opacity: 0.5 }]}
          >
            <Text style={styles.buttonText}>{loading ? '注册中…' : '创建账号'}</Text>
          </Pressable>
        </View>

        <Text style={styles.bottomText}>
          已有账号？
          <Text style={styles.bottomLink} onPress={() => router.replace('/login')}>
            {' '}登录
          </Text>
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.white },
  content: { flex: 1, paddingHorizontal: 26, paddingTop: 8, paddingBottom: 24 },
  backBtn: { flexDirection: 'row', alignItems: 'center', gap: 2, alignSelf: 'flex-start', paddingVertical: 6 },
  backText: { fontFamily: fonts.heavy, fontSize: 14, color: colors.inkSoft },
  mascotCol: { alignItems: 'center', marginBottom: 10 },
  bubbleWrap: { marginTop: 8 },
  form: { flex: 1, marginTop: 12 },
  terms: {
    fontFamily: fonts.sansBold,
    fontSize: 11.5,
    color: colors.inkFaint,
    lineHeight: 17,
    marginVertical: 14,
    marginHorizontal: 4,
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
