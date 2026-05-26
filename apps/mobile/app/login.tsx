import { useState } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { api } from '../lib/api';
import { useAuthStore } from '../lib/auth-store';

export default function Login() {
  const router = useRouter();
  const [email, setEmail] = useState('demo@studyzone.dev');
  const [password, setPassword] = useState('studyzone');
  const setAuth = useAuthStore((s) => s.setAuth);
  const [loading, setLoading] = useState(false);

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
    <View style={styles.container}>
      <Text style={styles.logo}>🦊</Text>
      <Text style={styles.title}>StudyZone</Text>
      <TextInput
        value={email}
        onChangeText={setEmail}
        placeholder="邮箱"
        autoCapitalize="none"
        style={styles.input}
      />
      <TextInput
        value={password}
        onChangeText={setPassword}
        placeholder="密码"
        secureTextEntry
        style={styles.input}
      />
      <Pressable onPress={onLogin} disabled={loading} style={styles.button}>
        <Text style={styles.buttonText}>{loading ? '…' : '登录'}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FA',
    padding: 24,
    paddingTop: 80,
    gap: 12,
  },
  logo: { fontSize: 48, textAlign: 'center' },
  title: {
    fontSize: 28,
    fontWeight: '800',
    textAlign: 'center',
    color: '#3FB984',
    marginBottom: 24,
  },
  input: {
    backgroundColor: 'white',
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    padding: 14,
    fontSize: 16,
  },
  button: {
    backgroundColor: '#3FB984',
    padding: 16,
    borderRadius: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonText: { color: 'white', fontWeight: '800', fontSize: 16 },
});
