import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { BookOpen, Plus, Search } from 'lucide-react-native';
import type { CourseDto, EnrollmentDto, SubjectDto } from '@studyzone/shared-types';
import { SafeAreaView } from 'react-native-safe-area-context';

import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { Mascot } from '@/components/Mascot';
import { Skeleton } from '@/components/ui/Skeleton';
import { TextbookPickerSheet } from '@/components/TextbookPickerSheet';
import { TopStatsBar } from '@/components/TopStatsBar';
import { api } from '@/lib/api';
import { resolveAssetUrl } from '@/lib/assets';
import { useTabGuard } from '@/lib/guard';
import { colors, fonts, radius, subjectTints } from '@/lib/theme';

interface ShelfBook {
  course: CourseDto;
  enrollment: EnrollmentDto;
  subject: SubjectDto;
}

const SEARCH_REVEAL_HEIGHT = 72;

export default function Learn() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const shelfScrollRef = useRef<ScrollView>(null);
  const searchInitiallyHidden = useRef(false);
  useTabGuard([['courses'], ['me'], ['subjects'], ['enrollments']]);

  const coursesQuery = useQuery({ queryKey: ['courses'], queryFn: () => api.listCourses() });
  const subjectsQuery = useQuery({ queryKey: ['subjects'], queryFn: () => api.listSubjects() });
  const enrollmentsQuery = useQuery({
    queryKey: ['enrollments'],
    queryFn: () => api.listMyEnrollments(),
  });
  const meQuery = useQuery({ queryKey: ['me'], queryFn: () => api.me() });

  const [pickerVisible, setPickerVisible] = useState(false);
  const [search, setSearch] = useState('');
  const [scrollViewportHeight, setScrollViewportHeight] = useState(0);

  useEffect(() => {
    if (scrollViewportHeight === 0 || searchInitiallyHidden.current) return;

    const frame = requestAnimationFrame(() => {
      shelfScrollRef.current?.scrollTo({ y: SEARCH_REVEAL_HEIGHT, animated: false });
      searchInitiallyHidden.current = true;
    });

    return () => cancelAnimationFrame(frame);
  }, [scrollViewportHeight]);

  const courses = coursesQuery.data ?? [];
  const subjects = subjectsQuery.data ?? [];
  const enrollments = enrollmentsQuery.data ?? [];
  const me = meQuery.data;

  const shelfBooks = useMemo(
    () => buildShelfBooks(enrollments, courses, subjects),
    [courses, enrollments, subjects],
  );
  const normalizedSearch = search.trim().toLocaleLowerCase();
  const filteredBooks = useMemo(
    () =>
      normalizedSearch
        ? shelfBooks.filter(({ course, subject }) =>
            `${course.name} ${subject.name}`.toLocaleLowerCase().includes(normalizedSearch),
          )
        : shelfBooks,
    [normalizedSearch, shelfBooks],
  );
  const enrolledCourseIds = useMemo(
    () => new Set(enrollments.map((enrollment) => enrollment.courseId)),
    [enrollments],
  );

  const unenroll = useMutation({
    mutationFn: (courseId: string) => api.unenrollCourse(courseId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['enrollments'] });
    },
    onError: () => {
      Alert.alert('移除失败', '暂时无法移除这本课本，请稍后重试。');
    },
  });

  const contentLoading =
    coursesQuery.isLoading || subjectsQuery.isLoading || enrollmentsQuery.isLoading;
  const contentError = coursesQuery.isError || subjectsQuery.isError || enrollmentsQuery.isError;

  const retryContent = () => {
    coursesQuery.refetch();
    subjectsQuery.refetch();
    enrollmentsQuery.refetch();
  };

  const confirmRemove = (book: ShelfBook) => {
    Alert.alert(
      '移除课本',
      `确定将《${book.course.name}》从书架移除吗？学习进度会保留。`,
      [
        { text: '取消', style: 'cancel' },
        {
          text: '移除',
          style: 'destructive',
          onPress: () => unenroll.mutate(book.course.id),
        },
      ],
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <TopStatsBar
        gems={me?.gems ?? 0}
        hearts={me?.hearts ?? 0}
        leading={<Mascot size={40} />}
        loading={meQuery.isLoading}
        streak={me?.currentStreak ?? 0}
      />

      <ScrollView
        alwaysBounceVertical
        keyboardShouldPersistTaps="handled"
        onContentSizeChange={() => {
          if (searchInitiallyHidden.current || scrollViewportHeight === 0) return;
          shelfScrollRef.current?.scrollTo({ y: SEARCH_REVEAL_HEIGHT, animated: false });
          searchInitiallyHidden.current = true;
        }}
        onLayout={(event) => setScrollViewportHeight(event.nativeEvent.layout.height)}
        ref={shelfScrollRef}
        showsVerticalScrollIndicator={false}
        style={styles.scroll}
      >
        <View style={styles.searchReveal}>
          <View style={styles.searchBox}>
            <Search color={colors.inkFaint} size={20} />
            <TextInput
              clearButtonMode="while-editing"
              onChangeText={setSearch}
              placeholder="搜索课本或学科"
              placeholderTextColor={colors.inkFaint}
              returnKeyType="search"
              style={styles.searchInput}
              value={search}
            />
          </View>
        </View>

        <View style={[styles.shelfContent, { minHeight: scrollViewportHeight }]}>
          {contentLoading ? (
            <ShelfSkeleton />
          ) : contentError ? (
            <ErrorState onRetry={retryContent} />
          ) : shelfBooks.length === 0 ? (
            <EmptyState
              action={<AddTextbookButton onPress={() => setPickerVisible(true)} />}
              description="把正在学习的课本添加到书架，之后可以随时继续。"
              title="书架还是空的"
            />
          ) : (
            <>
              {filteredBooks.length === 0 && (
                <View style={styles.noResults}>
                  <Search color={colors.inkFaint} size={34} />
                  <Text style={styles.noResultsTitle}>没有找到相关课本</Text>
                  <Text style={styles.noResultsText}>试试课本名称或“语文、数学、英语”。</Text>
                </View>
              )}
              <View style={styles.grid}>
                {filteredBooks.map((book) => (
                  <ShelfCard
                    key={book.course.id}
                    book={book}
                    disabled={unenroll.isPending}
                    onLongPress={() => confirmRemove(book)}
                    onPress={() => router.push(`/course/${book.course.id}`)}
                  />
                ))}
                <AddCard onPress={() => setPickerVisible(true)} />
              </View>
            </>
          )}
        </View>
      </ScrollView>

      <TextbookPickerSheet
        courses={courses}
        enrolledCourseIds={enrolledCourseIds}
        onClose={() => setPickerVisible(false)}
        subjects={subjects}
        visible={pickerVisible}
      />
    </SafeAreaView>
  );
}

