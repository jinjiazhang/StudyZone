'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';
import { useAuthStore } from '@/lib/auth-store';

export default function RegisterPage() {
  const [email, setEmail] = useState('');
  const [nickname, setNickname] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const setAuth = useAuthStore((s) => s.setAuth);
  const router = useRouter();

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await api.register({ email, nickname, password } as any);
      setAuth({
        accessToken: res.tokens.accessToken,
        refreshToken: res.tokens.refreshToken,
        user: res.user,
      });
      router.push('/learn');
    } catch (err: any) {
      setError(err?.body?.message ?? '注册失败');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto flex max-w-md flex-col gap-6 px-6 py-16">
      <Link href="/" className="text-sm text-sz-ink/60 hover:text-sz-ink">
        ← 返回
      </Link>
      <h1 className="text-3xl font-extrabold text-sz-ink">加入 StudyZone 🚀</h1>
      <form onSubmit={onSubmit} className="card flex flex-col gap-4">
        <Field label="昵称">
          <input
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            minLength={2}
            maxLength={30}
            required
            className="w-full rounded-chunky border-2 border-sz-ink/10 px-4 py-3 focus:border-sz-green focus:outline-none"
          />
        </Field>
        <Field label="邮箱">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full rounded-chunky border-2 border-sz-ink/10 px-4 py-3 focus:border-sz-green focus:outline-none"
          />
        </Field>
        <Field label="密码（至少 8 位）">
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            minLength={8}
            required
            className="w-full rounded-chunky border-2 border-sz-ink/10 px-4 py-3 focus:border-sz-green focus:outline-none"
          />
        </Field>
        {error && <div className="rounded-chunky bg-rose-50 p-3 text-sm text-sz-rose">{error}</div>}
        <button type="submit" disabled={loading} className="btn-primary disabled:opacity-50">
          {loading ? '注册中…' : '注册并开始学习'}
        </button>
        <Link href="/login" className="text-center text-sm text-sz-ink/60 hover:text-sz-green">
          已有账号？去登录
        </Link>
      </form>
    </main>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1.5 text-sm font-bold text-sz-ink/70">
      <span>{label}</span>
      {children}
    </label>
  );
}
