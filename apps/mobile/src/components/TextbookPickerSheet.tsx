import { Alert, Image, Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { BookOpen, X } from 'lucide-react-native';
import type { CourseDto, SubjectDto } from '@studyzone/shared-types';

import { resolveAssetUrl } from '@/lib/assets';
import { api } from '@/lib/api';
import { colors, fonts, radius, subjectTints } from '@/lib/theme';

export function TextbookPickerSheet({
  courses,
  enrolledCourseIds,
  onClose,
  subjects,
  visible,
}: {
  courses: CourseDto[];
  enrolledCourseIds: Set<string>;
  onClose: () => void;
  subjects: SubjectDto[];
  visible: boolean;
}) {
  const queryClient = useQueryClient();
  const availableCourses = courses.filter((course) => !enrolledCourseIds.has(course.id));

  const enroll = useMutation({
    mutationFn: (courseId: string) => api.enrollCourse(courseId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['enrollments'] });
      onClose();
    },
    onError: () => {
      Alert.alert('添加失败', '暂时无法添加这本课本，请稍后重试。');
    },
  });

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={(event) => event.stopPropagation()}>
          <View style={styles.header}>
            <View>
              <Text style={styles.title}>添加课本</Text>
            </View>
            <Pressable accessibilityLabel="关闭" hitSlop={8} onPress={onClose} style={styles.close}>
              <X color={colors.inkSoft} size={22} />
            </Pressable>
          </View>

          <ScrollView contentContainerStyle={styles.content}>
            {subjects.map((subject) => {
              const subjectCourses = availableCourses.filter(
                (course) => course.subjectId === subject.id,
              );
              if (subjectCourses.length === 0) return null;

              return (
                <View key={subject.id} style={styles.section}>
                  <View style={styles.sectionHeader}>
                    <View style={[styles.subjectDot, { backgroundColor: subject.color }]} />
                    <Text style={styles.sectionTitle}>{subject.name}</Text>
                  </View>
                  {subjectCourses.map((course) => (
                    <CourseOption
                      key={course.id}
                      course={course}
                      disabled={enroll.isPending}
                      onPress={() => enroll.mutate(course.id)}
                      subject={subject}
                    />
                  ))}
                </View>
              );
            })}

            {availableCourses.length === 0 && (
              <View style={styles.empty}>
                <BookOpen color={colors.green} size={42} />
                <Text style={styles.emptyTitle}>全部课本都在书架上了</Text>
                <Text style={styles.emptyText}>之后有新课本时，可以继续从这里添加。</Text>
              </View>
            )}
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

function CourseOption({
  course,
  disabled,
  onPress,
  subject,
}: {
  course: CourseDto;
  disabled: boolean;
  onPress: () => void;
  subject: SubjectDto;
}) {
  const coverUrl = resolveAssetUrl(course.coverImageUrl);
  const tint = subjectTints(subject.color).soft;

  return (
    <Pressable
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.option,
        (disabled || pressed) && styles.optionPressed,
      ]}
    >
      <View style={[styles.cover, { backgroundColor: tint, borderColor: subject.color }]}>
        {coverUrl ? (
          <Image source={{ uri: coverUrl }} style={styles.coverImage} />
        ) : (
          <BookOpen color={subject.color} size={28} />
        )}
      </View>
      <View style={styles.optionBody}>
        <Text numberOfLines={2} style={styles.optionTitle}>
          {course.name}
        </Text>
        <Text numberOfLines={2} style={styles.optionDescription}>
          {course.description}
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    backgroundColor: 'rgba(0,0,0,0.42)',
    flex: 1,
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: colors.white,
    borderColor: colors.line,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    borderTopWidth: 2,
    maxHeight: '84%',
    paddingBottom: 28,
  },
  header: {
    alignItems: 'center',
    borderBottomColor: colors.line,
    borderBottomWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 18,
  },
  title: {
    color: colors.ink,
    fontFamily: fonts.heavy,
    fontSize: 20,
  },
  close: {
    alignItems: 'center',
    height: 40,
    justifyContent: 'center',
    width: 40,
  },
  content: {
    gap: 22,
    padding: 16,
  },
  section: {
    gap: 10,
  },
  sectionHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  subjectDot: {
    borderRadius: radius.full,
    height: 12,
    width: 12,
  },
  sectionTitle: {
    color: colors.ink,
    fontFamily: fonts.heavy,
    fontSize: 17,
  },
  option: {
    alignItems: 'center',
    backgroundColor: colors.white,
    borderColor: colors.line,
    borderRadius: radius.lg,
    borderWidth: 2,
    flexDirection: 'row',
    gap: 12,
    padding: 10,
  },
  optionPressed: {
    opacity: 0.6,
  },
  cover: {
    alignItems: 'center',
    borderRadius: radius.sm,
    borderWidth: 1,
    height: 88,
    justifyContent: 'center',
    overflow: 'hidden',
    width: 66,
  },
  coverImage: {
    backgroundColor: colors.white,
    height: '100%',
    resizeMode: 'contain',
    width: '100%',
  },
  optionBody: {
    flex: 1,
  },
  optionTitle: {
    color: colors.ink,
    fontFamily: fonts.heavy,
    fontSize: 15,
    lineHeight: 20,
  },
  optionDescription: {
    color: colors.inkSoft,
    fontFamily: fonts.sansBold,
    fontSize: 12,
    lineHeight: 17,
    marginTop: 4,
  },
  empty: {
    alignItems: 'center',
    borderColor: colors.line,
    borderRadius: radius.xl,
    borderStyle: 'dashed',
    borderWidth: 2,
    gap: 8,
    padding: 32,
  },
  emptyTitle: {
    color: colors.ink,
    fontFamily: fonts.heavy,
    fontSize: 17,
  },
  emptyText: {
    color: colors.inkSoft,
    fontFamily: fonts.sansBold,
    fontSize: 13,
    textAlign: 'center',
  },
});
