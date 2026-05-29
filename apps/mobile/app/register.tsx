import { useState } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { api } from '../lib/api';
import { useAuthStore } from '../lib/auth-store';
import { colors, fonts, radius } from '../lib/theme';
import { Mascot } from '../components/Mascot';
import { SpeechBubble } from '../components/SpeechBubble';

export default function Register() {
  const router = useRouter();
  const [nickname, setNickname] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const setAuth = useAuthStore((s) => s.setAuth);
  const [loading, setLoading] = useState(false);
  const [pressed, setPressed] = useState(false);

  async function onRegister() {
    if (nickname.trim().length < 2) {
      Alert.alert('注册失败', '昵称至少需要 2 个字符');
      return;
    }
    if (password.length < 8) {
      Alert.alert('注册失败', '密码至少需要 8 位');
      return;
    }
    try {
      setLoading(true);
      const res = await api.register({ email: email.trim(), nickname: nickname.trim(), password });
      setAuth({
        accessToken: res.tokens.accessToken,
        refreshToken: res.tokens.refreshToken,
        user: res.user,
      });
      router.replace('/(tabs)/learn');
    } catch (e: any) {
      Alert.alert('注册失败', e?.body?.message ?? '请重试');
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.mascotRow}>
          <Mascot size={104} mood="cheer" />
          <SpeechBubble>嘿！加入 StudyZone，第一天就能解锁连胜 🔥</SpeechBubble>
        </View>

        <Text style={styles.title}>创建账号</Text>

        <TextInput
          value={nickname}
          onChangeText={setNickname}
          placeholder="昵称"
          autoCapitalize="none"
          maxLength={30}
          style={styles.input}
          placeholderTextColor={colors.inkSoft}
        />
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
          placeholder="密码（至少 8 位）"
          secureTextEntry
          style={styles.input}
          placeholderTextColor={colors.inkSoft}
        />

        <Pressable
          onPress={onRegister}
          disabled={loading}
          onPressIn={() => setPressed(true)}
          onPressOut={() => setPressed(false)}
          style={[
            styles.button,
            pressed && styles.buttonPressed,
            loading && { opacity: 0.5 },
          ]}
        >
          <Text style={styles.buttonText}>{loading ? '注册中…' : '注 册'}</Text>
        </Pressable>

        <Pressable onPress={() => router.replace('/login')}>
          <Text style={styles.link}>已有账号？去登录</Text>
        </Pressable>
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
  link: {
    textAlign: 'center',
    fontSize: 13,
    fontFamily: fonts.heavy,
    color: colors.inkSoft,
    marginTop: 8,
  },
});
