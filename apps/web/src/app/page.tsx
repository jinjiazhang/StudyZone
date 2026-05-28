import Link from 'next/link';
import {
  ChevronDown,
  Flame,
  GraduationCap,
  ShieldCheck,
  Star,
} from 'lucide-react';

const footerColumns = [
  ['关于我们', '课程体系', '学习方法', '帮助中心'],
  ['语文', '数学', '英语', '拼音'],
  ['隐私政策', '服务条款', '联系我们', '开源项目'],
  ['博客', '社区', '家长中心', '学校合作'],
];

export default function LandingPage() {
  return (
    <main className="flex min-h-screen flex-col bg-white text-[#3c3c3c]">
      <header className="border-b-2 border-[#e5e5e5] bg-white">
        <div className="mx-auto flex h-[70px] max-w-[1065px] items-center justify-between px-5">
          <Link href="/" className="brand-logo" aria-label="StudyZone 首页">
            StudyZone
          </Link>
          <button className="inline-flex items-center gap-2 text-[15px] font-heavy uppercase tracking-[.8px] text-[#777]">
            网站语言：中文
            <ChevronDown size={18} strokeWidth={3} />
          </button>
        </div>
      </header>

      <section className="mx-auto grid w-full max-w-[1065px] flex-1 items-center gap-8 px-5 py-[58px] md:grid-cols-[1.08fr_.92fr] md:py-10">
        <HeroIllustration />
        <div className="mx-auto flex w-full max-w-[430px] flex-col items-center text-center">
          <h1 className="text-[40px] font-heavy leading-[1.18] text-[#4b4b4b] sm:text-[46px]">
            学习课内知识，寓教于乐。
          </h1>
          <div className="mt-10 flex w-full flex-col gap-4">
            <Link href="/register" className="duo-home-button duo-home-button-primary">
              开始学习
            </Link>
            <Link href="/login" className="duo-home-button duo-home-button-secondary">
              已有帐号
            </Link>
          </div>
        </div>
      </section>

      <footer className="mt-auto border-t-2 border-[#e5e5e5] bg-[#58cc02] text-white">
        <div className="mx-auto grid max-w-[1065px] gap-8 px-5 py-8 md:grid-cols-[220px_1fr]">
          <div>
            <div className="text-[30px] font-heavy lowercase leading-none">studyzone</div>
            <p className="mt-3 text-[15px] font-bold leading-6 text-white/80">
              免费、有趣、看得见进步。
            </p>
          </div>
          <div className="grid gap-5 sm:grid-cols-4">
            {footerColumns.map((column, index) => (
              <div key={index} className="space-y-2">
                {column.map((item) => (
                  <Link key={item} href="/" className="block text-[15px] font-heavy text-white/80 hover:text-white">
                    {item}
                  </Link>
                ))}
              </div>
            ))}
          </div>
        </div>
      </footer>
    </main>
  );
}

function HeroIllustration() {
  return (
    <div className="relative mx-auto h-[360px] w-full max-w-[560px] md:h-[430px]" aria-hidden>
      <div className="absolute left-1/2 top-[34px] h-[286px] w-[286px] -translate-x-1/2 rounded-full bg-[#d7ffb8]" />
      <div className="absolute left-1/2 top-[72px] h-[210px] w-[210px] -translate-x-1/2 rounded-full bg-[#58cc02]" />
      <div className="absolute left-1/2 top-[102px] grid h-[150px] w-[150px] -translate-x-1/2 place-items-center rounded-full bg-white text-[#58cc02] shadow-[0_6px_0_#58a700] animate-[studyPulse_3.5s_ease-in-out_infinite]">
        <GraduationCap size={82} strokeWidth={2.7} />
      </div>
      <div className="absolute left-[35px] top-[52px] animate-[floatCard_5s_ease-in-out_infinite]">
        <MiniBadge icon={<Flame size={21} fill="currentColor" />} label="12 天" color="orange" />
      </div>
      <div className="absolute right-[28px] top-[128px] animate-[floatCard_5.4s_ease-in-out_.25s_infinite]">
        <MiniBadge icon={<Star size={21} fill="currentColor" />} label="+25 XP" color="gold" />
      </div>
      <div className="absolute bottom-[60px] left-[84px] animate-[floatCard_5.8s_ease-in-out_.45s_infinite]">
        <MiniBadge icon={<ShieldCheck size={21} />} label="86%" color="sky" />
      </div>
    </div>
  );
}

function MiniBadge({
  icon,
  label,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  color: 'orange' | 'gold' | 'sky';
}) {
  const colors = {
    orange: 'text-[#ff9600]',
    gold: 'text-[#ffc800]',
    sky: 'text-[#1cb0f6]',
  }[color];

  return (
    <div className="inline-flex items-center gap-2 rounded-2xl border-2 border-[#e5e5e5] bg-white px-4 py-3 shadow-[0_4px_0_rgba(0,0,0,.12)]">
      <span className={colors}>{icon}</span>
      <span className="text-[18px] font-heavy text-[#4b4b4b]">{label}</span>
    </div>
  );
}