function buildShelfBooks(
  enrollments: EnrollmentDto[],
  courses: CourseDto[],
  subjects: SubjectDto[],
): ShelfBook[] {
  const courseById = new Map(courses.map((course) => [course.id, course]));
  const subjectById = new Map(subjects.map((subject) => [subject.id, subject]));

  return [...enrollments]
    .sort((a, b) => b.lastActiveAt.localeCompare(a.lastActiveAt))
    .flatMap((enrollment) => {
      const course = courseById.get(enrollment.courseId);
      const subject = subjectById.get(enrollment.subjectId);
      return course && subject ? [{ course, enrollment, subject }] : [];
    });
}

function ShelfCard({
  book,
  disabled,
  onLongPress,
  onPress,
}: {
  book: ShelfBook;
  disabled: boolean;
  onLongPress: () => void;
  onPress: () => void;
}) {
  const coverUrl = resolveAssetUrl(book.course.coverImageUrl);
  const tint = subjectTints(book.subject.color).soft;

  return (
    <Pressable
      delayLongPress={450}
      disabled={disabled}
      onLongPress={onLongPress}
      onPress={onPress}
      style={({ pressed }) => [styles.book, (pressed || disabled) && styles.pressed]}
    >
      <View style={[styles.bookCover, { backgroundColor: tint }]}>
        {coverUrl ? (
          <Image source={{ uri: coverUrl }} style={styles.bookCoverImage} />
        ) : (
          <View style={styles.fallbackCover}>
            <BookOpen color={book.subject.color} size={42} />
            <Text style={[styles.fallbackText, { color: book.subject.color }]}>
              {book.subject.name}
            </Text>
          </View>
        )}
      </View>
      <Text numberOfLines={2} style={styles.bookTitle}>
        {book.course.name}
      </Text>
    </Pressable>
  );
}

