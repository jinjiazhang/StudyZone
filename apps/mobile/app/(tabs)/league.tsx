import { View, Text, StyleSheet, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../lib/api';

export default function League() {
  const { data } = useQuery({ queryKey: ['league'], queryFn: () => api.myLeague() });

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#F5F7FA' }}>
      <Text style={styles.title}>🏆 {data?.tier ?? 'bronze'} 联赛</Text>
      <FlatList
        data={data?.entries ?? []}
        keyExtractor={(e) => e.user.id}
        contentContainerStyle={{ padding: 16, gap: 8 }}
        renderItem={({ item }) => (
          <View style={styles.row}>
            <Text style={styles.rank}>{item.rank}</Text>
            <Text style={styles.name}>{item.user.nickname}</Text>
            <Text style={styles.xp}>{item.weeklyXp} XP</Text>
          </View>
        )}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={{ color: '#6B7280' }}>本周还没有排名记录</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 22, fontWeight: '800', padding: 16, color: '#1F2937' },
  row: {
    backgroundColor: 'white',
    flexDirection: 'row',
    padding: 14,
    borderRadius: 12,
    gap: 12,
    alignItems: 'center',
  },
  rank: { width: 28, textAlign: 'center', fontWeight: '800', color: '#9CA3AF' },
  name: { flex: 1, fontWeight: '700' },
  xp: { color: '#3FB984', fontWeight: '800' },
  empty: { padding: 32, alignItems: 'center' },
});
