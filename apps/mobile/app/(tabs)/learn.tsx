import { ScrollView, Text, View, StyleSheet, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { SafeAreaView } from 'react-native-safe-area-context';
import { api } from '../../lib/api';

export default function Learn() {
  const router = useRouter();
  const { data: courses } = useQuery({ queryKey: ['courses'], queryFn: () => api.listCourses() });

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#F5F7FA' }}>
      <ScrollView contentContainerStyle={{ padding: 16, gap: 12 }}>
        <Text style={styles.title}>选择课程</Text>
        {courses?.map((c) => (
          <Pressable
            key={c.id}
            onPress={() => router.push(`/course/${c.id}`)}
            style={styles.card}
          >
            <Text style={styles.flag}>{c.flagEmoji || '📘'}</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.cardTitle}>{c.name}</Text>
              <Text style={styles.cardDesc}>{c.description}</Text>
            </View>
          </Pressable>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 22, fontWeight: '800', color: '#1F2937', marginBottom: 8 },
  card: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  flag: { fontSize: 32 },
  cardTitle: { fontWeight: '800', fontSize: 16, color: '#1F2937' },
  cardDesc: { color: '#6B7280', marginTop: 2 },
});
