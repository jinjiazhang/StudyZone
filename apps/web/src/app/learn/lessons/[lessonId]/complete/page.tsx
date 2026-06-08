'use client';

import { useMemo } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Mascot } from '@/components/Mascot';

const CONFETTI_COLORS = ['#58CC02', '#1CB0F6', '#FFC800', '#FF4B4B', '#CE82FF', '#FF9600'];

export default function CompletePage() {
  const params = useSearchParams();
  const xp = Number(params.get('xp') ?? 0);
  const gems = Number(params.get('gems') ?? 0);
  const streak = Number(params.get('streak') ?? 0);
  const courseId = params.get('courseId');
  const continueHref = courseId ? `/learn/courses/${courseId}` : '/learn';
  const router = useRouter();

  // Pre-compute confetti so they re-render the same on every paint
  const pieces = useMemo(
    () =>
      Array.from({ length: 80 }).map((_, i) => ({
        left: Math.random() * 100,
        delay: Math.random() * 1.4,
        color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
        size: 8 + Math.random() * 8,
      })),
    [],
  );

  return (
    <main className="relative min-h-screen overflow-hidden bg-gradient-to-b from-sz-green-soft via-white to-white">
      {/* confetti */}
      <div className="pointer-events-none absolute inset-0">
        {pieces.map((p, i) => (
          <span
            key={i}
            className="confetti-piece"
            style={{
              left: `${p.left}%`,
              background: p.color,
              width: `${p.size}px`,
              height: `${p.size * 1.6}px`,
              animationDelay: `${p.delay}s`,
            }}
          />
        ))}
      </div>

      <div className="relative mx-auto flex max-w-md flex-col items-center gap-6 px-6 py-16 text-center">
        <motion.div
          initial={{ scale: 0, rotate: -30 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: 'spring', stiffness: 220, damping: 14 }}
        >
          <Mascot size={176} mood="cheer" />
        </motion.div>
        <motion.h1
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-4xl font-heavy text-sz-green-dark"
        >
          关卡完成！
        </motion.h1>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="text-base font-heavy text-sz-ink-soft"
        >
          坚持就是胜利，明天也来呀！
        </motion.p>

        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="flex w-full flex-col gap-3"
        >
          <div className="flex items-center gap-3 rounded-2xl border-2 border-b-[6px] border-sz-gold bg-yellow-50 px-5 py-4">
            <span className="flex h-9 w-9 items-center justify-center">
              <img src="/assets/icons/xp.svg" alt="" draggable={false} className="h-8 w-8" />
            </span>
            <span className="font-display text-3xl font-heavy text-sz-gold-dark">+{xp} XP</span>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Stat src="/assets/icons/diamond.svg" iconClass="h-7 w-6" value={gems} tint="sky" />
            <Stat src="/assets/icons/streak.svg" iconClass="h-7 w-6" value={streak} tint="orange" />
          </div>
        </motion.div>

        <div className="mt-2 flex w-full flex-col gap-3">
          <Link href={continueHref} className="btn-primary w-full px-8 py-4 text-lg">
            继续学习
          </Link>
          <button onClick={() => router.back()} className="btn-secondary w-full">
            再练一次
          </button>
        </div>
      </div>
    </main>
  );
}

function Stat({
  src,
  iconClass,
  value,
  tint,
}: {
  src: string;
  iconClass: string;
  value: number;
  tint: 'sky' | 'orange';
}) {
  const border = {
    sky: 'border-sz-sky',
    orange: 'border-sz-orange',
  }[tint];
  return (
    <div className={`flex h-[90px] items-center justify-center gap-2.5 rounded-2xl border-2 border-b-[6px] bg-sz-mist p-3 ${border}`}>
      <img src={src} alt="" draggable={false} className={iconClass} />
      <span className="font-display text-2xl font-heavy text-sz-ink">+{value}</span>
    </div>
  );
}
