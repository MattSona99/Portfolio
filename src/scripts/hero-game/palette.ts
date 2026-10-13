import type { Palette } from './types';

function cssVar(name: string, fallback: string): string {
  const value = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  return value || fallback;
}

export function readPalette(): Palette {
  return {
    bg: cssVar('--bg', '#111315'),
    fg: cssVar('--fg', '#777777'),
    cube: cssVar('--contrast-a', '#d0d0d0'),
    cubeShade: cssVar('--contrast-b', '#999999'),
  };
}
