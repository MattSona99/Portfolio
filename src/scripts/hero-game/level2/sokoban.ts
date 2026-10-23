import { gsap } from 'gsap';
import { CONFIG } from '../core/config';
import type { GameState, Level2State, Point, Room, Snapshot } from '../core/types';

// Livello 2 – "Riempi i buchi" (Sokoban).
// Si spingono blocchi (mai tirati) nei buchi: un blocco che cade in un buco lo riempie e
// spariscono entrambi. Quando l'ultimo buco è pieno si apre il varco verso la dimensione successiva.

type Rng = () => number;

const key = (p: Point) => `${p.x},${p.y}`;
const add = (a: Point, b: Point): Point => ({ x: a.x + b.x, y: a.y + b.y });
const sub = (a: Point, b: Point): Point => ({ x: a.x - b.x, y: a.y - b.y });
const neg = (a: Point): Point => ({ x: -a.x, y: -a.y });
const same = (a: Point, b: Point) => a.x === b.x && a.y === b.y;

const DIRS: Point[] = [
  { x: 1, y: 0 },
  { x: 0, y: 1 },
  { x: -1, y: 0 },
  { x: 0, y: -1 },
];

const randInt = (rng: Rng, n: number) => Math.floor(rng() * n);

function shuffle<T>(rng: Rng, items: T[]): T[] {
  const a = items.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = randInt(rng, i + 1);
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function isConnected(cells: Point[]): boolean {
  if (!cells.length) return false;

  const free = new Set(cells.map(key));
  const seen = new Set<string>([key(cells[0])]);
  const stack = [cells[0]];

  while (stack.length) {
    const p = stack.pop()!;
    for (const d of DIRS) {
      const q = add(p, d);
      const k = key(q);
      if (free.has(k) && !seen.has(k)) {
        seen.add(k);
        stack.push(q);
      }
    }
  }

  return seen.size === free.size;
}

// ───────────────────────── Generazione ─────────────────────────
//
// Si parte dalla stanza "risolta" (tutti i buchi pieni, nessun blocco) e si fanno mosse
// INVERSE a caso:
//   • move   – il quadrato fa un passo;
//   • pull   – fa un passo indietro trascinando il blocco che aveva davanti
//              (inverso di una spinta);
//   • unfill – un buco pieno davanti a lui si riapre e il blocco che l'aveva riempito
//              ricompare dietro di lui (inverso di "spingere un blocco nel buco").
// Giocando queste mosse al contrario si arriva sempre alla stanza risolta: quindi la stanza
// è risolvibile per costruzione, senza bisogno di un solutore.

type Op = { t: 'move' | 'pull' | 'unfill'; d: Point };

const toPoints = (keys: Set<string>): Point[] =>
  [...keys].map((k) => {
    const [x, y] = k.split(',').map(Number);
    return { x, y };
  });

// Somma minima delle distanze di Manhattan tra blocchi e buchi, provando tutti gli abbinamenti.
function assignmentDistance(blocks: Point[], holes: Point[]): number {
  let best = Infinity;

  const walk = (i: number, used: number, sum: number) => {
    if (sum >= best) return;
    if (i === blocks.length) {
      best = sum;
      return;
    }
    for (let j = 0; j < holes.length; j++) {
      if (used & (1 << j)) continue;
      walk(i + 1, used | (1 << j), sum + Math.abs(blocks[i].x - holes[j].x) + Math.abs(blocks[i].y - holes[j].y));
    }
  };

  walk(0, 0, 0);
  return best;
}

function tryRoom(rng: Rng): Room | null {
  const S = CONFIG.sokoban;
  const W = S.w;
  const H = S.h;
  const K = S.blocks;

  const wallKeys = new Set<string>();
  const wallPts: Point[] = [];
  const addWall = (p: Point) => {
    if (wallKeys.has(key(p))) return;
    wallKeys.add(key(p));
    wallPts.push(p);
  };

  for (let x = -1; x <= W; x++) {
    addWall({ x, y: -1 });
    addWall({ x, y: H });
  }
  for (let y = -1; y <= H; y++) {
    addWall({ x: -1, y });
    addWall({ x: W, y });
  }

  // Muri interni.
  let placed = 0;
  for (let guard = 0; placed < S.innerWalls && guard < 80; guard++) {
    const p = { x: randInt(rng, W), y: randInt(rng, H) };
    if (wallKeys.has(key(p))) continue;
    addWall(p);
    placed++;
  }

  const inside = (p: Point) => p.x >= 0 && p.x < W && p.y >= 0 && p.y < H;

  const cells: Point[] = [];
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) if (!wallKeys.has(key({ x, y }))) cells.push({ x, y });
  }
  if (!isConnected(cells)) return null;

  const holes = shuffle(rng, cells).slice(0, K);
  const filled = new Set(holes.map(key)); // stanza risolta: tutti i buchi sono pieni
  const open = new Set<string>(); // buchi aperti: non si possono calpestare
  const blocks = new Set<string>();

  let player = cells[randInt(rng, cells.length)];
  const ops: Op[] = [];
  let pushes = 0;
  let extra = 0;
  let solved = false;

  const free = (p: Point) =>
    inside(p) && !wallKeys.has(key(p)) && !blocks.has(key(p)) && !open.has(key(p));

  // Limite di passi: i tentativi che si incastrano (quadrato circondato, buchi irraggiungibili) si
  // scartano presto e si riparte, è più veloce che insistere.
  for (let step = 0; step < 900; step++) {
    const cands: { op: Op; w: number }[] = [];

    for (const d of DIRS) {
      const ahead = add(player, d);
      const behind = sub(player, d);

      if (free(ahead)) cands.push({ op: { t: 'move', d }, w: 1 });
      if (blocks.has(key(ahead)) && free(behind)) cands.push({ op: { t: 'pull', d }, w: 4 });
      if (filled.has(key(ahead)) && !blocks.has(key(ahead)) && free(behind)) {
        cands.push({ op: { t: 'unfill', d }, w: 6 });
      }
    }

    if (!cands.length) break;

    let r = rng() * cands.reduce((s, c) => s + c.w, 0);
    let chosen = cands[cands.length - 1].op;
    for (const c of cands) {
      r -= c.w;
      if (r <= 0) {
        chosen = c.op;
        break;
      }
    }

    const ahead = add(player, chosen.d);

    if (chosen.t === 'move') {
      player = ahead;
    } else if (chosen.t === 'pull') {
      blocks.delete(key(ahead));
      blocks.add(key(player));
      player = sub(player, chosen.d);
      pushes++;
    } else {
      filled.delete(key(ahead));
      open.add(key(ahead));
      blocks.add(key(player));
      player = sub(player, chosen.d);
      pushes++;
    }

    ops.push(chosen);

    // Tutti i buchi aperti: si continua a rimescolare finché la stanza non è abbastanza
    // difficile (blocchi lontani dai buchi, abbastanza spinte), invece di scartarla e ricominciare.
    if (open.size === K) {
      extra++;
      if (
        extra >= S.scramble &&
        pushes >= S.minPushes &&
        ops.length >= S.minMoves &&
        assignmentDistance(toPoints(blocks), holes) >= S.minDistance
      ) {
        solved = true;
        break;
      }
      if (extra > S.scramble * 6) return null;
    }
  }

  if (!solved) return null;
  const blockPts = toPoints(blocks);

  // Varco: una tile del perimetro che si affaccia su una cella libera.
  const floor = new Set(cells.map(key));
  const exits: { at: Point; dir: Point }[] = [];
  for (let x = 0; x < W; x++) {
    if (floor.has(key({ x, y: 0 }))) exits.push({ at: { x, y: -1 }, dir: { x: 0, y: -1 } });
    if (floor.has(key({ x, y: H - 1 }))) exits.push({ at: { x, y: H }, dir: { x: 0, y: 1 } });
  }
  for (let y = 0; y < H; y++) {
    if (floor.has(key({ x: 0, y }))) exits.push({ at: { x: -1, y }, dir: { x: -1, y: 0 } });
    if (floor.has(key({ x: W - 1, y }))) exits.push({ at: { x: W, y }, dir: { x: 1, y: 0 } });
  }
  if (!exits.length) return null;
  const exit = exits[randInt(rng, exits.length)];

  // La soluzione è la sequenza inversa: move(d) → passo -d; pull(d) e unfill(d) → spinta in d.
  const solution = ops
    .slice()
    .reverse()
    .map((op) => (op.t === 'move' ? neg(op.d) : { ...op.d }));

  return {
    w: W,
    h: H,
    walls: wallPts.filter((p) => !same(p, exit.at)),
    start: player,
    blocks: blockPts,
    holes,
    exit: exit.at,
    exitDir: exit.dir,
    pushes,
    solution,
  };
}

