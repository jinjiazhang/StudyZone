import type { CourseDto, EnrollmentDto } from './dto';

/**
 * Pick the user's "currently studying" course per subject.
 *
 * The first enrollment per subjectId wins. Callers should pass enrollments
 * already sorted by `lastActiveAt desc` (which the API does); we still tolerate
 * unsorted input by sorting defensively.
 */
export function pickCurrentCourseBySubject(
  enrollments: EnrollmentDto[],
  courses: CourseDto[],
): Map<string, CourseDto> {
  const sorted = [...enrollments].sort((a, b) =>
    a.lastActiveAt < b.lastActiveAt ? 1 : a.lastActiveAt > b.lastActiveAt ? -1 : 0,
  );
  const courseById = new Map(courses.map((c) => [c.id, c]));
  const result = new Map<string, CourseDto>();
  for (const e of sorted) {
    if (result.has(e.subjectId)) continue;
    const course = courseById.get(e.courseId);
    if (course) result.set(e.subjectId, course);
  }
  return result;
}
