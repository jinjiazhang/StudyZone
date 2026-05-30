import { useMemo, useState } from 'react';
import { Image, ScrollView, Text, View, StyleSheet, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Flame, Gem, Heart, ChevronRight, BookOpen, Repeat } from 'lucide-react-native';
import { pickCurrentCourseBySubject } from '@studyzone/shared-types';
import type { SubjectDto } from '@studyzone/shared-types';
import { api } from '../../lib/api';
import { resolveAssetUrl } from '../../lib/assets';
import { useTabFocusGuard } from '../../lib/use-tab-focus-guard';
import { colors, fonts, radius } from '../../lib/theme';
import { Mascot } from '../../components/Mascot';
import { SpeechBubble } from '../../components/SpeechBubble';
import { StatPill } from '../../components/StatPill';
import { SubjectPickerSheet } from '../../components/SubjectPickerSheet';

export default function Learn() {
  const router = useRouter();
  useTabFocusGuard([['courses'], ['me'], ['subjects'], ['enrollments']]);

  const { data: courses } = useQuery({ queryKey: ['courses'], queryFn: () => api.listCourses() });
  const { data: subjects } = useQuery({ queryKey: ['subjects'], queryFn: () => api.listSubjects() });
  const { data: enrollments } = useQuery({
    queryKey: ['enrollments'],
    queryFn: () => api.listMyEnrollments(),
  });
  const { data: me } = useQuery({ queryKey: ['me'], queryFn: () => api.me() });

  const [pickerSubject, setPickerSubject] = useState<SubjectDto | null>(null);

  const currentBySubject = useMemo(
    () => pickCurrentCourseBySubject(enrollments ?? [], courses ?? []),
    [enrollments, courses],
  );

  const subjectGroups = useMemo(() => {
    if (!subjects || !courses) return [];
    return subjects
      .map((subject) => ({
        subject,
        subjectCourses: courses.filter((c) => c.subjectId === subject.id),
        current: currentBySubject.get(subject.id),
      }))
      .filter((g) => g.subjectCourses.length > 0);
  }, [subjects, courses, currentBySubject]);

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

        {subjectGroups.map(({ subject, current }) => (
          <View key={subject.id} style={styles.subjectSection}>
            <View style={styles.subjectHeader}>
              <View style={[styles.colorDot, { backgroundColor: subject.color }]} />
              <Text style={styles.subjectName}>{subject.name}</Text>
              <View style={styles.divider} />
            </View>

            {current ? (
              <View style={styles.cardWrap}>
                <Pressable
                  style={styles.card}
                  onPress={() => router.push(`/course/${current.id}`)}
                >
                  <View style={[styles.cardCover, { borderColor: subject.color }]}>
                    {resolveAssetUrl(current.coverImageUrl) ? (
                      <Image
                        source={{ uri: resolveAssetUrl(current.coverImageUrl) }}
                        style={styles.cardCoverImage}
                      />
                    ) : null}
                  </View>
                  <View style={styles.cardBody}>
                    <Text style={styles.cardTitle}>{current.name}</Text>
                    <Text style={styles.cardDesc} numberOfLines={2}>{current.description}</Text>
                    <View style={styles.currentBadge}>
                      <Text style={styles.currentBadgeText}>正在学习</Text>
                    </View>
                  </View>
                  <ChevronRight size={20} color={colors.inkSoft} />
                </Pressable>
                <Pressable
                  style={styles.switchBtn}
                  onPress={() => setPickerSubject(subject)}
                  hitSlop={6}
                >
                  <Repeat size={12} color={colors.inkSoft} />
                  <Text style={styles.switchBtnText}>切换</Text>
                </Pressable>
              </View>
            ) : (
              <Pressable
                style={styles.emptyCardCTA}
                onPress={() => setPickerSubject(subject)}
              >
                <View style={[styles.cardCoverEmpty, { borderColor: subject.color }]}>
                  <BookOpen size={32} color={colors.inkSoft} />
                </View>
                <View style={styles.cardBody}>
                  <Text style={styles.cardTitle}>还没选课本</Text>
                  <Text style={styles.cardDesc} numberOfLines={2}>
                    点击选择一本{subject.name}课本开始学习。
                  </Text>
                  <View style={styles.chooseBadge}>
                    <BookOpen size={12} color={colors.white} />
                    <Text style={styles.chooseBadgeText}>选择课本</Text>
                  </View>
                </View>
              </Pressable>
            )}
          </View>
        ))}

        {subjectGroups.length === 0 && (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyText}>还没有课程，过会儿再来看看。</Text>
          </View>
        )}
      </ScrollView>

      <SubjectPickerSheet
        visible={pickerSubject !== null}
        subject={pickerSubject}
        courses={pickerSubject ? (courses ?? []).filter((c) => c.subjectId === pickerSubject.id) : []}
        currentCourseId={pickerSubject ? currentBySubject.get(pickerSubject.id)?.id : undefined}
        onClose={() => setPickerSubject(null)}
      />
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

  subjectSection: { gap: 8, marginBottom: 8 },
  subjectHeader: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  colorDot: { width: 14, height: 14, borderRadius: 999 },
  subjectName: { fontFamily: fonts.heavy, fontSize: 16, color: colors.ink },
  divider: { flex: 1, height: 2, backgroundColor: colors.line, borderRadius: 999 },

  cardWrap: { position: 'relative' },
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
    borderWidth: 2,
    backgroundColor: colors.white,
    overflow: 'hidden',
  },
  cardCoverEmpty: {
    width: 76,
    height: 104,
    borderRadius: radius.md,
    borderWidth: 2,
    borderStyle: 'dashed',
    backgroundColor: colors.mist,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardCoverImage: { width: '100%', height: '100%', resizeMode: 'contain' },
  cardBody: { flex: 1 },
  cardTitle: { fontFamily: fonts.heavy, fontSize: 16, color: colors.ink },
  cardDesc: { fontFamily: fonts.regular, fontSize: 13, color: colors.inkSoft, marginTop: 2 },

  currentBadge: {
    marginTop: 6,
    alignSelf: 'flex-start',
    backgroundColor: colors.mist,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
  },
  currentBadgeText: {
    fontFamily: fonts.heavy,
    fontSize: 10,
    color: colors.inkSoft,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  chooseBadge: {
    marginTop: 8,
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.green,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  chooseBadgeText: {
    fontFamily: fonts.heavy,
    fontSize: 11,
    color: colors.white,
  },

  switchBtn: {
    position: 'absolute',
    top: 10,
    right: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.white,
    borderWidth: 2,
    borderColor: colors.line,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  switchBtnText: {
    fontFamily: fonts.heavy,
    fontSize: 11,
    color: colors.inkSoft,
  },

  emptyCardCTA: {
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: colors.line,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 14,
  },
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
