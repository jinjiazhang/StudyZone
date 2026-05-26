'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Flame, Gem, Sparkles } from 'lucide-react';

export default function CompletePage() {
  const params = useSearchParams();
  const xp = Number(params.get('xp') ?? 0);
  const gems = Number(params.get('gems') ?? 0);
  const streak = Number(params.get('streak') ?? 0);
  const router = useRouter();

  return (
    <main className="mx-auto flex max-w-md flex-col gap-6 px-6 py-16 text-center">
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring' }}
        className="mx-auto text-7xl"
      >
        🎉
      </motion.div>
      <h1 className="text-3xl font-extrabold text-sz-ink">关卡完成！</h1>

      <div className="grid grid-cols-3 gap-3">
        <Stat icon={<Sparkles className="h-6 w-6 text-sz-gold" />} label="XP" value={xp} />
        <Stat icon={<Gem className="h-6 w-6 text-sky-500" />} label="宝石" value={gems} />
        <Stat icon={<Flame className="h-6 w-6 text-orange-500" />} label="连胜" value={streak} />
      </div>

      <Link href="/learn" className="btn-primary">
        继续学习
      </Link>
      <button onClick={() => router.back()} className="btn-secondary">
        再练一次
      </button>
    </main>
  );
}

function Stat({ icon, label, value }: { icon: React.ReactNode; label: string; value: number }) {
  return (
    <div className="card text-center">
      <div className="flex justify-center">{icon}</div>
      <div className="mt-2 text-2xl font-extrabold">{value}</div>
      <div className="text-xs text-sz-ink/60">{label}</div>
    </div>
  );
}
