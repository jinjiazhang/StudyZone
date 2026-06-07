import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, useAuth } from '../state';

export function Login() {
  const [email, setEmail] = useState('tiantianzh@qq.com');
  const [password, setPassword] = useState('00000000');
  const [err, setErr] = useState<string | null>(null);
  const set = useAuth((s) => s.set);
  const navigate = useNavigate();

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    try {
      const res = await api.login({ email, password });
      set({ accessToken: res.tokens.accessToken, email });
      navigate('/courses');
    } catch (e: any) {
      setErr(e?.body?.message ?? '登录失败');
    }
  }

  return (
    <div style={{ maxWidth: 360, margin: '120px auto', padding: 24 }}>
      <h1 style={{ fontSize: 24, marginBottom: 16 }}>StudyZone Admin</h1>
      <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="邮箱" style={input} />
        <input
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          type="password"
          placeholder="密码"
          style={input}
        />
        {err && <div style={{ color: '#dc2626', fontSize: 13 }}>{err}</div>}
        <button type="submit" style={button}>登录</button>
      </form>
    </div>
  );
}

const input: React.CSSProperties = {
  padding: 10,
  borderRadius: 8,
  border: '1px solid #cbd5e1',
  fontSize: 14,
};
const button: React.CSSProperties = {
  padding: 10,
  borderRadius: 8,
  border: 'none',
  background: '#3FB984',
  color: 'white',
  fontWeight: 700,
  cursor: 'pointer',
};
