import { useMemo, useState } from 'react';
import { Image, ScrollView, Text, View, StyleSheet, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Flame, Gem, Heart, ChevronRight, BookOpen, Repeat } from 'lucide-react-native';
import { pickCurrentCourseBySubject } from '@studyzone/shared-types';
import type { SubjectDto } from '@studyzone/shared-types';
import { api } from '@/lib/api';
import { resolveAssetUrl } from '@/lib/assets';
import { useTabFocusGuard } from '@/lib/use-tab-focus-guard';
import { colors, fonts, radius, withAlpha, SUBJECT_COLORS } from '@/lib/theme';
import { Mascot } from '@/components/Mascot';
import { SpeechBubble } from '@/components/SpeechBubble';
import { StatPill } from '@/components/StatPill';
import { SubjectPickerSheet } from '@/components/SubjectPickerSheet';

/** Short glyph for a subject cover/badge — uses the canonical map, else 1st char. */
function subjectGlyph(code: string, name: string): string {
  return SUBJECT_COLORS[code]?.glyph ?? name.slice(0, 1);
}

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

  // Hero: the first subject the learner is mid-way through ("继续上次").
  const heroGroup = useMemo(
    () => subjectGroups.find((g) => g.current) ?? null,
    [subjectGroups],
  );

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
        {/* Hero: continue last course */}
        {heroGroup?.current ? (
          <Pressable
            style={styles.hero}
            onPress={() => router.push(`/course/${heroGroup.current!.id}`)}
          >
            <View style={styles.heroChips}>
              <View style={styles.heroChip}>
                <Text style={styles.heroChipText}>继续上次</Text>
              </View>
              <View style={[styles.heroChip, { backgroundColor: heroGroup.subject.color }]}>
                <Text style={styles.heroChipText}>{heroGroup.subject.name}</Text>
              </View>
            </View>
            <Text style={styles.heroTitle} numberOfLines={2}>{heroGroup.current.name}</Text>
            <Text style={styles.heroDesc} numberOfLines={1}>咱们继续往前走，冲呀！</Text>
            <View style={styles.heroBtn}>
              <BookOpen size={16} color={colors.greenDark} />
              <Text style={styles.heroBtnText}>继续学习</Text>
            </View>
          </Pressable>
        ) : (
          /* Mascot guidance (no course in progress yet) */
          <View style={styles.mascotRow}>
            <Mascot size={100} mood="cheer" />
            <SpeechBubble>选一门课开始学习吧！同时学多门完全没问题，进度互不影响。</SpeechBubble>
          </View>
        )}

        <Text style={styles.title}>我的课程</Text>

        {subjectGroups.map(({ subject, current }) => {
          const glyph = subjectGlyph(subject.code, subject.name);
          return (
          <View key={subject.id} style={styles.subjectSection}>
            <View style={styles.subjectHeader}>
              <View style={[styles.subjectGlyph, { backgroundColor: withAlpha(subject.color, 0.14) }]}>
                <Text style={[styles.subjectGlyphText, { color: subject.color }]}>{glyph}</Text>
              </View>
              <Text style={styles.subjectName}>{subject.name}</Text>
              <View style={styles.divider} />
            </View>

            {current ? (
              <View style={styles.card}>
                <Pressable
                  style={styles.cardTop}
                  onPress={() => router.push(`/course/${current.id}`)}
                >
                  <View style={[styles.cardCover, { backgroundColor: subject.color }]}>
                    {resolveAssetUrl(current.coverImageUrl) ? (
                      <Image
                        source={{ uri: resolveAssetUrl(current.coverImageUrl) }}
                        style={styles.cardCoverImage}
                      />
                    ) : (
                      <Text style={styles.cardCoverGlyph}>{glyph}</Text>
                    )}
                    <View style={styles.cardCoverBand}>
                      <Text style={styles.cardCoverBandText} numberOfLines={1}>{subject.name}</Text>
                    </View>
                  </View>
                  <View style={styles.cardBody}>
                    <Text style={styles.cardTitle} numberOfLines={1}>{current.name}</Text>
                    <Text style={styles.cardDesc} numberOfLines={2}>{current.description}</Text>
                    <View style={styles.currentBadge}>
                      <View style={[styles.currentDot, { backgroundColor: subject.color }]} />
                      <Text style={styles.currentBadgeText}>正在学习</Text>
                    </View>
                  </View>
                </Pressable>
                <View style={styles.cardFooter}>
                  <Pressable
                    style={styles.footerBtn}
                    onPress={() => router.push(`/course/${current.id}`)}
                  >
                    <Text style={[styles.footerBtnText, { color: subject.color }]}>继续学习</Text>
                    <ChevronRight size={16} color={subject.color} />
                  </Pressable>
                  <View style={styles.footerSep} />
                  <Pressable
                    style={styles.footerBtnNarrow}
                    onPress={() => setPickerSubject(subject)}
                  >
                    <Repeat size={14} color={colors.inkSoft} />
                    <Text style={styles.footerBtnTextMuted}>切换</Text>
                  </Pressable>
                </View>
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
          );
        })}

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

  hero: {
    backgroundColor: colors.green,
    borderRadius: radius.xl,
    borderBottomWidth: 6,
    borderColor: colors.greenDark,
    padding: 18,
    marginBottom: 8,
  },
  heroChips: { flexDirection: 'row', gap: 6, marginBottom: 10 },
  heroChip: {
    backgroundColor: 'rgba(255,255,255,0.22)',
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 999,
  },
  heroChipText: { fontFamily: fonts.heavy, fontSize: 11, color: colors.white },
  heroTitle: { fontFamily: fonts.heavy, fontSize: 21, color: colors.white, lineHeight: 27 },
  heroDesc: { fontFamily: fonts.sansBold, fontSize: 13, color: 'rgba(255,255,255,0.94)', marginTop: 4 },
  heroBtn: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.white,
    borderRadius: radius.md,
    borderBottomWidth: 4,
    borderColor: 'rgba(0,0,0,0.12)',
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginTop: 14,
  },
  heroBtnText: { fontFamily: fonts.heavy, fontSize: 14, color: colors.greenDark },

  subjectSection: { gap: 8, marginBottom: 8 },
  subjectHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  subjectGlyph: {
    width: 26,
    height: 26,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  subjectGlyphText: { fontFamily: fonts.heavy, fontSize: 13 },
  subjectName: { fontFamily: fonts.heavy, fontSize: 15, color: colors.ink },
  divider: { flex: 1, height: 2, backgroundColor: colors.line, borderRadius: 999 },

  card: {
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    borderWidth: 2,
    borderColor: colors.cardLine,
    overflow: 'hidden',
  },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 13,
    gap: 13,
  },
  cardCover: {
    width: 60,
    height: 82,
    borderRadius: radius.md,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'flex-end',
    shadowColor: '#34322E',
    shadowOpacity: 0.14,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  cardCoverGlyph: {
    position: 'absolute',
    top: 11,
    left: 0,
    right: 0,
    textAlign: 'center',
    fontFamily: fonts.heavy,
    fontSize: 25,
    color: colors.white,
  },
  cardCoverBand: {
    width: '100%',
    paddingVertical: 4,
    backgroundColor: 'rgba(0,0,0,0.14)',
  },
  cardCoverBandText: {
    textAlign: 'center',
    fontFamily: fonts.heavy,
    fontSize: 9.5,
    color: 'rgba(255,255,255,0.92)',
  },
  cardCoverEmpty: {
    width: 60,
    height: 82,
    borderRadius: radius.md,
    borderWidth: 2,
    borderStyle: 'dashed',
    backgroundColor: colors.mist,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardCoverImage: { width: '100%', height: '100%', resizeMode: 'cover' },
  cardBody: { flex: 1 },
  cardTitle: { fontFamily: fonts.heavy, fontSize: 15.5, color: colors.ink },
  cardDesc: { fontFamily: fonts.regular, fontSize: 12.5, color: colors.inkSoft, marginTop: 2 },

  currentBadge: {
    marginTop: 8,
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  currentDot: { width: 7, height: 7, borderRadius: 999 },
  currentBadgeText: {
    fontFamily: fonts.heavy,
    fontSize: 11,
    color: colors.inkSoft,
  },
  cardFooter: {
    flexDirection: 'row',
    borderTopWidth: 2,
    borderTopColor: colors.line,
  },
  footerBtn: {
    flex: 1,
    height: 42,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  footerBtnText: { fontFamily: fonts.heavy, fontSize: 13.5 },
  footerSep: { width: 2, backgroundColor: colors.line },
  footerBtnNarrow: {
    width: 96,
    height: 42,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  footerBtnTextMuted: { fontFamily: fonts.heavy, fontSize: 13.5, color: colors.inkSoft },
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
