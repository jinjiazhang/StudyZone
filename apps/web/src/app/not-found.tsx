import Link from 'next/link';
import { Mascot } from '@/components/Mascot';

export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-5 p-6 text-center">
      <Mascot size={120} mood="sad" />
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-heavy text-sz-ink">404</h1>
        <p className="max-w-xs font-bold text-sz-ink-soft">这个页面走丢了，回去继续学习吧。</p>
      </div>
      <Link href="/learn" className="btn-primary px-8">
        回到学习
      </Link>
    </main>
  );
}
