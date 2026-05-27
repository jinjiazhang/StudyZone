type AnswerResult = 'correct' | 'wrong';

const SOUND_SRC: Record<AnswerResult, string> = {
  correct: '/assets/sounds/answer-correct.wav',
  wrong: '/assets/sounds/answer-wrong.wav',
};

let sounds: Partial<Record<AnswerResult, HTMLAudioElement>> = {};

function getSound(result: AnswerResult) {
  if (typeof window === 'undefined') return null;

  sounds[result] ??= new Audio(SOUND_SRC[result]);
  const sound = sounds[result]!;
  sound.preload = 'auto';
  sound.volume = 0.75;
  return sound;
}

export function preloadAnswerSounds() {
  getSound('correct')?.load();
  getSound('wrong')?.load();
}

export function playAnswerSound(result: AnswerResult) {
  const sound = getSound(result);
  if (!sound) return;

  sound.pause();
  sound.currentTime = 0;
  void sound.play().catch(() => {
    // Browsers can reject playback if sound is disabled or the interaction was not trusted.
  });
}
