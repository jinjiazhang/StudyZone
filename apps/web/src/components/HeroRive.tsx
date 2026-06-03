'use client';

import Rive, { Alignment, Fit, Layout } from '@rive-app/react-canvas';

const heroLayout = new Layout({
  fit: Fit.Contain,
  alignment: Alignment.Center,
});

const HERO_RIVE_SRC = '/assets/rive/math/duo-clock.riv';

export function HeroRive({ className }: { className?: string }) {
  return (
    <Rive
      className={className}
      src={HERO_RIVE_SRC}
      stateMachines="Mega_Path_StateMachine"
      layout={heroLayout}
      shouldDisableRiveListeners
    />
  );
}
