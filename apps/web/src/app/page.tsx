import Link from 'next/link';
import { Mascot } from '@/components/Mascot';

export default function LandingPage() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-white">
      {/* decorative blobs */}
      <div className="pointer-events-none absolute -left-32 top-10 h-72 w-72 rounded-full bg-sz-green-soft blur-3xl opacity-60" />
      <div className="pointer-events-none absolute -right-24 top-40 h-72 w-72 rounded-full bg-sky-100 blur-3xl opacity-70" />
      <div className="pointer-events-none absolute bottom-10 left-1/3 h-60 w-60 rounded-full bg-yellow-100 blur-3xl opacity-60" />

      <div className="relative mx-auto max-w-6xl px-6 py-10">
        <header className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Mascot size={44} />
            <span className="text-2xl font-heavy text-sz-green">StudyZone</span>
          </div>
          <Link
            href="/login"
            className="text-sm font-heavy uppercase tracking-wider text-sz-ink-soft hover:text-sz-green-dark"
          >
            登录 →
          </Link>
        </header>

        <section className="mt-16 grid items-center gap-12 md:mt-24 md:grid-cols-2">
          <div>
            <span className="inline-flex rounded-full bg-sz-green-soft px-4 py-1.5 text-sm font-heavy uppercase tracking-wider text-sz-green-dark">
              🦊 每天 15 分钟
            </span>
            <h1 className="mt-5 text-5xl font-heavy leading-tight text-sz-ink md:text-6xl">
              让学习
              <br />
              变成<span className="text-sz-green"> 游戏</span>
              <span className="text-sz-orange"> 🎮</span>
            </h1>
            <p className="mt-6 max-w-md text-lg font-bold text-sz-ink-soft">
              英语、数学、音乐……一套关卡机制，把所有学科变成你愿意每天打卡的小冒险。
            </p>
            <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <Link
                href="/register"
                className="btn-primary w-full px-8 py-4 text-lg sm:w-56"
              >
                开始学习 →
              </Link>
              <Link
                href="/login"
                className="btn-secondary w-full px-8 py-4 text-lg sm:w-56"
              >
                我已注册
              </Link>
            </div>
            <p className="mt-6 text-sm font-bold text-sz-ink-soft">
              示例账号：
              <code className="rounded-lg border-2 border-sz-line bg-sz-mist px-2 py-0.5 text-sz-ink">
                demo@studyzone.dev / studyzone
              </code>
            </p>
          </div>

          <div className="relative">
            <div className="absolute -top-6 left-10 hidden animate-wiggle md:block">
              <Mascot size={120} mood="cheer" />
            </div>
            <div className="grid grid-cols-2 gap-4 rounded-3xl border-2 border-sz-line bg-white p-6 shadow-pop-lg md:ml-32 md:mt-24">
              <Stat label="支持学科" value="多学科" emoji="📚" tint="green" />
              <Stat label="题型种类" value="8+" emoji="🎯" tint="sky" />
              <Stat label="连胜机制" value="每日 🔥" emoji="🔥" tint="orange" />
              <Stat label="周联赛" value="7 段位" emoji="🏆" tint="gold" />
            </div>
          </div>
        </section>

        {/* Feature row */}
        <section className="mt-24 grid gap-6 md:grid-cols-3">
          <Feature emoji="🗺️" title="一张大地图" tint="green">
            像走通关一样推进每一节小课，目标随时看得见。
          </Feature>
          <Feature emoji="❤️" title="生命系统" tint="rose">
            做错会扣心，逼你认真——但 5 颗心吃完就要等回血或买宝石。
          </Feature>
          <Feature emoji="🏆" title="每周联赛" tint="gold">
            跟其他学习者拼 XP，每周一晋升或降级，竞争才有动力。
          </Feature>
        </section>

        <footer className="mt-24 pb-10 text-center text-sm font-bold text-sz-ink-soft">
          StudyZone · 个人学习园地 · 一个开源的多邻国式学习平台
        </footer>
      </div>
    </main>
  );
}

function Stat({
  label,
  value,
  emoji,
  tint,
}: {
  label: string;
  value: string;
  emoji: string;
  tint: 'green' | 'sky' | 'orange' | 'gold';
}) {
  const bg = {
    green: 'bg-sz-green-soft',
    sky: 'bg-sky-100',
    orange: 'bg-orange-100',
    gold: 'bg-yellow-100',
  }[tint];
  return (
    <div className={`rounded-2xl ${bg} p-4`}>
      <div className="text-3xl">{emoji}</div>
      <div className="mt-2 text-2xl font-heavy text-sz-ink">{value}</div>
      <div className="text-xs font-bold uppercase tracking-wider text-sz-ink-soft">{label}</div>
    </div>
  );
}

function Feature({
  emoji,
  title,
  tint,
  children,
}: {
  emoji: string;
  title: string;
  tint: 'green' | 'rose' | 'gold';
  children: React.ReactNode;
}) {
  const ring = {
    green: 'border-sz-green',
    rose: 'border-sz-rose',
    gold: 'border-sz-gold',
  }[tint];
  return (
    <div className={`rounded-3xl border-b-[6px] ${ring} border-2 bg-white p-6`}>
      <div className="text-4xl">{emoji}</div>
      <h3 className="mt-3 text-xl font-heavy text-sz-ink">{title}</h3>
      <p className="mt-2 font-bold text-sz-ink-soft">{children}</p>
    </div>
  );
}
