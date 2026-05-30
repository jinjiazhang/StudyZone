import { Image, ScrollView, Text, View, StyleSheet, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Flame, Gem, Heart, ChevronRight } from 'lucide-react-native';
import { api } from '../../lib/api';
import { resolveAssetUrl } from '../../lib/assets';
import { colors, fonts, radius } from '../../lib/theme';
import { Mascot } from '../../components/Mascot';
import { SpeechBubble } from '../../components/SpeechBubble';
import { StatPill } from '../../components/StatPill';

export default function Learn() {
  const router = useRouter();
  const { data: courses } = useQuery({ queryKey: ['courses'], queryFn: () => api.listCourses() });
  const { data: me } = useQuery({ queryKey: ['me'], queryFn: () => api.me() });

  return (
    <SafeAreaView style={styles.container}>
      {/* Top stats bar */}
      <View style={styles.topBar}>
        <View style={styles.logoRow}>
          <Mascot size={36} />
          <Text style={styles.logoText}>StudyZone</Text>
        </View>
        <View style={styles.statsRow}>
          <StatPill icon={<Flame size={18} color={colors.orange} />} value={me?.currentStreak ?? 0} tint="orange" />
          <StatPill icon={<Gem size={18} color={colors.sky} />} value={me?.gems ?? 0} tint="sky" />
          <StatPill icon={<Heart size={18} color={colors.rose} />} value={me?.hearts ?? 0} tint="rose" />
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Mascot guidance */}
        <View style={styles.mascotRow}>
          <Mascot size={100} mood="cheer" />
          <SpeechBubble>选一门课开始学习吧！同时学多门完全没问题，进度互不影响。</SpeechBubble>
        </View>

        <Text style={styles.title}>我的课程</Text>

        {courses?.map((c) => (
          <Pressable
            key={c.id}
            onPress={() => router.push(`/course/${c.id}`)}
            style={styles.card}
          >
            <View style={styles.cardCover}>
              {resolveAssetUrl(c.coverImageUrl) ? (
                <Image
                  source={{ uri: resolveAssetUrl(c.coverImageUrl) }}
                  style={styles.cardCoverImage}
                />
              ) : null}
            </View>
            <View style={styles.cardBody}>
              <Text style={styles.cardTitle}>{c.name}</Text>
              <Text style={styles.cardDesc} numberOfLines={2}>{c.description}</Text>
            </View>
            <ChevronRight size={20} color={colors.inkSoft} />
          </Pressable>
        ))}

        {courses && courses.length === 0 && (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyText}>还没有课程，过会儿再来看看。</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.white },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 2,
    borderBottomColor: colors.line,
    backgroundColor: colors.white,
  },
  logoRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  logoText: { fontFamily: fonts.heavy, fontSize: 20, color: colors.green },
  statsRow: { flexDirection: 'row', gap: 6 },
  scroll: { padding: 16, paddingBottom: 32, gap: 12 },
  mascotRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  title: { fontSize: 22, fontFamily: fonts.heavy, color: colors.ink, marginBottom: 4 },
  card: {
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    borderWidth: 2,
    borderColor: colors.line,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 14,
  },
  cardCover: {
    width: 76,
    height: 104,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.white,
    overflow: 'hidden',
  },
  cardCoverImage: { width: '100%', height: '100%', resizeMode: 'contain' },
  cardBody: { flex: 1 },
  cardTitle: { fontFamily: fonts.heavy, fontSize: 16, color: colors.ink },
  cardDesc: { fontFamily: fonts.regular, fontSize: 13, color: colors.inkSoft, marginTop: 2 },
  emptyCard: {
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    borderWidth: 2,
    borderColor: colors.line,
    padding: 24,
    alignItems: 'center',
  },
  emptyText: { fontFamily: fonts.sansBold, color: colors.inkSoft },
});
