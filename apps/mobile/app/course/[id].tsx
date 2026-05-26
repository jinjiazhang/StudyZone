import { useEffect } from 'react';
import { ScrollView, View, Text, Pressable, StyleSheet } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery, useMutation } from '@tanstack/react-query';
import { SafeAreaView } from 'react-native-safe-area-context';
import { api } from '../../lib/api';

export default function Course() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  const enroll = useMutation({ mutationFn: () => api.enrollCourse(id!) });
  useEffect(() => {
    if (id) enroll.mutate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const { data: tree } = useQuery({
    queryKey: ['tree', id],
    queryFn: () => api.getCourseTree(id!),
    enabled: !!id,
  });

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#F5F7FA' }}>
      <ScrollView contentContainerStyle={{ padding: 16, gap: 24 }}>
        {tree?.map((unit) => (
          <View key={unit.unitId}>
            <View style={[styles.unitHeader, { backgroundColor: unit.themeColor }]}>
              <Text style={styles.unitSub}>第 {unit.unitOrder + 1} 单元</Text>
              <Text style={styles.unitTitle}>{unit.unitTitle}</Text>
            </View>

            <View style={{ gap: 16, marginTop: 16 }}>
              {unit.skills.map((skill) => (
                <Pressable
                  key={skill.skillId}
                  disabled={!skill.unlocked}
                  onPress={() => router.push(`/skill/${skill.skillId}`)}
                  style={[styles.skill, !skill.unlocked && styles.skillLocked]}
                >
                  <Text style={{ fontSize: 32 }}>{skill.unlocked ? skill.icon : '🔒'}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.skillName}>{skill.name}</Text>
                    {skill.unlocked && (
                      <Text style={styles.skillLevel}>
                        Lv {skill.userLevel} / {skill.maxLevel}
                      </Text>
                    )}
                  </View>
                </Pressable>
              ))}
            </View>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  unitHeader: { borderRadius: 16, padding: 16 },
  unitSub: { color: 'rgba(255,255,255,0.8)', fontSize: 11, textTransform: 'uppercase' },
  unitTitle: { color: 'white', fontWeight: '800', fontSize: 20, marginTop: 4 },
  skill: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  skillLocked: { opacity: 0.5 },
  skillName: { fontWeight: '700', fontSize: 16 },
  skillLevel: { color: '#6B7280', marginTop: 2 },
});
