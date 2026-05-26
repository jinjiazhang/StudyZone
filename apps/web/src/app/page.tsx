import Link from 'next/link';

export default function LandingPage() {
  return (
    <main className="mx-auto max-w-5xl px-6 py-16">
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-3xl">🦊</span>
          <span className="text-2xl font-extrabold text-sz-green">StudyZone</span>
        </div>
        <div className="flex gap-3">
          <Link href="/login" className="btn-secondary">
            登录
          </Link>
          <Link href="/register" className="btn-primary">
            免费注册
          </Link>
        </div>
      </header>

      <section className="mt-20 grid items-center gap-12 md:grid-cols-2">
        <div>
          <h1 className="text-5xl font-black leading-tight text-sz-ink">
            每天 <span className="text-sz-green">15 分钟</span>，让学习变成游戏
          </h1>
          <p className="mt-6 text-xl text-sz-ink/70">
            英语、数学、音乐……一套关卡机制，把所有学科变成你愿意每天打卡的小冒险。
          </p>
          <div className="mt-10 flex gap-4">
            <Link href="/register" className="btn-primary text-lg">
              开始学习 →
            </Link>
            <Link href="/login" className="btn-secondary text-lg">
              我已注册
            </Link>
          </div>
          <p className="mt-6 text-sm text-sz-ink/50">
            示例账号：<code className="rounded bg-white px-2 py-1">demo@studyzone.dev / studyzone</code>
          </p>
        </div>

        <div className="card">
          <div className="grid grid-cols-2 gap-4 text-center">
            <Stat label="支持学科" value="多学科" emoji="📚" />
            <Stat label="题型种类" value="8+" emoji="🎯" />
            <Stat label="连胜机制" value="🔥 每日" emoji="🔥" />
            <Stat label="周联赛" value="7 段位" emoji="🏆" />
          </div>
        </div>
      </section>

      <footer className="mt-24 text-center text-sm text-sz-ink/40">
        StudyZone · 个人学习园地 · 一个开源的多邻国式学习平台
      </footer>
    </main>
  );
}

function Stat({ label, value, emoji }: { label: string; value: string; emoji: string }) {
  return (
    <div className="rounded-chunky bg-sz-mist p-4">
      <div className="text-3xl">{emoji}</div>
      <div className="mt-2 text-2xl font-bold text-sz-ink">{value}</div>
      <div className="text-xs text-sz-ink/60">{label}</div>
    </div>
  );
}