function AddCard({ onPress }: { onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.book, pressed && styles.pressed]}>
      <View style={styles.addCover}>
        <View style={styles.addIcon}>
          <Plus color={colors.inkFaint} size={34} strokeWidth={2.5} />
        </View>
        <Text style={styles.addCoverText}>添加课本</Text>
      </View>
    </Pressable>
  );
}

function AddTextbookButton({ onPress }: { onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.emptyButton, pressed && styles.pressed]}>
      <Plus color={colors.white} size={18} strokeWidth={3} />
      <Text style={styles.emptyButtonText}>添加课本</Text>
    </Pressable>
  );
}

function ShelfSkeleton() {
  return (
    <View style={styles.grid}>
      {[0, 1, 2, 3].map((item) => (
        <View key={item} style={styles.book}>
          <Skeleton style={styles.skeletonCover} />
          <Skeleton style={styles.skeletonTitle} />
          <Skeleton style={styles.skeletonSubject} />
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.white,
    flex: 1,
  },
  searchBox: {
    alignItems: 'center',
    backgroundColor: colors.mist,
    borderRadius: radius.full,
    flexDirection: 'row',
    gap: 8,
    minHeight: 46,
    paddingHorizontal: 15,
  },
  searchReveal: {
    backgroundColor: colors.white,
    height: SEARCH_REVEAL_HEIGHT,
    justifyContent: 'center',
    paddingHorizontal: 18,
  },
  searchInput: {
    color: colors.ink,
    flex: 1,
    fontFamily: fonts.sansBold,
    fontSize: 15,
    paddingVertical: 0,
  },
  scroll: {
    backgroundColor: colors.white,
  },
  shelfContent: {
    backgroundColor: colors.white,
    flexGrow: 1,
    padding: 18,
    paddingBottom: 40,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 26,
  },
  book: {
    width: '47.5%',
  },
  bookCover: {
    aspectRatio: 0.76,
    backgroundColor: colors.white,
    borderColor: colors.line,
    borderRadius: radius.sm,
    borderWidth: 1,
    overflow: 'hidden',
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
  },
  bookCoverImage: {
    backgroundColor: colors.white,
    height: '100%',
    resizeMode: 'contain',
    width: '100%',
  },
  fallbackCover: {
    alignItems: 'center',
    flex: 1,
    gap: 10,
    justifyContent: 'center',
    padding: 16,
  },
  fallbackText: {
    fontFamily: fonts.heavy,
    fontSize: 18,
  },
  bookTitle: {
    color: colors.ink,
    fontFamily: fonts.heavy,
    fontSize: 15,
    lineHeight: 19,
    marginTop: 9,
    minHeight: 38,
  },
  addCover: {
    alignItems: 'center',
    aspectRatio: 0.76,
    backgroundColor: colors.white,
    borderColor: colors.line,
    borderRadius: radius.sm,
    borderStyle: 'dashed',
    borderWidth: 2,
    gap: 12,
    justifyContent: 'center',
  },
  addIcon: {
    alignItems: 'center',
    borderColor: colors.line,
    borderRadius: radius.full,
    borderWidth: 2,
    height: 64,
    justifyContent: 'center',
    width: 64,
  },
  addCoverText: {
    color: colors.inkSoft,
    fontFamily: fonts.heavy,
    fontSize: 14,
  },
  noResults: {
    alignItems: 'center',
    gap: 6,
    paddingBottom: 24,
    paddingTop: 12,
  },
  noResultsTitle: {
    color: colors.ink,
    fontFamily: fonts.heavy,
    fontSize: 17,
  },
  noResultsText: {
    color: colors.inkSoft,
    fontFamily: fonts.sansBold,
    fontSize: 13,
    textAlign: 'center',
  },
  emptyButton: {
    alignItems: 'center',
    backgroundColor: colors.green,
    borderBottomColor: colors.greenDark,
    borderBottomWidth: 4,
    borderRadius: radius.md,
    flexDirection: 'row',
    gap: 6,
    paddingHorizontal: 18,
    paddingVertical: 10,
  },
  emptyButtonText: {
    color: colors.white,
    fontFamily: fonts.heavy,
    fontSize: 14,
  },
  pressed: {
    opacity: 0.65,
  },
  skeletonCover: {
    aspectRatio: 0.76,
    borderRadius: radius.sm,
    width: '100%',
  },
  skeletonTitle: {
    height: 17,
    marginTop: 9,
    width: '88%',
  },
  skeletonSubject: {
    height: 12,
    marginTop: 7,
    width: '40%',
  },
});
