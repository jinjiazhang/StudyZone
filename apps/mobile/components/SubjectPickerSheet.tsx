import { Modal, Pressable, ScrollView, StyleSheet, Text, View, Image } from 'react-native';
import { X } from 'lucide-react-native';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { CourseDto, SubjectDto } from '@studyzone/shared-types';
import { api } from '../lib/api';
import { resolveAssetUrl } from '../lib/assets';
import { colors, fonts, radius } from '../lib/theme';

interface SubjectPickerSheetProps {
  visible: boolean;
  subject: SubjectDto | null;
  courses: CourseDto[];
  currentCourseId?: string;
  onClose: () => void;
}

export function SubjectPickerSheet({
  visible,
  subject,
  courses,
  currentCourseId,
  onClose,
}: SubjectPickerSheetProps) {
  const queryClient = useQueryClient();

  const enroll = useMutation({
    mutationFn: (courseId: string) => api.enrollCourse(courseId),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['enrollments'] }),
        queryClient.invalidateQueries({ queryKey: ['courses'] }),
      ]);
      onClose();
    },
  });

  if (!subject) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
          <View style={styles.header}>
            <View style={[styles.colorDot, { backgroundColor: subject.color }]} />
            <Text style={styles.headerTitle}>选择 {subject.name} 课本</Text>
            <Pressable onPress={onClose} hitSlop={8} style={styles.closeBtn}>
              <X size={20} color={colors.inkSoft} />
            </Pressable>
          </View>

          <ScrollView contentContainerStyle={styles.list}>
            {courses.map((c) => {
              const isCurrent = c.id === currentCourseId;
              return (
                <Pressable
                  key={c.id}
                  disabled={enroll.isPending}
                  onPress={() => {
                    if (isCurrent) {
                      onClose();
                      return;
                    }
                    enroll.mutate(c.id);
                  }}
                  style={[
                    styles.item,
                    isCurrent && styles.itemCurrent,
                    enroll.isPending && styles.itemDisabled,
                  ]}
                >
                  <View style={[styles.cover, { borderColor: subject.color }]}>
                    {resolveAssetUrl(c.coverImageUrl) ? (
                      <Image
                        source={{ uri: resolveAssetUrl(c.coverImageUrl) }}
                        style={styles.coverImage}
                      />
                    ) : null}
                  </View>
                  <View style={styles.body}>
                    <Text style={styles.itemTitle}>{c.name}</Text>
                    <Text style={styles.itemDesc} numberOfLines={2}>{c.description}</Text>
                    {isCurrent && (
                      <View style={styles.badge}>
                        <Text style={styles.badgeText}>正在学习</Text>
                      </View>
                    )}
                  </View>
                </Pressable>
              );
            })}
            {courses.length === 0 && (
              <View style={styles.empty}>
                <Text style={styles.emptyText}>该学科暂无课本。</Text>
              </View>
            )}
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  sheet: {
    backgroundColor: colors.white,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    borderTopWidth: 2,
    borderColor: colors.line,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 32,
    maxHeight: '80%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderColor: colors.line,
  },
  colorDot: {
    width: 14,
    height: 14,
    borderRadius: 999,
  },
  headerTitle: {
    flex: 1,
    fontFamily: fonts.heavy,
    fontSize: 16,
    color: colors.ink,
  },
  closeBtn: { padding: 4 },
  list: { gap: 10, paddingTop: 12 },
  item: {
    flexDirection: 'row',
    gap: 12,
    padding: 12,
    borderRadius: radius.lg,
    borderWidth: 2,
    borderColor: colors.line,
    backgroundColor: colors.white,
    alignItems: 'center',
  },
  itemCurrent: {
    borderColor: colors.green,
    backgroundColor: colors.mist,
  },
  itemDisabled: { opacity: 0.6 },
  cover: {
    width: 64,
    height: 88,
    borderRadius: radius.md,
    borderWidth: 2,
    overflow: 'hidden',
    backgroundColor: colors.white,
  },
  coverImage: { width: '100%', height: '100%', resizeMode: 'contain' },
  body: { flex: 1 },
  itemTitle: { fontFamily: fonts.heavy, fontSize: 15, color: colors.ink },
  itemDesc: { fontFamily: fonts.regular, fontSize: 12, color: colors.inkSoft, marginTop: 2 },
  badge: {
    marginTop: 6,
    alignSelf: 'flex-start',
    backgroundColor: colors.green,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
  },
  badgeText: {
    fontFamily: fonts.heavy,
    fontSize: 10,
    color: colors.white,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  empty: {
    padding: 24,
    alignItems: 'center',
    borderRadius: radius.lg,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: colors.line,
  },
  emptyText: { fontFamily: fonts.sansBold, color: colors.inkSoft },
});
