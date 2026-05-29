import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type {
  AdminUpdateUserDto,
  AdminUserDetailDto,
  AdminUserListItemDto,
  UserStatus,
} from '@studyzone/shared-types';
import { api } from '../state';

const STATUS_META: Record<UserStatus, { label: string; color: string; bg: string }> = {
  active: { label: '正常', color: '#047857', bg: '#d1fae5' },
  suspended: { label: '已封禁', color: '#b45309', bg: '#fef3c7' },
  deleted: { label: '已注销', color: '#b91c1c', bg: '#fee2e2' },
};

function StatusBadge({ status }: { status: UserStatus }) {
  const m = STATUS_META[status] ?? STATUS_META.active;
  return (
    <span
      style={{
        fontSize: 12,
        fontWeight: 600,
        color: m.color,
        background: m.bg,
        padding: '2px 8px',
        borderRadius: 999,
      }}
    >
      {m.label}
    </span>
  );
}

export function Users() {
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<UserStatus | ''>('');
  const [cursorStack, setCursorStack] = useState<string[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const cursor = cursorStack[cursorStack.length - 1];

  const { data, isLoading } = useQuery({
    queryKey: ['admin-users', search, status, cursor ?? null],
    queryFn: () =>
      api.listAdminUsers({
        search: search || undefined,
        status: status || undefined,
        cursor: cursor || undefined,
        limit: 20,
      }),
  });

  const applySearch = () => {
    setCursorStack([]);
    setSearch(searchInput.trim());
  };

  return (
    <div>
      <h1 style={{ fontSize: 24, marginBottom: 16 }}>用户管理</h1>

      <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', gap: 8 }}>
          <input
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && applySearch()}
            placeholder="搜索邮箱或昵称"
            style={{
              padding: '8px 12px',
              borderRadius: 8,
              border: '1px solid #d1d5db',
              minWidth: 220,
            }}
          />
          <button onClick={applySearch} style={btnPrimary}>
            搜索
          </button>
        </div>
        <select
          value={status}
          onChange={(e) => {
            setCursorStack([]);
            setStatus(e.target.value as UserStatus | '');
          }}
          style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid #d1d5db' }}
        >
          <option value="">全部状态</option>
          <option value="active">正常</option>
          <option value="suspended">已封禁</option>
          <option value="deleted">已注销</option>
        </select>
      </div>

      <div
        style={{
          background: 'white',
          borderRadius: 12,
          border: '1px solid #e5e7eb',
          overflow: 'hidden',
        }}
      >
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
          <thead>
            <tr style={{ background: '#f9fafb', textAlign: 'left' }}>
              <th style={th}>用户</th>
              <th style={th}>邮箱</th>
              <th style={th}>状态</th>
              <th style={{ ...th, textAlign: 'right' }}>XP</th>
              <th style={{ ...th, textAlign: 'right' }}>连胜</th>
              <th style={th}>注册时间</th>
              <th style={th} />
            </tr>
          </thead>
          <tbody>
            {isLoading && (
              <tr>
                <td colSpan={7} style={{ ...td, textAlign: 'center', color: '#9ca3af' }}>
                  加载中…
                </td>
              </tr>
            )}
            {!isLoading && data?.items.length === 0 && (
              <tr>
                <td colSpan={7} style={{ ...td, textAlign: 'center', color: '#9ca3af' }}>
                  没有匹配的用户
                </td>
              </tr>
            )}
            {data?.items.map((u: AdminUserListItemDto) => (
              <tr key={u.id} style={{ borderTop: '1px solid #f3f4f6' }}>
                <td style={td}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    {u.avatarUrl ? (
                      <img
                        src={u.avatarUrl}
                        alt=""
                        style={{ width: 32, height: 32, borderRadius: 999 }}
                      />
                    ) : (
                      <div
                        style={{
                          width: 32,
                          height: 32,
                          borderRadius: 999,
                          background: '#e5e7eb',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: 13,
                          color: '#6b7280',
                        }}
                      >
                        {u.nickname.slice(0, 1)}
                      </div>
                    )}
                    <span style={{ fontWeight: 500 }}>{u.nickname}</span>
                  </div>
                </td>
                <td style={{ ...td, color: '#6b7280' }}>{u.email}</td>
                <td style={td}>
                  <StatusBadge status={u.status} />
                </td>
                <td style={{ ...td, textAlign: 'right' }}>{u.xpTotal.toLocaleString()}</td>
                <td style={{ ...td, textAlign: 'right' }}>{u.currentStreak}</td>
                <td style={{ ...td, color: '#6b7280' }}>
                  {new Date(u.createdAt).toLocaleDateString()}
                </td>
                <td style={{ ...td, textAlign: 'right' }}>
                  <button onClick={() => setSelectedId(u.id)} style={btnGhost}>
                    详情
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 16 }}>
        <button
          disabled={cursorStack.length === 0}
          onClick={() => setCursorStack((s) => s.slice(0, -1))}
          style={cursorStack.length === 0 ? btnDisabled : btnGhost}
        >
          ← 上一页
        </button>
        <button
          disabled={!data?.nextCursor}
          onClick={() => data?.nextCursor && setCursorStack((s) => [...s, data.nextCursor!])}
          style={!data?.nextCursor ? btnDisabled : btnGhost}
        >
          下一页 →
        </button>
      </div>

      {selectedId && (
        <UserDetailDrawer userId={selectedId} onClose={() => setSelectedId(null)} />
      )}
    </div>
  );
}

function UserDetailDrawer({ userId, onClose }: { userId: string; onClose: () => void }) {
  const queryClient = useQueryClient();
  const [error, setError] = useState<string | null>(null);

  const { data: user, isLoading } = useQuery({
    queryKey: ['admin-user', userId],
    queryFn: () => api.getAdminUser(userId),
  });

  const invalidate = async () => {
    await queryClient.invalidateQueries({ queryKey: ['admin-user', userId] });
    await queryClient.invalidateQueries({ queryKey: ['admin-users'] });
  };

  const update = useMutation({
    mutationFn: (dto: AdminUpdateUserDto) => api.updateAdminUser(userId, dto),
    onSuccess: invalidate,
    onError: (e: Error) => setError(e.message),
  });

  const adjustWallet = useMutation({
    mutationFn: (gemsDelta: number) => api.adjustAdminUserWallet(userId, { gemsDelta }),
    onSuccess: invalidate,
    onError: (e: Error) => setError(e.message),
  });

  return (
    <div style={overlay} onClick={onClose}>
      <div style={drawer} onClick={(e) => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ fontSize: 20, margin: 0 }}>用户详情</h2>
          <button onClick={onClose} style={btnGhost}>
            关闭
          </button>
        </div>

        {isLoading || !user ? (
          <p style={{ color: '#9ca3af' }}>加载中…</p>
        ) : (
          <UserDetailBody
            user={user}
            error={error}
            saving={update.isPending}
            onSave={(dto) => {
              setError(null);
              update.mutate(dto);
            }}
            onAdjustGems={(delta) => {
              setError(null);
              adjustWallet.mutate(delta);
            }}
          />
        )}
      </div>
    </div>
  );
}

