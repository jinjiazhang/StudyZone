import { useMemo, useState } from 'react';
import { Image, ScrollView, Text, View, StyleSheet, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Flame, Gem, Heart, BookOpen, Repeat } from 'lucide-react-native';
import { pickCurrentCourseBySubject } from '@studyzone/shared-types';
import type { SubjectDto } from '@studyzone/shared-types';
import { api } from '@/lib/api';
import { resolveAssetUrl } from '@/lib/assets';
import { useTabGuard } from '@/lib/guard';
import { colors, fonts, radius, subjectTints, SUBJECT_COLORS } from '@/lib/theme';
import { Mascot } from '@/components/Mascot';
import { SpeechBubble } from '@/components/SpeechBubble';
import { StatPill } from '@/components/StatPill';
import { SubjectPickerSheet } from '@/components/SubjectPickerSheet';
import { Skeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';

/** Short glyph for a subject cover/badge — uses the canonical map, else 1st char. */
function subjectGlyph(code: string, name: string): string {
  return SUBJECT_COLORS[code]?.glyph ?? name.slice(0, 1);
}

export default function Learn() {
  const router = useRouter();
  useTabGuard([['courses'], ['me'], ['subjects'], ['enrollments']]);

  const coursesQuery = useQuery({ queryKey: ['courses'], queryFn: () => api.listCourses() });
  const subjectsQuery = useQuery({
    queryKey: ['subjects'],
    queryFn: () => api.listSubjects(),
  });
  const enrollmentsQuery = useQuery({
    queryKey: ['enrollments'],
    queryFn: () => api.listMyEnrollments(),
  });
  const meQuery = useQuery({ queryKey: ['me'], queryFn: () => api.me() });
  const me = meQuery.data;

  const courses = coursesQuery.data;
  const subjects = subjectsQuery.data;
  const enrollments = enrollmentsQuery.data;

  const contentLoading =
    coursesQuery.isLoading || subjectsQuery.isLoading || enrollmentsQuery.isLoading;
  const contentError = coursesQuery.isError || subjectsQuery.isError || enrollmentsQuery.isError;
  const retryContent = () => {
    coursesQuery.refetch();
    subjectsQuery.refetch();
    enrollmentsQuery.refetch();
  };

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
  const heroGroup = useMemo(() => subjectGroups.find((g) => g.current) ?? null, [subjectGroups]);

  return (
    <SafeAreaView style={styles.container}>
      {/* Top stats bar */}
      <View style={styles.topBar}>
        <View style={styles.logoRow}>
          <Mascot size={36} />
          <Text style={styles.logoText}>StudyZone</Text>
        </View>
        <View style={styles.statsRow}>
          {meQuery.isLoading ? (
            <>
              <Skeleton style={styles.statSkeleton} />
              <Skeleton style={styles.statSkeleton} />
              <Skeleton style={styles.statSkeleton} />
            </>
          ) : (
            <>
              <StatPill
                icon={<Flame size={18} color={colors.orange} />}
                value={me?.currentStreak ?? 0}
                tint="orange"
              />
              <StatPill icon={<Gem size={18} color={colors.sky} />} value={me?.gems ?? 0} tint="sky" />
              <StatPill
                icon={<Heart size={18} color={colors.rose} />}
                value={me?.hearts ?? 0}
                tint="rose"
              />
            </>
          )}
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        {contentLoading ? (
          <LearnSkeleton />
        ) : contentError ? (
          <ErrorState onRetry={retryContent} />
        ) : (
          <>
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
            <Text style={styles.heroTitle} numberOfLines={2}>
              {heroGroup.current.name}
            </Text>
            <Text style={styles.heroDesc} numberOfLines={1}>
              咱们继续往前走，冲呀！
            </Text>
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

        {subjectGroups.map(({ subject, current }) => {
          const glyph = subjectGlyph(subject.code, subject.name);
          const tints = subjectTints(subject.color);
          return (
            <View key={subject.id} style={styles.subjectSection}>
              <View style={styles.subjectHeader}>
                <View style={[styles.subjectGlyph, { backgroundColor: tints.soft }]}>
                  <Text style={[styles.subjectGlyphText, { color: subject.color }]}>{glyph}</Text>
                </View>
                <Text style={styles.subjectName}>{subject.name}</Text>
                <View style={styles.divider} />
              </View>

              {current ? (
                <View style={styles.card}>
                  <Pressable
                    style={styles.switchBtn}
                    onPress={() => setPickerSubject(subject)}
                    hitSlop={10}
                  >
                    <Repeat size={18} color={colors.inkSoft} />
                  </Pressable>
                  <Pressable
                    style={styles.cardTop}
                    onPress={() => router.push(`/course/${current.id}`)}
                  >
                    <View style={[styles.cardCoverFrame, { borderColor: subject.color }]}>
                      <View style={[styles.cardCover, { backgroundColor: tints.soft }]}>
                        {resolveAssetUrl(current.coverImageUrl) ? (
                          <Image
                            source={{ uri: resolveAssetUrl(current.coverImageUrl) }}
                            style={styles.cardCoverImage}
                          />
                        ) : (
                          <Text style={[styles.cardCoverGlyph, { color: subject.color }]}>
                            {glyph}
                          </Text>
                        )}
                      </View>
                    </View>
                    <View style={styles.cardBody}>
                      <View style={styles.cardTitleRow}>
                        <Text style={styles.cardTitle} numberOfLines={2}>
                          {current.name}
                        </Text>
                      </View>
                      <Text style={styles.cardDesc} numberOfLines={2}>
                        {current.description}
                      </Text>
                    </View>
                  </Pressable>
                </View>
              ) : (
                <Pressable style={styles.emptyCardCTA} onPress={() => setPickerSubject(subject)}>
                  <View
                    style={[
                      styles.cardCoverEmpty,
                      { borderColor: subject.color, backgroundColor: tints.soft },
                    ]}
                  >
                    <BookOpen size={34} color={subject.color} />
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
          <EmptyState title="还没有课程" description="课程正在路上，过会儿再来看看吧。" />
        )}
          </>
        )}
      </ScrollView>

      <SubjectPickerSheet
        visible={pickerSubject !== null}
        subject={pickerSubject}
        courses={
          pickerSubject ? (courses ?? []).filter((c) => c.subjectId === pickerSubject.id) : []
        }
        currentCourseId={pickerSubject ? currentBySubject.get(pickerSubject.id)?.id : undefined}
        onClose={() => setPickerSubject(null)}
      />
    </SafeAreaView>
  );
}

function LearnSkeleton() {
  return (
    <>
      <Skeleton style={{ height: 150, borderRadius: radius.xl }} />
      {[0, 1].map((i) => (
        <View key={i} style={{ gap: 10 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 9 }}>
            <Skeleton style={{ width: 26, height: 26, borderRadius: 8 }} />
            <Skeleton style={{ width: 80, height: 18 }} />
            <View style={{ flex: 1, height: 2, backgroundColor: colors.line }} />
          </View>
          <View
            style={{
              flexDirection: 'row',
              gap: 15,
              backgroundColor: colors.white,
              borderWidth: 2,
              borderColor: colors.cardLine,
              borderRadius: radius.xl,
              padding: 16,
            }}
          >
            <Skeleton style={{ width: 98, height: 126, borderRadius: radius.md }} />
            <View style={{ flex: 1, justifyContent: 'center', gap: 8 }}>
              <Skeleton style={{ height: 18, width: '70%' }} />
              <Skeleton style={{ height: 14, width: '90%' }} />
              <Skeleton style={{ height: 14, width: '55%' }} />
            </View>
          </View>
        </View>
      ))}
    </>
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
  logoText: { fontFamily: fonts.display, fontSize: 22, color: colors.green },
  statsRow: { flexDirection: 'row', gap: 6 },
  statSkeleton: { width: 44, height: 24, borderRadius: 999 },
  scroll: { padding: 16, paddingBottom: 34, gap: 18 },
  mascotRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
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
  heroDesc: {
    fontFamily: fonts.sansBold,
    fontSize: 13,
    color: 'rgba(255,255,255,0.94)',
    marginTop: 4,
  },
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

  subjectSection: { gap: 10 },
  subjectHeader: { flexDirection: 'row', alignItems: 'center', gap: 9 },
  subjectGlyph: {
    width: 26,
    height: 26,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  subjectGlyphText: { fontFamily: fonts.heavy, fontSize: 13 },
  subjectName: { fontFamily: fonts.heavy, fontSize: 18, color: colors.ink },
  divider: { flex: 1, height: 2, backgroundColor: colors.line, borderRadius: 999 },

  card: {
    position: 'relative',
    backgroundColor: colors.white,
    borderRadius: radius.xl,
    borderWidth: 2,
    borderBottomWidth: 6,
    borderColor: colors.cardLine,
    shadowColor: '#34322E',
    shadowOpacity: 0.05,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 5 },
    elevation: 2,
  },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 15,
  },
  switchBtn: {
    position: 'absolute',
    right: 12,
    top: 12,
    zIndex: 2,
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.white,
    borderRadius: radius.full,
    borderWidth: 2,
    borderBottomWidth: 3,
    borderColor: colors.line,
  },
  cardCoverFrame: {
    width: 98,
    height: 126,
    borderRadius: radius.md,
    borderWidth: 2,
    backgroundColor: colors.white,
    padding: 4,
    shadowColor: '#34322E',
    shadowOpacity: 0.12,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 5 },
    elevation: 3,
  },
  cardCover: {
    flex: 1,
    borderRadius: radius.sm,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardCoverGlyph: {
    textAlign: 'center',
    fontFamily: fonts.heavy,
    fontSize: 34,
  },
  cardCoverEmpty: {
    width: 98,
    height: 126,
    borderRadius: radius.md,
    borderWidth: 2,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardCoverImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'contain',
    backgroundColor: colors.white,
  },
  cardBody: { flex: 1, minHeight: 126, justifyContent: 'center', paddingRight: 2 },
  cardTitleRow: { paddingRight: 58 },
  cardTitle: { fontFamily: fonts.heavy, fontSize: 17, lineHeight: 22, color: colors.ink },
  cardDesc: {
    fontFamily: fonts.sansBold,
    fontSize: 13,
    lineHeight: 18,
    color: colors.inkSoft,
    marginTop: 4,
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

  emptyCardCTA: {
    backgroundColor: colors.white,
    borderRadius: radius.xl,
    borderWidth: 2,
    borderBottomWidth: 6,
    borderStyle: 'dashed',
    borderColor: colors.line,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 15,
  },
});
