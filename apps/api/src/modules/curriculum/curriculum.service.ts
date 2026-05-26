import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../infra/prisma.service';

@Injectable()
export class CurriculumService {
  constructor(private readonly prisma: PrismaService) {}

  listSubjects() {
    return this.prisma.subject.findMany({ orderBy: { order: 'asc' } });
  }

  async listCourses(subjectCode?: string) {
    return this.prisma.course.findMany({
      where: subjectCode ? { subject: { code: subjectCode } } : {},
      include: { subject: true },
      orderBy: { createdAt: 'asc' },
    });
  }

  async enroll(userId: string, courseId: string) {
    const course = await this.prisma.course.findUnique({ where: { id: courseId } });
    if (!course) throw new NotFoundException({ code: 'course_not_found', message: '课程不存在' });

    await this.prisma.enrollment.upsert({
      where: { userId_courseId: { userId, courseId } },
      create: { userId, courseId },
      update: { lastActiveAt: new Date() },
    });
  }

  /**
   * Returns the skill-tree view for a user.
   * For each unit: list of skills with the user's current level + unlock state.
   * Simple unlock rule: a skill is unlocked iff (a) it's the first skill, or
   * (b) all earlier skills in the same unit are at level >= 1, or
   * (c) it's the first skill of a unit and the previous unit is mostly complete.
   */
  async firstLessonOfSkill(skillId: string) {
    const lesson = await this.prisma.lesson.findFirst({
      where: { skillId },
      orderBy: [{ level: 'asc' }, { orderIndex: 'asc' }],
    });
    if (!lesson) throw new NotFoundException({ code: 'lesson_not_found' });
    return { lessonId: lesson.id, level: lesson.level };
  }

  async getCourseTree(userId: string, courseId: string) {
    const course = await this.prisma.course.findUnique({
      where: { id: courseId },
      include: {
        units: {
          orderBy: { orderIndex: 'asc' },
          include: {
            skills: {
              orderBy: { orderIndex: 'asc' },
              include: { lessons: true },
            },
          },
        },
      },
    });
    if (!course) throw new NotFoundException({ code: 'course_not_found', message: '课程不存在' });

    const progress = await this.prisma.userSkillProgress.findMany({
      where: { userId, skill: { unit: { courseId } } },
    });
    const progressMap = new Map(progress.map((p) => [p.skillId, p]));

    const tree = course.units.map((unit) => {
      let unlockedAll = true;
      const skills = unit.skills.map((skill, idx) => {
        const p = progressMap.get(skill.id);
        const userLevel = p?.level ?? 0;
        const unlocked = idx === 0 || unlockedAll;
        // If this skill isn't fully at level >= 1, downstream get blocked.
        if (userLevel < 1) unlockedAll = false;

        // Lesson counts.
        const lessonCount = skill.lessons.length;
        const completedLessons = Math.min(userLevel, skill.maxLevel) * Math.max(1, Math.floor(lessonCount / skill.maxLevel));

        return {
          skillId: skill.id,
          name: skill.name,
          icon: skill.icon,
          order: skill.orderIndex,
          maxLevel: skill.maxLevel,
          userLevel,
          unlocked,
          lessonCount,
          completedLessons,
        };
      });

      return {
        unitId: unit.id,
        unitTitle: unit.title,
        unitOrder: unit.orderIndex,
        themeColor: unit.themeColor,
        skills,
      };
    });

    return tree;
  }
}
