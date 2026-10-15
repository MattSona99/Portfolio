export type Point = { x: number; y: number };
export type Palette = { bg: string; fg: string; cube: string; cubeShade: string; guide: string; danger: string };
export type Direction = 'up' | 'down' | 'left' | 'right';

// Direzione visiva del salto sullo schermo.
//   downRight: x + 1   downLeft: y + 1
//   upLeft:    x - 1   upRight:  y - 1
export type MoveDir = 'downRight' | 'downLeft' | 'upLeft' | 'upRight';

// Percorso guidato: tile da attraversare (la prima è la partenza, l'ultima è il buco).
export type Course = { path: Point[]; hole: Point };

export type HoleState = {
  progress: number; // indice dell'ultima tile del percorso attivata in ordine (0 = partenza)
  litAt: number[]; // per ogni tile: istante (ms) dell'illuminazione; può stare nel futuro (onda finale)
  hintAt: number; // istante (ms) dell'ultimo suggerimento: la tile successiva pulsa
  unlock: number; // 0 → 1: percorso completato, il buco è aperto
  deny: number; // 1 → 0: flash rosso del buco dopo un ingresso rifiutato
  wall: number; // 1 → 0: il muro invisibile si rivela all'impatto
  wallFrom: Point | null; // tile da cui il cubo ha urtato il muro
  tint: number; // 1 → 0: cubo rosso
  revealed: boolean; // il buco è già stato mostrato
  reveal: number; // 0 → 1: apparizione del buco
  sink: number; // 0 → 1: il cubo sprofonda nel buco
  fill: number; // 0 → 1: il cubo si colora di --fg
  done: boolean; // il cubo è nel buco (per ora il gioco si ferma qui)
};

export type GameState = {
  fx: HeroFx; // effetti guidati dallo scroll (schiacciamento, esplosione, focus)
  course: Course;
  hole: HoleState;
  bumping: boolean; // il cubo sta urtando il muro invisibile (mossa rifiutata)
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
  fly: number; // 0 → 1: i pezzi si disperdono per tutta la pagina e svaniscono
  wave: number; // 0 → 1: onda d'urto
  blastX: number; // origine dell'esplosione, in coordinate viewport
  blastY: number;
  fear: number; // 0 → 1: quanto è preoccupato
  shake: number; // 0 → 1: intensità del tremore
  shakeX: number;
  shakeY: number;
  gridV: number; // scala verticale della griglia
  gridAlpha: number; // moltiplicatore di opacità della griglia
  worldAlpha: number; // opacità di guida e buco (svaniscono quando la Hero perde il focus)
};