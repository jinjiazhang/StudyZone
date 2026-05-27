'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';
import { useAuthStore } from '@/lib/auth-store';
import { Mascot, SpeechBubble } from '@/components/Mascot';

export default function LoginPage() {
  const [email, setEmail] = useState('demo@studyzone.dev');
  const [password, setPassword] = useState('studyzone');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const setAuth = useAuthStore((s) => s.setAuth);
  const router = useRouter();

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await api.login({ email, password });
      setAuth({
        accessToken: res.tokens.accessToken,
        refreshToken: res.tokens.refreshToken,
        user: res.user,
      });
      router.push('/learn');
    } catch (err: any) {
      setError(err?.body?.message ?? '登录失败');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="relative mx-auto flex min-h-screen max-w-md flex-col gap-6 px-6 py-10">
      <Link href="/" className="text-sm font-heavy uppercase tracking-wider text-sz-ink-soft hover:text-sz-ink">
        ← 返回
      </Link>

      <div className="flex items-end gap-3">
        <Mascot size={104} mood="wink" />
        <SpeechBubble>欢迎回来！准备好继续学习了吗？</SpeechBubble>
      </div>

      <h1 className="text-3xl font-heavy text-sz-ink">登录账号</h1>

      <form onSubmit={onSubmit} className="flex flex-col gap-4">
        <Field label="邮箱">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="input"
            placeholder="you@studyzone.dev"
          />
        </Field>
        <Field label="密码">
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="input"
            placeholder="••••••••"
          />
        </Field>
        {error && (
          <div className="flex items-center gap-2 rounded-2xl border-2 border-sz-rose bg-rose-50 px-4 py-3 text-sm font-heavy text-sz-rose-dark">
            ⚠️ {error}
          </div>
        )}
        <button type="submit" disabled={loading} className="btn-primary mt-2">
          {loading ? '登录中…' : '登 录'}
        </button>
        <Link
          href="/register"
          className="text-center text-sm font-heavy uppercase tracking-wider text-sz-ink-soft hover:text-sz-green-dark"
        >
          还没有账号？立即注册
        </Link>
      </form>
    </main>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1.5 text-xs font-heavy uppercase tracking-wider text-sz-ink-soft">
      <span>{label}</span>
      {children}
    </label>
  );
}
