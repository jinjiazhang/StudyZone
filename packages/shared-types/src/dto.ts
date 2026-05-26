import {
  ExerciseType,
  FriendshipStatus,
  LeagueTier,
  LessonOutcome,
  Locale,
  SubjectCode,
  XPReason,
} from './enums';
import type { ExerciseAnswer, ExercisePrompt, UserAttemptPayload } from './exercise';

// =============================================================================
// Auth
// =============================================================================

export interface RegisterDto {
  email: string;
  password: string;
  nickname: string;
  locale?: Locale;
}

export interface LoginDto {
  email: string;
  password: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface AuthResponse {
  user: UserPublic;
  tokens: AuthTokens;
}

// =============================================================================
// User
// =============================================================================

export interface UserPublic {
  id: string;
  nickname: string;
  avatarUrl: string | null;
  locale: Locale;
  createdAt: string;
}

export interface UserProfile extends UserPublic {
  email: string;
  dailyGoalMinutes: number;
  xpTotal: number;
  gems: number;
  hearts: number;
  maxHearts: number;
  currentStreak: number;
  longestStreak: number;
  leagueTier: LeagueTier | null;
}

// =============================================================================
// Curriculum
// =============================================================================

export interface SubjectDto {
  id: string;
  code: SubjectCode;
  name: string;
  icon: string;
  color: string;
}

export interface CourseDto {
  id: string;
  subjectId: string;
  subjectCode: SubjectCode;
  fromLocale: Locale;
  toLocale: Locale;
  name: string;
  description: string;
  flagEmoji: string;
}

export interface CourseTreeNode {
  unitId: string;
  unitTitle: string;
  unitOrder: number;
  themeColor: string;
  skills: SkillNodeDto[];
}

export interface SkillNodeDto {
  skillId: string;
  name: string;
  icon: string;
  order: number;
  maxLevel: number;
  /** 0..maxLevel; clamps to 0 if not started. */
  userLevel: number;
  /** Whether the user has unlocked this skill (predecessors complete). */
  unlocked: boolean;
  lessonCount: number;
  completedLessons: number;
}

export interface AdminCourseContentDto {
  id: string;
  name: string;
  description: string;
  units: AdminUnitDto[];
}

export interface AdminUnitDto {
  id: string;
  orderIndex: number;
  title: string;
  themeColor: string;
  skills: AdminSkillDto[];
}

export interface AdminSkillDto {
  id: string;
  orderIndex: number;
  name: string;
  icon: string;
  maxLevel: number;
  lessons: AdminLessonDto[];
}

export interface AdminLessonDto {
  id: string;
  level: number;
  orderIndex: number;
  exerciseCount: number;
  exercises: AdminExerciseDto[];
}

export interface AdminExerciseDto {
  id: string;
  type: ExerciseType;
  prompt: ExercisePrompt;
  answer: ExerciseAnswer;
  difficulty: number;
  orderIndex: number;
}

export interface UpdateExerciseDto {
  type?: ExerciseType;
  prompt?: ExercisePrompt;
  answer?: ExerciseAnswer;
  difficulty?: number;
}

// =============================================================================
// Learning
// =============================================================================

export interface StartLessonResponse {
  sessionId: string;
  lessonId: string;
  skillId: string;
  exercises: SessionExerciseDto[];
  startedAt: string;
}

export interface SessionExerciseDto {
  id: string;
  type: ExerciseType;
  prompt: ExercisePrompt;
  difficulty: number;
}

export interface SubmitAttemptDto {
  exerciseId: string;
  payload: UserAttemptPayload;
  responseMs: number;
}

export interface AttemptResult {
  correct: boolean;
  /** Server's canonical correct answer (revealed after the attempt). */
  canonicalAnswer?: string;
  /** Whether the user lost a heart for this attempt. */
  heartLost: boolean;
  heartsRemaining: number;
}

export interface CompleteSessionDto {
  /** Optional, server can also infer from server-recorded attempts. */
  abandoned?: boolean;
}

export interface CompleteSessionResponse {
  outcome: LessonOutcome;
  xpGained: number;
  perfectBonus: number;
  gemsGained: number;
  newStreak: number;
  streakAdvanced: boolean;
  levelUp: { from: number; to: number } | null;
  skillProgress: {
    skillId: string;
    level: number;
    strength: number;
  };
}

// =============================================================================
// Gamification
// =============================================================================

export interface XPLedgerEntry {
  id: string;
  delta: number;
  reason: XPReason;
  refId: string | null;
  createdAt: string;
}

export interface DailyQuestDto {
  id: string;
  code: string;
  title: string;
  targetValue: number;
  currentValue: number;
  xpReward: number;
  gemsReward: number;
  completed: boolean;
}

// =============================================================================
// Social
// =============================================================================

export interface FriendDto {
  user: UserPublic;
  status: FriendshipStatus;
  weeklyXp: number;
  currentStreak: number;
}

export interface LeagueStandingDto {
  leagueId: string;
  tier: LeagueTier;
  weekStart: string;
  weekEnd: string;
  entries: LeagueEntryDto[];
  /** Index of the current user in entries (0-based). */
  selfIndex: number;
}

export interface LeagueEntryDto {
  rank: number;
  user: UserPublic;
  weeklyXp: number;
}

// =============================================================================
// Common
// =============================================================================

export interface Paginated<T> {
  items: T[];
  nextCursor: string | null;
  total?: number;
}

export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}
