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
  coverImageUrl: string;
}

export interface CourseTreeNode {
  unitId: string;
  unitTitle: string;
  unitOrder: number;
  themeColor: string;
  lessons: LessonNodeDto[];
}

export interface LessonNodeDto {
  lessonId: string;
  name: string;
  icon: string;
  order: number;
  unlocked: boolean;
  completed: boolean;
  exerciseCount: number;
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
  lessons: AdminLessonDto[];
}

export interface AdminLessonDto {
  id: string;
  orderIndex: number;
  title: string;
  icon: string;
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
  courseId: string;
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
  canonicalAnswer?: string;
  heartLost: boolean;
  heartsRemaining: number;
}

export interface CompleteSessionDto {
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
  lessonProgress: {
    lessonId: string;
    completed: boolean;
    bestScore: number;
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
  id: string;
  nickname: string;
  avatarUrl: string | null;
  status: FriendshipStatus;
}

export interface Paginated<T> {
  items: T[];
  nextCursor: string | null;
}

export type LeagueResultType = 'promoted' | 'stayed' | 'demoted';

export interface LeagueEntryDto {
  rank: number;
  user: UserPublic;
  weeklyXp: number;
  /** Projected outcome at settlement given the current standing. */
  zone: LeagueResultType;
}

export interface LeagueStandingDto {
  leagueId: string;
  tier: LeagueTier;
  weekStart: string;
  weekEnd: string;
  selfIndex: number;
  /** Total players in the group. */
  groupSize: number;
  /** Number of top players who promote this week (0 if top tier). */
  promoteCount: number;
  /** Number of bottom players who demote this week (0 if bottom tier). */
  demoteCount: number;
  entries: LeagueEntryDto[];
}

export interface LeagueHistoryItemDto {
  weekStart: string;
  tier: LeagueTier;
  finalRank: number;
  weeklyXp: number;
  result: LeagueResultType;
  nextTier: LeagueTier;
  gemsAwarded: number;
}

// =============================================================================
// Admin — leagues
// =============================================================================

export interface AdminLeagueGroupDto {
  id: string;
  tier: LeagueTier;
  weekStart: string;
  capacity: number;
  status: 'active' | 'settled';
  settledAt: string | null;
  memberCount: number;
}

export interface AdminLeagueWeekDto {
  weekStart: string;
  groups: AdminLeagueGroupDto[];
  totalPlayers: number;
}

export interface AdminSettleLeaguesDto {
  /** ISO week-start (Monday UTC) to settle. Defaults to the most recent completed week. */
  weekStart?: string;
}

export interface AdminSettleLeaguesResult {
  weekStart: string;
  groupsSettled: number;
  playersSettled: number;
  promoted: number;
  demoted: number;
}

// =============================================================================
// Admin — users
// =============================================================================

export type UserStatus = 'active' | 'suspended' | 'deleted';

export interface AdminUserListItemDto {
  id: string;
  email: string;
  nickname: string;
  avatarUrl: string | null;
  locale: Locale;
  status: UserStatus;
  xpTotal: number;
  currentStreak: number;
  createdAt: string;
}

export interface AdminUserListQuery {
  /** Free-text search over email + nickname. */
  search?: string;
  status?: UserStatus;
  /** Opaque cursor (user id) for keyset pagination. */
  cursor?: string;
  /** Page size, 1-100. Defaults to 20. */
  limit?: number;
}

export interface AdminUserDetailDto extends AdminUserListItemDto {
  dailyGoalMinutes: number;
  timezone: string;
  longestStreak: number;
  gems: number;
  hearts: number;
  maxHearts: number;
  leagueTier: LeagueTier | null;
  enrolledCourses: number;
  lessonsCompleted: number;
  updatedAt: string;
}

export interface AdminUpdateUserDto {
  nickname?: string;
  status?: UserStatus;
  dailyGoalMinutes?: number;
}

export interface AdminAdjustWalletDto {
  /** Delta applied to gems (can be negative). */
  gemsDelta?: number;
  /** Absolute value to set hearts to. */
  hearts?: number;
}

export interface ApiError {
  code: string;
  message?: string;
  details?: unknown;
}
