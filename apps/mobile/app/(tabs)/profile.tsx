import { View, Text, StyleSheet, Pressable, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { api } from '../../lib/api';
import { useAuthStore } from '../../lib/auth-store';

export default function Profile() {
  const router = useRouter();
  const clear = useAuthStore((s) => s.clear);
  const { data: me } = useQuery({ queryKey: ['me'], queryFn: () => api.me() });

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#F5F7FA', padding: 16 }}>
      <View style={styles.card}>
        <Text style={{ fontSize: 48 }}>🦊</Text>
        <Text style={styles.name}>{me?.nickname}</Text>
        <Text style={styles.email}>{me?.email}</Text>
      </View>

      <View style={styles.stats}>
        <Stat label="XP" value={me?.xpTotal ?? 0} />
        <Stat label="连胜" value={me?.currentStreak ?? 0} />
        <Stat label="宝石" value={me?.gems ?? 0} />
        <Stat label="心数" value={me?.hearts ?? 0} />
      </View>

      <Pressable
        onPress={() => {
          clear();
          router.replace('/login');
        }}
        style={styles.logout}
      >
        <Text style={styles.logoutText}>退出登录</Text>
      </Pressable>
    </SafeAreaView>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: 'white', borderRadius: 16, padding: 24, alignItems: 'center' },
  name: { fontSize: 22, fontWeight: '800', marginTop: 8 },
  email: { color: '#6B7280' },
  stats: { flexDirection: 'row', gap: 8, marginTop: 16 },
  stat: {
    flex: 1,
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 12,
    alignItems: 'center',
  },
  statValue: { fontSize: 20, fontWeight: '800' },
  statLabel: { fontSize: 11, color: '#6B7280' },
  logout: {
    marginTop: 32,
    padding: 14,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#F43F5E',
    alignItems: 'center',
  },
  logoutText: { color: '#F43F5E', fontWeight: '800' },
});