// Stanza minima sempre valida, usata solo se la generazione casuale fallisse.
function fallbackRoom(): Room {
  const W = CONFIG.sokoban.w;
  const H = CONFIG.sokoban.h;
  const walls: Point[] = [];
  for (let x = -1; x <= W; x++) walls.push({ x, y: -1 }, { x, y: H });
  for (let y = 0; y < H; y++) walls.push({ x: -1, y });
  for (let y = 0; y < H; y++) if (y !== 2) walls.push({ x: W, y });

  return {
    w: W,
    h: H,
    walls,
    start: { x: 1, y: 2 },
    blocks: [{ x: 3, y: 2 }],
    holes: [{ x: 6, y: 2 }],
    exit: { x: W, y: 2 },
    exitDir: { x: 1, y: 0 },
    pushes: 3,
    solution: [{ x: 1, y: 0 }, { x: 1, y: 0 }, { x: 1, y: 0 }, { x: 1, y: 0 }],
  };
}

export function generateRoom(rng: Rng = Math.random): Room {
  for (let attempt = 0; attempt < 500; attempt++) {
    const room = tryRoom(rng);
    if (room) return room;
  }
  return fallbackRoom();
}

export function createLevel2State(rng: Rng = Math.random): Level2State {
  const room = generateRoom(rng);

  return {
    room,
    placed: false,
    origin: { x: 0, y: 0 },
    walls: new Set(),
    wallList: [],
    exit: { x: 0, y: 0 },
    exitDir: room.exitDir,
    exitTarget: false,
    exitOpen: 0,
    blocks: [],
    holes: [],
    plan: null,
    history: [],
    puffs: [],
    moves: 0,
    reach: 0,
    done: false,
    revealAt: -Infinity,
    revealFrom: { x: 0, y: 0 },
  };
}

