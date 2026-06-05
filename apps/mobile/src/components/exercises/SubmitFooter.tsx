import { createContext, useContext } from 'react';

/**
 * Config an exercise's `SubmitButton` publishes to the single, pinned bottom CTA
 * bar (Duolingo keeps "检查" docked to the screen bottom rather than inline).
 */
export interface FooterConfig {
  label: string;
  disabled: boolean;
  press: () => void;
}

export interface SubmitFooterApi {
  set: (cfg: FooterConfig) => void;
  clear: () => void;
}

/**
 * When provided (inside the lesson screen), `SubmitButton` registers itself here
 * and renders nothing inline; the lesson screen draws the actual docked bar.
 * When absent (any other host), `SubmitButton` falls back to rendering inline.
 */
export const SubmitFooterContext = createContext<SubmitFooterApi | null>(null);

export function useSubmitFooter(): SubmitFooterApi | null {
  return useContext(SubmitFooterContext);
}
