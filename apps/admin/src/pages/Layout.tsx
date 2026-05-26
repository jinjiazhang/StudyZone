import { Link, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../state';

export function Layout() {
  const navigate = useNavigate();
  const email = useAuth((s) => s.email);
  const clear = useAuth((s) => s.clear);

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '220px 1fr', minHeight: '100vh' }}>
      <aside
        style={{
          background: 'white',
          borderRight: '1px solid #e5e7eb',
          padding: 24,
          display: 'flex',
          flexDirection: 'column',
          gap: 8,
        }}
      >
        <div style={{ fontWeight: 800, fontSize: 18, color: '#3FB984' }}>
          🦊 StudyZone
        </div>
        <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 12 }}>{email}</div>
        <Link to="/courses" style={nav}>课程管理</Link>
        <Link to="/users" style={nav}>用户管理</Link>
        <button
          onClick={() => {
            clear();
            navigate('/login');
          }}
          style={{
            marginTop: 'auto',
            padding: 8,
            background: 'none',
            border: '1px solid #ef4444',
            color: '#ef4444',
            borderRadius: 8,
            cursor: 'pointer',
          }}
        >
          退出
        </button>
      </aside>
      <main style={{ padding: 32 }}>
        <Outlet />
      </main>
    </div>
  );
}

const nav: React.CSSProperties = {
  padding: '8px 12px',
  borderRadius: 8,
  color: '#1f2937',
  textDecoration: 'none',
  fontWeight: 600,
};
