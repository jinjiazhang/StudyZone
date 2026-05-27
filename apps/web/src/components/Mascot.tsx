import clsx from 'clsx';

type MascotMood = 'happy' | 'cheer' | 'sad' | 'wink';
type MascotAnimation = 'idle' | 'wave' | 'thinking' | 'celebrate' | 'none';

/**
 * StudyZone's star-tailed learning fox. Inline SVG keeps it crisp from app
 * chrome sizes up to celebration screens while letting each part animate.
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
  const isThinking = activeAnimation === 'thinking' || mood === 'sad';
  const isCheering = activeAnimation === 'celebrate' || mood === 'cheer';
  const isWaving = activeAnimation === 'wave' || mood === 'wink';

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 200 200"
      xmlns="http://www.w3.org/2000/svg"
      className={clsx('select-none overflow-visible', className)}
      aria-hidden
    >
      <style>{`
        .sz-mascot-body { transform-origin: 100px 112px; }
        .sz-mascot-tail { transform-origin: 150px 133px; }
        .sz-mascot-scarf-tail { transform-origin: 133px 118px; }
        .sz-mascot-wave-paw { transform-origin: 69px 133px; }
        .sz-mascot-sparkle { transform-origin: center; }
        .sz-mascot-idle .sz-mascot-body { animation: szMascotFloat 2.8s ease-in-out infinite; }
        .sz-mascot-idle .sz-mascot-tail,
        .sz-mascot-thinking .sz-mascot-tail { animation: szMascotTail 2.2s ease-in-out infinite; }
        .sz-mascot-wave .sz-mascot-wave-paw { animation: szMascotWave 0.9s ease-in-out infinite; }
        .sz-mascot-celebrate .sz-mascot-body { animation: szMascotJump 0.9s cubic-bezier(.2,.9,.3,1.1) infinite; }
        .sz-mascot-celebrate .sz-mascot-tail { animation: szMascotTailFast 0.7s ease-in-out infinite; }
        .sz-mascot-celebrate .sz-mascot-sparkle { animation: szMascotTwinkle 1.1s ease-in-out infinite; }
        .sz-mascot-scarf-tail { animation: szMascotScarf 1.8s ease-in-out infinite; }
        @keyframes szMascotFloat {
          0%, 100% { transform: translateY(0) scale(1); }
          50% { transform: translateY(-4px) scale(1.01); }
        }
        @keyframes szMascotJump {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          45% { transform: translateY(-12px) rotate(-2deg); }
          70% { transform: translateY(2px) rotate(1deg); }
        }
        @keyframes szMascotTail {
          0%, 100% { transform: rotate(-4deg); }
          50% { transform: rotate(8deg); }
        }
        @keyframes szMascotTailFast {
          0%, 100% { transform: rotate(-12deg); }
          50% { transform: rotate(14deg); }
        }
        @keyframes szMascotWave {
          0%, 100% { transform: rotate(-12deg); }
          50% { transform: rotate(18deg); }
        }
        @keyframes szMascotScarf {
          0%, 100% { transform: rotate(-4deg); }
          50% { transform: rotate(6deg); }
        }
        @keyframes szMascotTwinkle {
          0%, 100% { transform: scale(0.75) rotate(0deg); opacity: .55; }
          50% { transform: scale(1.12) rotate(12deg); opacity: 1; }
        }
        @media (prefers-reduced-motion: reduce) {
          .sz-mascot-body,
          .sz-mascot-tail,
          .sz-mascot-wave-paw,
          .sz-mascot-scarf-tail,
          .sz-mascot-sparkle { animation: none !important; }
        }
      `}</style>

      <g className={`sz-mascot-${activeAnimation}`}>
        {isCheering && <CelebrationSparkles />}
        <g className="sz-mascot-body">
          <ellipse cx="100" cy="180" rx="42" ry="8" fill="#D9EEF9" opacity="0.75" />

          <g className="sz-mascot-tail">
            <path
              d="M141 143 C166 141 178 126 174 103 C158 113 149 126 142 143 Z"
              fill="#FF9600"
              stroke="#3C3C3C"
              strokeWidth="4"
              strokeLinejoin="round"
            />
            <path
              d="M171 101 L177 114 L191 116 L181 126 L184 140 L171 133 L158 140 L161 126 L151 116 L165 114 Z"
              fill="#FFC800"
              stroke="#E5A500"
              strokeWidth="3"
              strokeLinejoin="round"
            />
          </g>

          <ellipse cx="100" cy="137" rx="45" ry="43" fill="#FF9600" stroke="#3C3C3C" strokeWidth="4" />
          <ellipse cx="100" cy="147" rx="27" ry="26" fill="#FFE9B0" />

          <g>
            <path
              d="M59 83 C57 50 75 34 100 36 C125 34 143 50 141 83 C148 91 151 103 148 116 C143 139 124 148 100 148 C76 148 57 139 52 116 C49 103 52 91 59 83 Z"
              fill="#FF9600"
              stroke="#3C3C3C"
              strokeWidth="4"
              strokeLinejoin="round"
            />
            <path d="M61 78 L43 30 L82 53 Z" fill="#FF9600" stroke="#3C3C3C" strokeWidth="4" strokeLinejoin="round" />
            <path d="M139 78 L157 30 L118 53 Z" fill="#FF9600" stroke="#3C3C3C" strokeWidth="4" strokeLinejoin="round" />
            <path d="M58 69 L50 43 L74 57 Z" fill="#FFE9B0" />
            <path d="M142 69 L150 43 L126 57 Z" fill="#FFE9B0" />
            <path
              d="M63 101 C68 78 82 67 100 68 C118 67 132 78 137 101 C132 126 118 136 100 136 C82 136 68 126 63 101 Z"
              fill="#FFE9B0"
            />
            <path
              d="M100 58 L105 69 L117 71 L108 79 L110 91 L100 85 L90 91 L92 79 L83 71 L95 69 Z"
              fill="#FFF9E5"
            />
          </g>

          <g>
            <circle cx="82" cy="98" r="10" fill="#3C3C3C" />
            <circle cx="118" cy="98" r="10" fill="#3C3C3C" />
            {mood === 'wink' ? (
              <path d="M73 96 Q82 90 91 96" stroke="#3C3C3C" strokeWidth="5" fill="none" strokeLinecap="round" />
            ) : (
              <>
                <circle cx="83" cy="96" r="6" fill="#08796D" />
                <circle cx="119" cy="96" r="6" fill="#08796D" />
                <circle cx="86" cy="92" r="3" fill="white" />
              </>
            )}
            <circle cx="122" cy="92" r="3" fill="white" />
            <ellipse cx="100" cy="111" rx="6" ry="4" fill="#3C3C3C" />
            {isCheering ? (
              <path
                d="M88 120 Q100 134 112 120 Q100 128 88 120 Z"
                fill="#FF4B4B"
                stroke="#3C3C3C"
                strokeWidth="3"
                strokeLinejoin="round"
              />
            ) : mood === 'sad' ? (
              <path d="M89 127 Q100 118 111 127" stroke="#3C3C3C" strokeWidth="3" fill="none" strokeLinecap="round" />
            ) : (
              <path d="M88 120 Q100 129 112 120" stroke="#3C3C3C" strokeWidth="3" fill="none" strokeLinecap="round" />
            )}
          </g>

          <g>
            <path d="M62 120 L100 128 L138 120 L128 145 L72 145 Z" fill="#58CC02" stroke="#3C3C3C" strokeWidth="4" strokeLinejoin="round" />
            <path className="sz-mascot-scarf-tail" d="M130 121 C146 117 155 120 162 130 C149 134 139 132 128 145 Z" fill="#58CC02" stroke="#3C3C3C" strokeWidth="4" strokeLinejoin="round" />
            <path d="M91 133 L104 127 L120 129" stroke="#1CB0F6" strokeWidth="5" strokeLinecap="round" />
            <path d="M111 125 L115 132 L123 133 L117 139 L118 147 L111 143 L104 147 L105 139 L99 133 L107 132 Z" fill="#FFF9E5" stroke="#FFC800" strokeWidth="2" strokeLinejoin="round" />
          </g>

          {isWaving ? <WaveArm /> : <RestingArms thinking={isThinking} />}
          {isThinking && <Pencil />}

          <ellipse cx="76" cy="176" rx="14" ry="8" fill="#FFE9B0" stroke="#3C3C3C" strokeWidth="4" />
          <ellipse cx="124" cy="176" rx="14" ry="8" fill="#FFE9B0" stroke="#3C3C3C" strokeWidth="4" />
        </g>
      </g>
    </svg>
  );
}

function animationForMood(mood: MascotMood): MascotAnimation {
  if (mood === 'cheer') return 'celebrate';
  if (mood === 'wink') return 'wave';
  if (mood === 'sad') return 'thinking';
  return 'idle';
}

function RestingArms({ thinking }: { thinking: boolean }) {
  if (thinking) {
    return (
      <g>
        <path d="M70 135 C82 136 89 144 91 157" stroke="#3C3C3C" strokeWidth="13" strokeLinecap="round" />
        <path d="M130 135 C120 139 114 147 113 158" stroke="#3C3C3C" strokeWidth="13" strokeLinecap="round" />
        <path d="M70 135 C82 136 89 144 91 157" stroke="#FF9600" strokeWidth="9" strokeLinecap="round" />
        <path d="M130 135 C120 139 114 147 113 158" stroke="#FF9600" strokeWidth="9" strokeLinecap="round" />
      </g>
    );
  }

  return (
    <g>
      <path d="M60 134 C62 150 68 160 78 166" stroke="#3C3C3C" strokeWidth="13" strokeLinecap="round" />
      <path d="M140 134 C138 150 132 160 122 166" stroke="#3C3C3C" strokeWidth="13" strokeLinecap="round" />
      <path d="M60 134 C62 150 68 160 78 166" stroke="#FF9600" strokeWidth="9" strokeLinecap="round" />
      <path d="M140 134 C138 150 132 160 122 166" stroke="#FF9600" strokeWidth="9" strokeLinecap="round" />
    </g>
  );
}

function WaveArm() {
  return (
    <g>
      <g className="sz-mascot-wave-paw">
        <path d="M71 135 C55 116 53 98 63 83" stroke="#3C3C3C" strokeWidth="14" strokeLinecap="round" />
        <path d="M71 135 C55 116 53 98 63 83" stroke="#FF9600" strokeWidth="10" strokeLinecap="round" />
        <ellipse cx="61" cy="82" rx="12" ry="14" fill="#FF9600" stroke="#3C3C3C" strokeWidth="4" transform="rotate(-18 61 82)" />
        <circle cx="57" cy="78" r="2.5" fill="#8B4A00" />
        <circle cx="63" cy="76" r="2.5" fill="#8B4A00" />
        <circle cx="68" cy="82" r="2.5" fill="#8B4A00" />
      </g>
      <path d="M140 134 C138 150 132 160 122 166" stroke="#3C3C3C" strokeWidth="13" strokeLinecap="round" />
      <path d="M140 134 C138 150 132 160 122 166" stroke="#FF9600" strokeWidth="9" strokeLinecap="round" />
    </g>
  );
}

function Pencil() {
  return (
    <g transform="rotate(-17 82 141)">
      <rect x="78" y="120" width="9" height="40" rx="3" fill="#1CB0F6" stroke="#3C3C3C" strokeWidth="3" />
      <path d="M78 120 L82.5 110 L87 120 Z" fill="#FFE9B0" stroke="#3C3C3C" strokeWidth="3" strokeLinejoin="round" />
      <path d="M80.5 113 L82.5 108 L84.5 113 Z" fill="#3C3C3C" />
    </g>
  );
}

function CelebrationSparkles() {
  return (
    <g>
      <path className="sz-mascot-sparkle" d="M156 38 L161 50 L174 54 L162 60 L157 73 L151 61 L139 56 L151 50 Z" fill="#FFC800" stroke="#E5A500" strokeWidth="3" strokeLinejoin="round" />
      <path className="sz-mascot-sparkle" d="M36 63 L40 72 L50 75 L41 80 L37 90 L32 81 L22 77 L31 72 Z" fill="#1CB0F6" opacity="0.85" />
      <circle className="sz-mascot-sparkle" cx="169" cy="92" r="5" fill="#58CC02" />
    </g>
  );
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