// ───────────────────────── Regole ─────────────────────────

function snapshot(state: GameState): Snapshot {
  const L = state.level2;
  return {
    position: { ...state.position },
    blocks: L.blocks.map((b) => ({ ...b })),
    filled: L.holes.map((h) => h.filled),
  };
}

// Il varco è un muro finché tutti i buchi non sono pieni. I blocchi non lo attraversano mai.
function isWallFor(L: Level2State, p: Point, isBlock: boolean) {
  if (L.walls.has(key(p))) return true;
  if (same(p, L.exit)) return isBlock || !L.exitTarget;
  return false;
}

const openHoleAt = (L: Level2State, p: Point) => L.holes.find((h) => !h.filled && same(h.at, p));

// Posiziona la stanza nel mondo: la partenza coincide con la tile su cui si trova il quadrato.
// Si chiama quando inizia il livello 2; i muri e gli oggetti compaiono quando li raggiunge l'onda.
export function placeRoom(state: GameState) {
  const L = state.level2;
  const room = L.room;

  gsap.killTweensOf(L);

  const o = sub(state.position, room.start);
  L.origin = o;
  L.wallList = room.walls.map((w) => add(w, o));
  L.walls = new Set(L.wallList.map(key));
  L.exit = add(room.exit, o);
  L.exitDir = room.exitDir;
  L.exitTarget = false;
  L.exitOpen = 0;
  L.blocks = room.blocks.map((b) => add(b, o));
  L.holes = room.holes.map((h) => ({ at: add(h, o), filled: false, fillAt: -Infinity }));
  L.plan = null;
  L.puffs = [];
  L.moves = 0;
  L.done = false;
  L.history = [snapshot(state)];

  const corners: Point[] = [
    { x: -1, y: -1 },
    { x: room.w, y: -1 },
    { x: -1, y: room.h },
    { x: room.w, y: room.h },
  ];
  L.reach = Math.max(...corners.map((c) => Math.hypot(c.x - room.start.x, c.y - room.start.y)));

  L.revealAt = performance.now();
  L.revealFrom = { ...state.position };
  L.placed = true;
}

