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

// ── Livello 2 (Sokoban): stanza, blocchi e buchi ──

// Stanza in coordinate locali: l'interno va da (0, 0) a (w - 1, h - 1), il perimetro sta a -1 e w / h.
export type Room = {
  w: number;
  h: number;
  walls: Point[]; // perimetro (uscita esclusa) e muri interni
  start: Point; // dove parte il quadrato
  blocks: Point[];
  holes: Point[]; // tanti quanti i blocchi
  exit: Point; // varco nel perimetro: chiuso finché tutti i buchi non sono pieni
  exitDir: Point; // verso l'esterno
  pushes: number; // spinte della soluzione costruita
  solution: Point[]; // una soluzione (mosse unitarie): la stanza è risolvibile per costruzione
};

// Cosa succede se la mossa verso `next` è permessa: nessuna spinta oppure un blocco che avanza (e magari cade in un buco).
export type MovePlan = { push: { index: number; from: Point; to: Point; falls: boolean } | null };

export type Snapshot = { position: Point; blocks: Point[]; filled: boolean[] };

export type Level2State = {
  room: Room; // generata a caso a ogni refresh della pagina, risolvibile per costruzione
  placed: boolean; // la stanza è stata posizionata nel mondo (livello 2 iniziato)
  origin: Point; // scostamento locale → mondo: la partenza coincide con la tile del quadrato
  walls: Set<string>; // chiavi "x,y" in coordinate mondo
  wallList: Point[]; // gli stessi muri come elenco (per il disegno)
  exit: Point; // mondo
  exitDir: Point;
  exitTarget: boolean; // vero quando tutti i buchi sono pieni (varco aperto)
  exitOpen: number; // 0 → 1: animazione di apertura del varco
  blocks: Point[]; // mondo
  holes: { at: Point; filled: boolean; fillAt: number }[];
  plan: MovePlan | null; // mossa in corso (preparata da planMove)
  history: Snapshot[]; // stati precedenti, per annullare l'ultima mossa
  puffs: { at: Point; t: number }[]; // scoppi di pixel quando un blocco riempie un buco
  moves: number;
  reach: number; // distanza massima (in tile) della stanza dalla partenza
  done: boolean; // il quadrato è entrato nel varco (per ora il gioco si ferma qui)
  revealAt: number; // istante (ms) in cui l'onda comincia a rivelare la stanza
  revealFrom: Point;
};

// Passaggio dal livello 1 (cubo isometrico) al livello 2 (quadrato visto dall'alto).
export type Flow = {
  level: 1 | 2;
  started: boolean; // transizione avviata (livello 1 completato)
  vanish: number; // 0 → 1: il percorso verde scompare
  plane: number; // 0 → 1: il piano passa da isometrico 3D a 2D visto dall'alto
  ready: boolean; // il quadrato 2D è controllabile
  waveAt: number; // istante (ms) in cui parte l'onda dal quadrato (-Infinity = non ancora)
  waveFrom: Point; // tile da cui parte l'onda
  stamp: Point | null; // ultima tile lasciata dal quadrato (si illumina per un attimo)
  stampAt: number; // istante (ms) in cui è stata lasciata
};

// Parametri di vista calcolati a ogni frame da renderer.ts e usati dai disegni dei livelli.
export type View = {
  width: number;
  height: number;
  originX: number; // dove cade a schermo il centro a terra della tile (0, 0), senza tremore
  originY: number;
  gx: number; // come sopra, con un po' di tremore (griglia, guida, buco, onda)
  gy: number;
  vScale: number; // compressione verticale del piano (schiacciamento da scroll)
  plane: number; // 0 → 1: isometrico → visto dall'alto
  floatY: number; // quanto il giocatore "galleggia" rispetto al layout base (scroll)
  now: number; // performance.now()
};

export type GameState = {
  fx: HeroFx; // effetti guidati dallo scroll (schiacciamento, esplosione, focus)
  flow: Flow;
  level2: Level2State;
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