function UserDetailBody({
  user,
  error,
  saving,
  onSave,
  onAdjustGems,
}: {
  user: AdminUserDetailDto;
  error: string | null;
  saving: boolean;
  onSave: (dto: AdminUpdateUserDto) => void;
  onAdjustGems: (delta: number) => void;
}) {
  const [nickname, setNickname] = useState(user.nickname);
  const [dailyGoal, setDailyGoal] = useState(user.dailyGoalMinutes);

  const dirty = useMemo(
    () => nickname !== user.nickname || dailyGoal !== user.dailyGoalMinutes,
    [nickname, dailyGoal, user],
  );

  const stats: [string, string | number][] = [
    ['总 XP', user.xpTotal.toLocaleString()],
    ['宝石', user.gems],
    ['红心', `${user.hearts}/${user.maxHearts}`],
    ['当前连胜', user.currentStreak],
    ['最长连胜', user.longestStreak],
    ['联赛段位', user.leagueTier ?? '—'],
    ['报名课程', user.enrolledCourses],
    ['完成关卡', user.lessonsCompleted],
  ];

  return (
    <div style={{ display: 'grid', gap: 20, marginTop: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <span style={{ fontSize: 13, color: '#6b7280' }}>{user.email}</span>
        <StatusBadge status={user.status} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        {stats.map(([label, value]) => (
          <div key={label} style={{ background: '#f9fafb', borderRadius: 8, padding: 12 }}>
            <div style={{ fontSize: 12, color: '#6b7280' }}>{label}</div>
            <div style={{ fontSize: 16, fontWeight: 600 }}>{value}</div>
          </div>
        ))}
      </div>

      <section style={{ display: 'grid', gap: 10 }}>
        <h3 style={{ fontSize: 14, margin: 0, color: '#374151' }}>编辑资料</h3>
        <label style={field}>
          <span style={fieldLabel}>昵称</span>
          <input
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            style={input}
          />
        </label>
        <label style={field}>
          <span style={fieldLabel}>每日目标（分钟）</span>
          <input
            type="number"
            min={1}
            max={120}
            value={dailyGoal}
            onChange={(e) => setDailyGoal(Number(e.target.value))}
            style={input}
          />
        </label>
        <button
          disabled={!dirty || saving}
          onClick={() => onSave({ nickname, dailyGoalMinutes: dailyGoal })}
          style={!dirty || saving ? btnDisabled : btnPrimary}
        >
          保存修改
        </button>
      </section>

      <section style={{ display: 'grid', gap: 10 }}>
        <h3 style={{ fontSize: 14, margin: 0, color: '#374151' }}>账号状态</h3>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {user.status !== 'active' && (
            <button onClick={() => onSave({ status: 'active' })} style={btnPrimary}>
              恢复正常
            </button>
          )}
          {user.status !== 'suspended' && (
            <button onClick={() => onSave({ status: 'suspended' })} style={btnWarn}>
              封禁账号
            </button>
          )}
        </div>
      </section>

      <section style={{ display: 'grid', gap: 10 }}>
        <h3 style={{ fontSize: 14, margin: 0, color: '#374151' }}>钱包调整</h3>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button onClick={() => onAdjustGems(50)} style={btnGhost}>
            +50 宝石
          </button>
          <button onClick={() => onAdjustGems(-50)} style={btnGhost}>
            -50 宝石
          </button>
        </div>
      </section>

      {error && <p style={{ color: '#b91c1c', fontSize: 13 }}>{error}</p>}
    </div>
  );
}

const th: React.CSSProperties = {
  padding: '10px 14px',
  fontSize: 12,
  fontWeight: 600,
  color: '#6b7280',
  textTransform: 'uppercase',
  letterSpacing: 0.4,
};
const td: React.CSSProperties = { padding: '10px 14px', verticalAlign: 'middle' };
const btnPrimary: React.CSSProperties = {
  padding: '8px 16px',
  borderRadius: 8,
  border: 'none',
  background: '#4f46e5',
  color: 'white',
  cursor: 'pointer',
  fontWeight: 500,
};
const btnWarn: React.CSSProperties = { ...btnPrimary, background: '#d97706' };
const btnGhost: React.CSSProperties = {
  padding: '8px 14px',
  borderRadius: 8,
  border: '1px solid #d1d5db',
  background: 'white',
  color: '#374151',
  cursor: 'pointer',
};
const btnDisabled: React.CSSProperties = {
  ...btnGhost,
  opacity: 0.5,
  cursor: 'not-allowed',
};
const overlay: React.CSSProperties = {
  position: 'fixed',
  inset: 0,
  background: 'rgba(0,0,0,0.35)',
  display: 'flex',
  justifyContent: 'flex-end',
  zIndex: 50,
};
const drawer: React.CSSProperties = {
  width: 440,
  maxWidth: '92vw',
  height: '100%',
  background: 'white',
  padding: 24,
  overflowY: 'auto',
  boxShadow: '-8px 0 24px rgba(0,0,0,0.12)',
};
const field: React.CSSProperties = { display: 'grid', gap: 4 };
const fieldLabel: React.CSSProperties = { fontSize: 12, color: '#6b7280' };
const input: React.CSSProperties = {
  padding: '8px 12px',
  borderRadius: 8,
  border: '1px solid #d1d5db',
};
