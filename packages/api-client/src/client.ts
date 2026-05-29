import type {
  ApiError,
  AdminCourseContentDto,
  AdminExerciseDto,
  AttemptResult,
  AuthResponse,
  CompleteSessionDto,
  CompleteSessionResponse,
  CourseDto,
  CourseTreeNode,
  DailyQuestDto,
  FriendSummaryDto,
  FriendRequestDto,
  LeagueStandingDto,
  LeagueHistoryItemDto,
  AdminLeagueWeekDto,
  AdminSettleLeaguesResult,
  AdminUserListItemDto,
  AdminUserListQuery,
  AdminUserDetailDto,
  AdminUpdateUserDto,
  AdminAdjustWalletDto,
  LoginDto,
  Paginated,
  RegisterDto,
  StartLessonResponse,
  SubjectDto,
  SubmitAttemptDto,
  UpdateExerciseDto,
  UserProfile,
} from '@studyzone/shared-types';

export interface ClientOptions {
  baseUrl: string;
  getAccessToken?: () => string | null | Promise<string | null>;
  onUnauthorized?: () => void;
  fetchImpl?: typeof fetch;
}

export class ApiClientError extends Error {
  constructor(
    public readonly status: number,
    public readonly body: ApiError,
  ) {
    super(body.message ?? `HTTP ${status}`);
  }
}

export class StudyZoneClient {
  private fetchImpl: typeof fetch;

  constructor(private opts: ClientOptions) {
    this.fetchImpl = opts.fetchImpl ?? globalThis.fetch.bind(globalThis);
  }

