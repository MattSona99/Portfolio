export type Point = { x: number; y: number };
export type Palette = { bg: string; fg: string; cube: string; cubeShade: string };
export type Direction = 'up' | 'down' | 'left' | 'right';

// Direzione visiva del salto sullo schermo.
//   downRight: x + 1   downLeft: y + 1
//   upLeft:    x - 1   upRight:  y - 1
export type MoveDir = 'downRight' | 'downLeft' | 'upLeft' | 'upRight';

export type GameState = {
  fx: HeroFx; // effetti guidati dallo scroll (schiacciamento, esplosione, focus)
  position: Point;
  camera: Point; // punto del mondo al centro dello schermo (segue il cubo con inerzia)
  target: Point | null;
  moveDir: MoveDir | null;
  moveProgress: number; // 0 → 1 durante il salto
  roll: number; // 0 → 1: quanto del ribaltamento (90°) è completato
  hop: number;
  lastFrame: number;
};

// Effetti guidati dallo scroll, ricalcolati a ogni frame da scroll.ts.
export type HeroFx = {
  progress: number; // 0 → 1: scroll rispetto all'altezza della Hero
  focused: boolean; // false = la Hero ha perso il focus (input disabilitato)
  groundY: number; // y (coordinate canvas) del centro a terra del cubo; NaN = layout base
  bandTop: number; // y del "soffitto": bordo basso della navbar
  bandBottom: number; // y del "pavimento": fine del contenitore Hero
  press: number; // 0 → 1: quanto è schiacciato
  squashX: number;
  squashY: number;
  explode: number; // 0 → 1: esplosione (guidata dallo scroll: tornando indietro si ricompone)
  fear: number; // 0 → 1: quanto è preoccupato
  shake: number; // 0 → 1: intensità del tremore
  shakeX: number;
  shakeY: number;
  gridV: number; // scala verticale della griglia
  gridAlpha: number; // moltiplicatore di opacità della griglia
};