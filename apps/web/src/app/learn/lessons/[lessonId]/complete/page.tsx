'use client';

import { useMemo } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Flame, Gem, Sparkles } from 'lucide-react';
import { Mascot } from '@/components/Mascot';

const CONFETTI_COLORS = ['#58CC02', '#1CB0F6', '#FFC800', '#FF4B4B', '#CE82FF', '#FF9600'];

export default function CompletePage() {
  const params = useSearchParams();
  const xp = Number(params.get('xp') ?? 0);
  const gems = Number(params.get('gems') ?? 0);
  const streak = Number(params.get('streak') ?? 0);
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

        <div className="grid w-full grid-cols-3 gap-3">
          <Stat icon={<Sparkles className="h-7 w-7 text-sz-gold-dark" />} label="XP" value={xp} tint="gold" />
          <Stat icon={<Gem className="h-7 w-7 text-sz-sky-dark" />} label="宝石" value={gems} tint="sky" />
          <Stat icon={<Flame className="h-7 w-7 text-sz-orange-dark" />} label="连胜" value={streak} tint="orange" />
        </div>

        <div className="mt-2 flex w-full flex-col gap-3">
          <Link href="/learn" className="btn-primary w-full px-8 py-4 text-lg">
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
  icon,
  label,
  value,
  tint,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  tint: 'gold' | 'sky' | 'orange';
}) {
  const bg = {
    gold: 'border-sz-gold bg-yellow-50',
    sky: 'border-sz-sky bg-sky-50',
    orange: 'border-sz-orange bg-orange-50',
  }[tint];
  return (
    <motion.div
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay: 0.5, type: 'spring' }}
      className={`rounded-2xl border-2 border-b-[6px] ${bg} p-4`}
    >
      <div className="flex justify-center">{icon}</div>
      <div className="mt-2 text-2xl font-heavy text-sz-ink">+{value}</div>
      <div className="text-xs font-heavy uppercase tracking-wider text-sz-ink-soft">{label}</div>
    </motion.div>
  );
}
