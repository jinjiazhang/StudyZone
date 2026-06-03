'use client';

import Rive, { Alignment, Fit, Layout } from '@rive-app/react-canvas';
import type { UnitMapDecorationDto } from '@studyzone/shared-types';

const decorationLayout = new Layout({
  fit: Fit.Contain,
  alignment: Alignment.Center,
});

export function MapDecoration({ decoration }: { decoration: UnitMapDecorationDto }) {
  return (
    <Rive
      src={decoration.src}
      stateMachines={decoration.stateMachine}
      animations={decoration.animation}
      layout={decorationLayout}
      shouldDisableRiveListeners
      className="h-full w-full"
    />
  );
}
