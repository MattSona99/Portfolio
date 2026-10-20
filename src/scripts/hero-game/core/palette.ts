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
    // Verde della guida al buco. Per cambiarlo basta definire --guide in global.css.
    guide: cssVar('--guide', '#3ddc84'),
    // Rosso del cubo quando urta il muro invisibile (--danger in global.css).
    danger: cssVar('--danger', '#ff4d4d'),
  };
}