  private async request<T>(
    path: string,
    init: RequestInit & { auth?: boolean } = {},
  ): Promise<T> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(init.headers as Record<string, string> | undefined),
    };
    if (init.auth !== false && this.opts.getAccessToken) {
      const token = await this.opts.getAccessToken();
      if (token) headers.Authorization = `Bearer ${token}`;
    }

    const res = await this.fetchImpl(`${this.opts.baseUrl}${path}`, {
      ...init,
      headers,
    });

    if (res.status === 401) {
      this.opts.onUnauthorized?.();
    }

    if (!res.ok) {
      let body: ApiError;
      try {
        body = (await res.json()) as ApiError;
      } catch {
        body = { code: 'unknown', message: `HTTP ${res.status}` };
      }
      throw new ApiClientError(res.status, body);
    }

    if (res.status === 204) return undefined as T;
    return (await res.json()) as T;
  }

  register(dto: RegisterDto) {
    return this.request<AuthResponse>('/api/v1/auth/register', {
      method: 'POST',
      body: JSON.stringify(dto),
      auth: false,
    });
  }

  login(dto: LoginDto) {
    return this.request<AuthResponse>('/api/v1/auth/login', {
      method: 'POST',
      body: JSON.stringify(dto),
      auth: false,
    });
  }

  refresh(refreshToken: string) {
    return this.request<AuthResponse>('/api/v1/auth/refresh', {
      method: 'POST',
      body: JSON.stringify({ refreshToken }),
      auth: false,
    });
  }

  me() {
    return this.request<UserProfile>('/api/v1/me');
  }

  listSubjects() {
    return this.request<SubjectDto[]>('/api/v1/subjects');
  }

  listCourses(subjectCode?: string) {
    const q = subjectCode ? `?subject=${encodeURIComponent(subjectCode)}` : '';
    return this.request<CourseDto[]>(`/api/v1/courses${q}`);
  }

  enrollCourse(courseId: string) {
    return this.request<void>(`/api/v1/courses/${courseId}/enroll`, {
      method: 'POST',
    });
  }

  getCourseTree(courseId: string) {
    return this.request<CourseTreeNode[]>(`/api/v1/courses/${courseId}/tree`);
  }

  getAdminCourseContent(courseId: string) {
    return this.request<AdminCourseContentDto>(`/api/v1/admin/courses/${courseId}/content`);
  }

  updateAdminExercise(exerciseId: string, dto: UpdateExerciseDto) {
    return this.request<AdminExerciseDto>(`/api/v1/admin/exercises/${exerciseId}`, {
      method: 'PATCH',
      body: JSON.stringify(dto),
    });
  }

  startLesson(lessonId: string) {
    return this.request<StartLessonResponse>(`/api/v1/lessons/${lessonId}/start`, {
      method: 'POST',
    });
  }

  submitAttempt(sessionId: string, dto: SubmitAttemptDto) {
    return this.request<AttemptResult>(`/api/v1/sessions/${sessionId}/attempts`, {
      method: 'POST',
      body: JSON.stringify(dto),
    });
  }

  completeSession(sessionId: string, dto: CompleteSessionDto = {}) {
    return this.request<CompleteSessionResponse>(`/api/v1/sessions/${sessionId}/complete`, {
      method: 'POST',
      body: JSON.stringify(dto),
    });
  }

  dailyQuests() {
    return this.request<DailyQuestDto[]>('/api/v1/quests/daily');
  }

  friends(cursor?: string) {
    const q = cursor ? `?cursor=${encodeURIComponent(cursor)}` : '';
    return this.request<Paginated<FriendSummaryDto>>(`/api/v1/friends${q}`);
  }

  friendRequests() {
    return this.request<{ incoming: FriendRequestDto[]; outgoing: FriendRequestDto[] }>(
      '/api/v1/friends/requests',
    );
  }

  sendFriendRequest(email: string) {
    return this.request<void>('/api/v1/friends/requests', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  }

  acceptFriendRequest(requesterId: string) {
    return this.request<void>(`/api/v1/friends/${requesterId}/accept`, { method: 'POST' });
  }

  declineFriendRequest(requesterId: string) {
    return this.request<void>(`/api/v1/friends/${requesterId}/decline`, { method: 'POST' });
  }

  removeFriend(otherId: string) {
    return this.request<void>(`/api/v1/friends/${otherId}`, { method: 'DELETE' });
  }

  myLeague() {
    return this.request<LeagueStandingDto>('/api/v1/leagues/me');
  }

  leagueHistory() {
    return this.request<LeagueHistoryItemDto[]>('/api/v1/leagues/history');
  }

  getAdminLeagues(weekStart?: string) {
    const q = weekStart ? `?weekStart=${encodeURIComponent(weekStart)}` : '';
    return this.request<AdminLeagueWeekDto>(`/api/v1/admin/leagues${q}`);
  }

  settleAdminLeagues(weekStart?: string) {
    return this.request<AdminSettleLeaguesResult>('/api/v1/admin/leagues/settle', {
      method: 'POST',
      body: JSON.stringify(weekStart ? { weekStart } : {}),
    });
  }

  listAdminUsers(query: AdminUserListQuery = {}) {
    const params = new URLSearchParams();
    if (query.search) params.set('search', query.search);
    if (query.status) params.set('status', query.status);
    if (query.cursor) params.set('cursor', query.cursor);
    if (query.limit) params.set('limit', String(query.limit));
    const q = params.toString();
    return this.request<Paginated<AdminUserListItemDto>>(
      `/api/v1/admin/users${q ? `?${q}` : ''}`,
    );
  }

  getAdminUser(id: string) {
    return this.request<AdminUserDetailDto>(`/api/v1/admin/users/${id}`);
  }

  updateAdminUser(id: string, dto: AdminUpdateUserDto) {
    return this.request<AdminUserDetailDto>(`/api/v1/admin/users/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(dto),
    });
  }

  adjustAdminUserWallet(id: string, dto: AdminAdjustWalletDto) {
    return this.request<AdminUserDetailDto>(`/api/v1/admin/users/${id}/wallet`, {
      method: 'POST',
      body: JSON.stringify(dto),
    });
  }
}
