import { useEffect } from 'react';
import { ScrollView, View, Text, Pressable, StyleSheet } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery, useMutation } from '@tanstack/react-query';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Lock, Star, ChevronLeft } from 'lucide-react-native';
import { api } from '../../lib/api';
import { colors, fonts, radius } from '../../lib/theme';

// Sine wave offsets for skill path (Duolingo-style winding path)
const OFFSET_PATTERN = [-1, 1, 2, 1, -1, -2];
const OFFSET_PX = 36;

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
    <SafeAreaView style={styles.container}>
      {/* Back button */}
      <Pressable onPress={() => router.back()} style={styles.backBtn}>
        <ChevronLeft size={20} color={colors.inkSoft} />
        <Text style={styles.backText}>返回</Text>
      </Pressable>

      <ScrollView contentContainerStyle={styles.scroll}>
        {tree?.map((unit) => (
          <View key={unit.unitId} style={styles.unitBlock}>
            {/* Unit header banner */}
            <View
              style={[
                styles.unitHeader,
                {
                  backgroundColor: unit.themeColor,
                  borderBottomColor: darken(unit.themeColor),
                },
              ]}
            >
              <Text style={styles.unitSub}>第 {unit.unitOrder + 1} 单元</Text>
              <Text style={styles.unitTitle}>{unit.unitTitle}</Text>
            </View>

            {/* Skill path - circular nodes with sine wave offset */}
            <View style={styles.skillPath}>
              {unit.skills.map((skill, idx) => {
                const offset = OFFSET_PATTERN[idx % OFFSET_PATTERN.length] * OFFSET_PX;
                const isLocked = !skill.unlocked;
                const isNext = skill.unlocked && skill.userLevel === 0;
                const isMastered = skill.unlocked && skill.userLevel >= skill.maxLevel;

                return (
                  <View
                    key={skill.skillId}
                    style={[styles.skillNodeWrap, { marginLeft: offset + OFFSET_PX * 2 }]}
                  >
                    <Pressable
                      disabled={isLocked}
                      onPress={() => router.push(`/skill/${skill.skillId}`)}
                      style={[
                        styles.skillNode,
                        isLocked && styles.skillNodeLocked,
                        isNext && styles.skillNodeNext,
                        isMastered && styles.skillNodeMastered,
                      ]}
                    >
                      {isLocked ? (
                        <Lock size={28} color={colors.inkSoft} />
                      ) : isMastered ? (
                        <Star size={28} color={colors.white} fill={colors.white} />
                      ) : (
                        <Text style={styles.skillIcon}>{skill.icon || '📖'}</Text>
                      )}
                    </Pressable>

                    {/* Label below node */}
                    <Text style={[styles.skillName, isLocked && { opacity: 0.4 }]}>
                      {skill.name}
                    </Text>
                    {skill.unlocked && !isNext && (
                      <Text style={styles.skillLevel}>
                        Lv {skill.userLevel} / {skill.maxLevel}
                      </Text>
                    )}
                    {isNext && (
                      <View style={styles.startBadge}>
                        <Text style={styles.startBadgeText}>开始</Text>
                      </View>
                    )}
                  </View>
                );
              })}
            </View>
          </View>
        ))}

        {!tree && (
          <View style={styles.loading}>
            <Text style={styles.loadingText}>加载课程地图中…</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

/** Crude darken for border-bottom (subtract ~30 from each RGB channel) */
function darken(hex: string): string {
  try {
    const r = Math.max(0, parseInt(hex.slice(1, 3), 16) - 40);
    const g = Math.max(0, parseInt(hex.slice(3, 5), 16) - 40);
    const b = Math.max(0, parseInt(hex.slice(5, 7), 16) - 40);
    return `rgb(${r},${g},${b})`;
  } catch {
    return 'rgba(0,0,0,0.15)';
  }
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.white },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  backText: { fontFamily: fonts.heavy, color: colors.inkSoft, fontSize: 14 },
  scroll: { padding: 16, paddingBottom: 48, gap: 32 },
  unitBlock: {},
  unitHeader: {
    borderRadius: radius.lg,
    padding: 16,
    borderBottomWidth: 6,
  },
  unitSub: {
    fontFamily: fonts.heavy,
    fontSize: 10,
    color: 'rgba(255,255,255,0.8)',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  unitTitle: {
    fontFamily: fonts.heavy,
    fontSize: 20,
    color: colors.white,
    marginTop: 4,
  },
  skillPath: {
    alignItems: 'flex-start',
    paddingVertical: 20,
    gap: 24,
  },
  skillNodeWrap: {
    alignItems: 'center',
    gap: 6,
  },
  skillNode: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.white,
    borderWidth: 3,
    borderColor: colors.line,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  skillNodeLocked: {
    backgroundColor: colors.line,
    borderColor: '#D0D0D0',
    opacity: 0.5,
    elevation: 0,
    shadowOpacity: 0,
  },
  skillNodeNext: {
    borderColor: colors.green,
    borderWidth: 4,
    shadowColor: colors.green,
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  skillNodeMastered: {
    backgroundColor: colors.gold,
    borderColor: colors.goldDark,
  },
  skillIcon: { fontSize: 32 },
  skillName: {
    fontFamily: fonts.heavy,
    fontSize: 12,
    color: colors.ink,
    textAlign: 'center',
    maxWidth: 100,
  },
  skillLevel: {
    fontFamily: fonts.sansBold,
    fontSize: 10,
    color: colors.inkSoft,
  },
  startBadge: {
    backgroundColor: colors.green,
    borderRadius: radius.full,
    paddingHorizontal: 12,
    paddingVertical: 3,
  },
  startBadgeText: {
    fontFamily: fonts.heavy,
    fontSize: 11,
    color: colors.white,
    textTransform: 'uppercase',
  },
  loading: { alignItems: 'center', paddingVertical: 40 },
  loadingText: { fontFamily: fonts.heavy, color: colors.inkSoft },
});