// Il gioco riparte da capo: la stanza verrà posizionata di nuovo al prossimo livello 2.
export function resetLevel2(state: GameState) {
  const L = state.level2;
  gsap.killTweensOf(L);

  L.placed = false;
  L.done = false;
  L.plan = null;
  L.puffs = [];
  L.history = [];
  L.exitTarget = false;
  L.exitOpen = 0;
  L.revealAt = -Infinity;
}

// Prepara la mossa verso `next`. Restituisce false se è impossibile (muro, buco aperto,
// blocco bloccato): il quadrato "sbatte" e resta dov'è. Se spinge un blocco, lo registra nel piano.
export function planMove(state: GameState, next: Point): boolean {
  const L = state.level2;
  L.plan = null;
  if (!L.placed) return false;

  const step = sub(next, state.position);

  if (isWallFor(L, next, false)) return false;
  if (openHoleAt(L, next)) return false; // in 2D un buco aperto non si calpesta

  const index = L.blocks.findIndex((b) => same(b, next));
  if (index >= 0) {
    const to = add(next, step);
    if (isWallFor(L, to, true) || L.blocks.some((b) => same(b, to))) return false;

    L.plan = { push: { index, from: { ...next }, to, falls: !!openHoleAt(L, to) } };
    return true;
  }

  L.plan = { push: null };
  return true;
}

// Apre o chiude il varco in base ai buchi ancora aperti.
function syncExit(state: GameState, hooks: { onOpen?: () => void } = {}) {
  const L = state.level2;
  const all = L.holes.length > 0 && L.holes.every((h) => h.filled);
  if (all === L.exitTarget) return;

  L.exitTarget = all;
  gsap.killTweensOf(L, 'exitOpen');
  gsap.to(L, { exitOpen: all ? 1 : 0, duration: 0.8, ease: 'steps(8)' });
  if (all) hooks.onOpen?.();
}

// Da chiamare quando il quadrato è arrivato sulla nuova tile (posizione già aggiornata).
export function commitMove(
  state: GameState,
  hooks: { onFill?: () => void; onOpen?: () => void; onExit?: () => void } = {},
) {
  const L = state.level2;
  const plan = L.plan;
  L.plan = null;

  const now = performance.now();

  if (plan?.push) {
    const { index, to, falls } = plan.push;

    if (falls) {
      const hole = openHoleAt(L, to);
      L.blocks.splice(index, 1);
      if (hole) {
        hole.filled = true;
        hole.fillAt = now;
      }
      L.puffs.push({ at: { ...to }, t: now });
      hooks.onFill?.();
    } else {
      L.blocks[index] = { ...to };
    }
  }

  L.moves++;
  L.history.push(snapshot(state));
  syncExit(state, hooks);

  if (L.exitTarget && same(state.position, L.exit)) {
    L.done = true;
    hooks.onExit?.();
  }
}

function restore(state: GameState, snap: Snapshot) {
  const L = state.level2;
  state.position = { ...snap.position };
  L.blocks = snap.blocks.map((b) => ({ ...b }));
  L.holes.forEach((h, i) => {
    h.filled = snap.filled[i];
  });
  L.plan = null;
  syncExit(state);
}

// Annulla l'ultima mossa.
export function undoMove(state: GameState) {
  const L = state.level2;
  if (!L.placed || L.done || state.target || L.history.length < 2) return;

  L.history.pop();
  L.moves = Math.max(0, L.moves - 1);
  restore(state, L.history[L.history.length - 1]);
}

// Ricomincia la stanza da capo.
export function restartRoom(state: GameState) {
  const L = state.level2;
  if (!L.placed || L.done || state.target || !L.history.length) return;

  const first = L.history[0];
  L.history = [first];
  L.moves = 0;
  L.puffs = [];
  restore(state, first);
}