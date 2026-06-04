import { useQuery } from '@tanstack/react-query';
import { Link, useParams } from 'react-router-dom';
import { api } from '../state';

const RouterLink = Link as unknown as React.ComponentType<any>;

const TIER_LABEL: Record<string, string> = {
  bronze: '青铜',
  silver: '白银',
  gold: '黄金',
  sapphire: '蓝宝石',
  ruby: '红宝石',
  emerald: '翡翠',
  diamond: '钻石',
};

const RESULT_LABEL: Record<string, string> = {
  promoted: '晋级',
  stayed: '保级',
  demoted: '降级',
};

function fmtDate(iso: string) {
  return new Date(iso).toISOString().slice(0, 10);
}

function fmtDateTime(iso: string | null) {
  return iso ? new Date(iso).toLocaleString() : '—';
}

function resultStyle(result: string): React.CSSProperties {
  if (result === 'promoted') return { ...pill, background: '#dcfce7', color: '#16a34a' };
  if (result === 'demoted') return { ...pill, background: '#fee2e2', color: '#dc2626' };
  return { ...pill, background: '#f3f4f6', color: '#4b5563' };
}

export function LeagueGroupDetail() {
  const { id } = useParams();
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['admin-league-group', id],
    queryFn: () => api.getAdminLeagueGroup(id!),
    enabled: !!id,
  });

  if (isLoading) return <div style={{ color: '#6b7280' }}>加载中…</div>;
  if (isError) {
    return (
      <div>
        <RouterLink to="/leagues" style={backLink}>
          ← 返回联赛管理
        </RouterLink>
        <div style={{ ...resultBox, background: '#fef2f2', color: '#dc2626' }}>
          加载失败：{(error as Error)?.message}
        </div>
      </div>
    );
  }
  if (!data) return null;

  return (
    <div>
      <RouterLink to="/leagues" style={backLink}>
        ← 返回联赛管理
      </RouterLink>

      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16, marginBottom: 20 }}>
        <div>
          <h1 style={{ fontSize: 24, margin: '0 0 8px' }}>
            {TIER_LABEL[data.tier] ?? data.tier}联赛分组
          </h1>
          <div style={{ color: '#6b7280', fontFamily: 'monospace', fontSize: 13 }}>{data.id}</div>
        </div>
        <div style={{ flex: 1 }} />
        <span
          style={{
            ...pill,
            background: data.status === 'settled' ? '#dcfce7' : '#e0f2fe',
            color: data.status === 'settled' ? '#16a34a' : '#0369a1',
          }}
        >
          {data.status === 'settled' ? '已结算' : '进行中'}
        </span>
      </div>

      <div style={summaryGrid}>
        <Summary label="联赛周" value={fmtDate(data.weekStart)} />
        <Summary label="成员" value={`${data.memberCount} / ${data.capacity}`} />
        <Summary label="晋级区" value={`${data.promoteCount} 人`} />
        <Summary label="降级区" value={`${data.demoteCount} 人`} />
        <Summary label="结算时间" value={fmtDateTime(data.settledAt)} />
      </div>

      {data.entries.length === 0 ? (
        <div style={{ color: '#6b7280' }}>该分组暂无成员。</div>
      ) : (
        <table style={{ width: '100%', borderCollapse: 'collapse', background: 'white' }}>
          <thead>
            <tr style={{ textAlign: 'left', color: '#6b7280', fontSize: 12 }}>
              <th style={th}>排名</th>
              <th style={th}>用户</th>
              <th style={th}>邮箱</th>
              <th style={th}>本周 XP</th>
              <th style={th}>预计结果</th>
              <th style={th}>下周段位</th>
              <th style={th}>奖励</th>
              <th style={th}>加入时间</th>
            </tr>
          </thead>
          <tbody>
            {data.entries.map((entry) => (
              <tr key={entry.user.id} style={{ borderTop: '1px solid #e5e7eb' }}>
                <td style={{ ...td, fontWeight: 800 }}>#{entry.rank}</td>
                <td style={{ ...td, fontWeight: 700 }}>{entry.user.nickname}</td>
                <td style={{ ...td, color: '#6b7280', fontSize: 13 }}>{entry.user.email}</td>
                <td style={{ ...td, fontWeight: 700 }}>{entry.weeklyXp}</td>
                <td style={td}>
                  <span style={resultStyle(entry.result)}>{RESULT_LABEL[entry.result]}</span>
                </td>
                <td style={td}>{TIER_LABEL[entry.nextTier] ?? entry.nextTier}</td>
                <td style={td}>{entry.gemsAwarded} 宝石</td>
                <td style={{ ...td, color: '#6b7280', fontSize: 12 }}>
                  {fmtDateTime(entry.joinedAt)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

function Summary({ label, value }: { label: string; value: string }) {
  return (
    <div style={summaryItem}>
      <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 4 }}>{label}</div>
      <div style={{ fontWeight: 800 }}>{value}</div>
    </div>
  );
}

const backLink: React.CSSProperties = {
  display: 'inline-block',
  marginBottom: 16,
  color: '#2563eb',
  textDecoration: 'none',
  fontWeight: 700,
};
const summaryGrid: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
  gap: 12,
  marginBottom: 20,
};
const summaryItem: React.CSSProperties = {
  background: 'white',
  border: '1px solid #e5e7eb',
  borderRadius: 8,
  padding: 12,
};
const th: React.CSSProperties = { padding: '8px 12px', fontWeight: 600 };
const td: React.CSSProperties = { padding: '10px 12px' };
const pill: React.CSSProperties = {
  display: 'inline-block',
  padding: '2px 8px',
  borderRadius: 999,
  fontSize: 12,
  fontWeight: 700,
};
const resultBox: React.CSSProperties = {
  background: '#f0fdf4',
  border: '1px solid #bbf7d0',
  borderRadius: 8,
  padding: 12,
  marginBottom: 16,
  fontSize: 14,
};
