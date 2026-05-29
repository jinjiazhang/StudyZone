import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../state';

const TIER_LABEL: Record<string, string> = {
  bronze: '青铜',
  silver: '白银',
  gold: '黄金',
  sapphire: '蓝宝石',
  ruby: '红宝石',
  emerald: '翡翠',
  diamond: '钻石',
};

function fmtDate(iso: string) {
  return new Date(iso).toISOString().slice(0, 10);
}

export function Leagues() {
  const qc = useQueryClient();
  const [weekStart, setWeekStart] = useState<string>('');

  const { data, isLoading } = useQuery({
    queryKey: ['admin-leagues', weekStart],
    queryFn: () => api.getAdminLeagues(weekStart || undefined),
  });

  const settle = useMutation({
    mutationFn: (ws?: string) => api.settleAdminLeagues(ws),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-leagues'] });
    },
  });

  return (
    <div>
      <h1 style={{ fontSize: 24, marginBottom: 16 }}>联赛管理</h1>

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          marginBottom: 20,
          flexWrap: 'wrap',
        }}
      >
        <label style={{ fontSize: 13, color: '#6b7280' }}>
          联赛周（周一 UTC）：
          <input
            type="date"
            value={weekStart ? fmtDate(weekStart) : ''}
            onChange={(e) =>
              setWeekStart(e.target.value ? new Date(e.target.value).toISOString() : '')
            }
            style={{
              marginLeft: 8,
              padding: '6px 8px',
              border: '1px solid #d1d5db',
              borderRadius: 8,
            }}
          />
        </label>
        {weekStart && (
          <button onClick={() => setWeekStart('')} style={btnGhost}>
            本周
          </button>
        )}
        <div style={{ flex: 1 }} />
        <button
          onClick={() => settle.mutate(weekStart || undefined)}
          disabled={settle.isPending}
          style={btnPrimary}
        >
          {settle.isPending ? '结算中…' : weekStart ? '结算所选周' : '结算上一周'}
        </button>
      </div>

      {settle.data && (
        <div style={resultBox}>
          已结算 <b>{settle.data.groupsSettled}</b> 个分组 ·{' '}
          <b>{settle.data.playersSettled}</b> 名玩家 · 晋级{' '}
          <b style={{ color: '#16a34a' }}>{settle.data.promoted}</b> · 降级{' '}
          <b style={{ color: '#dc2626' }}>{settle.data.demoted}</b>（
          {fmtDate(settle.data.weekStart)} 周）
        </div>
      )}
      {settle.isError && (
        <div style={{ ...resultBox, background: '#fef2f2', color: '#dc2626' }}>
          结算失败：{(settle.error as Error)?.message}
        </div>
      )}

      {isLoading ? (
        <div style={{ color: '#6b7280' }}>加载中…</div>
      ) : !data || data.groups.length === 0 ? (
        <div style={{ color: '#6b7280' }}>该周暂无联赛分组。</div>
      ) : (
        <>
          <div style={{ fontSize: 13, color: '#6b7280', marginBottom: 12 }}>
            {fmtDate(data.weekStart)} 周 · 共 {data.groups.length} 个分组 ·{' '}
            {data.totalPlayers} 名玩家
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse', background: 'white' }}>
            <thead>
              <tr style={{ textAlign: 'left', color: '#6b7280', fontSize: 12 }}>
                <th style={th}>段位</th>
                <th style={th}>分组 ID</th>
                <th style={th}>人数 / 容量</th>
                <th style={th}>状态</th>
                <th style={th}>结算时间</th>
              </tr>
            </thead>
            <tbody>
              {data.groups.map((g) => (
                <tr key={g.id} style={{ borderTop: '1px solid #e5e7eb' }}>
                  <td style={td}>{TIER_LABEL[g.tier] ?? g.tier}</td>
                  <td style={{ ...td, fontFamily: 'monospace', fontSize: 12 }}>{g.id}</td>
                  <td style={td}>
                    {g.memberCount} / {g.capacity}
                  </td>
                  <td style={td}>
                    <span
                      style={{
                        padding: '2px 8px',
                        borderRadius: 999,
                        fontSize: 12,
                        background: g.status === 'settled' ? '#dcfce7' : '#e0f2fe',
                        color: g.status === 'settled' ? '#16a34a' : '#0369a1',
                      }}
                    >
                      {g.status === 'settled' ? '已结算' : '进行中'}
                    </span>
                  </td>
                  <td style={{ ...td, color: '#6b7280', fontSize: 12 }}>
                    {g.settledAt ? new Date(g.settledAt).toLocaleString() : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}
    </div>
  );
}

const th: React.CSSProperties = { padding: '8px 12px', fontWeight: 600 };
const td: React.CSSProperties = { padding: '10px 12px' };
const btnPrimary: React.CSSProperties = {
  padding: '8px 16px',
  background: '#3FB984',
  color: 'white',
  border: 'none',
  borderRadius: 8,
  fontWeight: 700,
  cursor: 'pointer',
};
const btnGhost: React.CSSProperties = {
  padding: '6px 12px',
  background: 'none',
  border: '1px solid #d1d5db',
  borderRadius: 8,
  cursor: 'pointer',
};
const resultBox: React.CSSProperties = {
  background: '#f0fdf4',
  border: '1px solid #bbf7d0',
  borderRadius: 8,
  padding: 12,
  marginBottom: 16,
  fontSize: 14,
};
