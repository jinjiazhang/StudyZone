import clsx from 'clsx';

type MascotMood = 'happy' | 'cheer' | 'sad' | 'wink';
type MascotAnimation = 'idle' | 'wave' | 'thinking' | 'celebrate' | 'none';

const moodAssets: Record<MascotMood, string> = {
  happy: '/assets/mascot/mascot-idle.png',
  wink: '/assets/mascot/mascot-wave.png',
  sad: '/assets/mascot/mascot-thinking.png',
  cheer: '/assets/mascot/mascot-celebrate.png',
};

const animationAssets: Record<Exclude<MascotAnimation, 'none'>, string> = {
  idle: '/assets/mascot/mascot-idle.png',
  wave: '/assets/mascot/mascot-wave.png',
  thinking: '/assets/mascot/mascot-thinking.png',
  celebrate: '/assets/mascot/mascot-celebrate.png',
};

const animationClasses: Record<MascotAnimation, string> = {
  idle: 'animate-[szMascotFloat_2.8s_ease-in-out_infinite]',
  wave: 'animate-[szMascotWave_1.1s_ease-in-out_infinite]',
  thinking: 'animate-[szMascotThink_2.4s_ease-in-out_infinite]',
  celebrate: 'animate-[szMascotJump_0.9s_cubic-bezier(.2,.9,.3,1.1)_infinite]',
  none: '',
};

/**
 * StudyZone's imagegen mascot. Each pose is a pre-cropped 512px image derived
 * from the original concept sheet, so component sizing stays predictable.
 */
export function Mascot({
  size = 96,
  mood = 'happy',
  animation,
  className,
}: {
  size?: number;
  mood?: MascotMood;
  animation?: MascotAnimation;
  className?: string;
}) {
  const activeAnimation = animation ?? animationForMood(mood);
  const src = activeAnimation === 'none' ? moodAssets[mood] : animationAssets[activeAnimation];

  return (
    <span
      aria-hidden
      className={clsx(
        'relative inline-flex shrink-0 select-none items-center justify-center overflow-hidden',
        className,
      )}
      style={{
        width: size,
        height: size,
      }}
    >
      <img
        src={src}
        alt=""
        draggable={false}
        className={clsx(
          'block h-full w-full object-contain motion-reduce:animate-none',
          animationClasses[activeAnimation],
        )}
      />
    </span>
  );
}

function animationForMood(mood: MascotMood): MascotAnimation {
  if (mood === 'cheer') return 'celebrate';
  if (mood === 'wink') return 'wave';
  if (mood === 'sad') return 'thinking';
  return 'idle';
}

/** Speech bubble that pairs with the Mascot. */
export function SpeechBubble({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={clsx(
        'relative max-w-md rounded-2xl border-2 border-sz-line bg-white px-5 py-4 text-base font-heavy text-sz-ink',
        className,
      )}
    >
      {children}
      <span
        aria-hidden
        className="absolute -left-3 top-6 h-4 w-4 rotate-45 border-b-2 border-l-2 border-sz-line bg-white"
      />
    </div>
  );
}
