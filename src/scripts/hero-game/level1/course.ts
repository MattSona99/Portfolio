import { gsap } from 'gsap';
import { CONFIG } from '../core/config';
import type { Course, GameState, HoleState, Point } from '../core/types';

// Le 4 direzioni isometriche in ordine di rotazione di 90°:
// giù-destra (x+1), giù-sinistra (y+1), su-sinistra (x-1), su-destra (y-1).
// Con questo ordine "dritto" = stessa direzione, "curva" = direzione ±1.
const DIRS: Point[] = [
  { x: 1, y: 0 },
  { x: 0, y: 1 },
  { x: -1, y: 0 },
  { x: 0, y: -1 },
];

const key = (p: Point) => `${p.x},${p.y}`;

// Cammino casuale squadrato che parte da (0, 0):
//  - non torna mai su una tile già usata;
//  - non passa accanto a se stesso (due tile non consecutive non possono toccarsi),
//    così la guida resta sempre leggibile;
//  - preferisce andare dritto, ma curva spesso.
function buildPath(length: number, rng: () => number): Point[] | null {
  const path: Point[] = [{ x: 0, y: 0 }];
  const used = new Set<string>([key(path[0])]);
  let budget = 4000;

  const free = (p: Point, from: Point) => {
    if (used.has(key(p))) return false;
    for (const d of DIRS) {
      const q = { x: p.x + d.x, y: p.y + d.y };
      if (key(q) !== key(from) && used.has(key(q))) return false;
    }
    return true;
  };

  const walk = (dir: number): boolean => {
    if (path.length === length + 1) return true;
    if (--budget < 0) return false;

    const last = path[path.length - 1];
    const turns = rng() < 0.5 ? [1, 3] : [3, 1];
    const order = rng() < 0.55 ? [0, ...turns] : [...turns, 0];

    for (const turn of order) {
      const nd = (dir + turn) % 4;
      const p = { x: last.x + DIRS[nd].x, y: last.y + DIRS[nd].y };
      if (!free(p, last)) continue;

      path.push(p);
      used.add(key(p));
      if (walk(nd)) return true;
      path.pop();
      used.delete(key(p));
    }

    return false;
  };

  return walk(Math.floor(rng() * 4)) ? path : null;
}

// Percorso casuale di `length` movimenti: l'ultima tile è la TILE BUCO.
export function generateCourse(
  length: number = CONFIG.course.length,
  rng: () => number = Math.random,
): Course {
  for (let attempt = 0; attempt < 60; attempt++) {
    const path = buildPath(length, rng);
    if (!path) continue;

    const end = path[path.length - 1];
    // Il buco non deve essere già vicino alla partenza.
    if (Math.abs(end.x) + Math.abs(end.y) < CONFIG.course.minHoleDistance) continue;

    return { path, hole: end };
  }

  // Caso limite (non dovrebbe succedere): scaletta a zig-zag.
  const path: Point[] = [{ x: 0, y: 0 }];
  for (let i = 0; i < length; i++) {
    const last = path[path.length - 1];
    path.push(i % 2 ? { x: last.x, y: last.y + 1 } : { x: last.x + 1, y: last.y });
  }
  return { path, hole: path[path.length - 1] };
}

export function createHoleState(course: Course): HoleState {
  return {
    progress: 0,
    litAt: course.path.map(() => -Infinity),
    hintAt: -Infinity,
    unlock: 0,
    deny: 0,
    wall: 0,
    wallFrom: null,
    tint: 0,
    revealed: false,
    reveal: 0,
    sink: 0,
    fill: 0,
    done: false,
  };
}

const same = (a: Point, b: Point) => a.x === b.x && a.y === b.y;

// Ultima tile prima del buco: quando è attivata il percorso è completo.
const lastTile = (course: Course) => course.path.length - 2;

// Il buco si può raggiungere solo dopo aver attivato in ordine tutte le tile del percorso.
// Se restituisce false il cubo non entra: urta un muro invisibile (vedi handleDenied).
export function canMove(state: GameState, next: Point): boolean {
  if (!same(next, state.course.hole)) return true;
  return state.hole.progress >= lastTile(state.course);
}

// Da chiamare ogni volta che il cubo atterra su una tile (`from` = tile di partenza).
export function handleArrival(
  state: GameState,
  from: Point,
  hooks: { onImpact?: () => void; onComplete?: () => void } = {},
) {
  const { course, hole, position } = state;
  const path = course.path;
  const last = lastTile(course);
  const now = performance.now();

  // Il percorso va seguito passo per passo: una tile si attiva solo se il cubo ci arriva
  // direttamente dall'ultima tile attivata. Uscire dal percorso non lo cancella: per
  // proseguire basta tornare sull'ultima tile illuminata (il "checkpoint").
  const idx = hole.progress + 1;
  if (idx <= last && same(position, path[idx]) && same(from, path[hole.progress])) {
    hole.progress = idx;
    hole.litAt[idx] = now;

    if (idx === last) {
      // Percorso completo: onda di luce lungo tutto il cammino e buco sbloccato.
      for (let i = 1; i < last; i++) hole.litAt[i] = now + (i + 1) * CONFIG.course.waveStepMs;
      gsap.to(hole, { unlock: 1, duration: 0.6, ease: 'power2.out' });
    }
  }

  const dist = Math.abs(position.x - course.hole.x) + Math.abs(position.y - course.hole.y);

  // Il buco non si vede subito: compare quando il cubo si avvicina.
  if (!hole.revealed && dist <= CONFIG.course.revealDistance) {
    hole.revealed = true;
    gsap.to(hole, { reveal: 1, duration: 1.1, ease: 'power2.out' });
  }

  // Il cubo si butta nel buco: sprofonda, poi si colora di --fg.
  if (dist === 0 && hole.progress >= last && !hole.done) {
    hole.done = true;

    gsap
      .timeline()
      .to(hole, { sink: 1, duration: 0.5, ease: 'power3.in' })
      .call(() => hooks.onImpact?.())
      .to(hole, { fill: 1, duration: 0.9, ease: 'power1.inOut' }, '-=0.05')
      // Livello completato: parte il passaggio al livello 2 (vedi core/flow.ts).
      .call(() => hooks.onComplete?.());
  }
}

// Ingresso rifiutato (percorso non completato): il cubo ha urtato il muro invisibile.
// Il cubo diventa rosso, il muro si rivela per un attimo, il buco lampeggia di rosso e
// la prossima tile da attivare pulsa in verde.
export function handleDenied(
  state: GameState,
  from: Point,
  hooks: { onImpact?: () => void } = {},
) {
  const hole = state.hole;

  gsap.killTweensOf(hole, 'deny,wall,tint');

  hole.wallFrom = { ...from };
  hole.deny = 1;
  hole.wall = 1;
  hole.tint = 1;
  hole.hintAt = performance.now();

  gsap.to(hole, { deny: 0, duration: 1.0, ease: 'power2.out' });
  gsap.to(hole, { wall: 0, duration: 0.8, ease: 'power2.out' });
  gsap.to(hole, { tint: 0, duration: 0.9, ease: 'power1.out', delay: 0.15 });

  hooks.onImpact?.();
}

// Il gioco riparte da capo (stesso percorso, fino al prossimo refresh della pagina).
// Si chiama quando guida e buco sono già svaniti con lo scroll: la griglia è periodica,
// quindi riportare cubo e camera a (0, 0) non produce nessun salto visibile.
export function resetCourse(state: GameState) {
  const hole = state.hole;

  gsap.killTweensOf(hole);

  state.position = { x: 0, y: 0 };
  state.camera = { x: 0, y: 0 };

  hole.progress = 0;
  hole.litAt = state.course.path.map(() => -Infinity);
  hole.hintAt = -Infinity;
  hole.unlock = 0;
  hole.deny = 0;
  hole.wall = 0;
  hole.wallFrom = null;
  hole.tint = 0;
  hole.revealed = false;
  hole.reveal = 0;
  hole.done = false;

  // Se era nel buco, il cubo riemerge e perde il colore pieno. Se il piano era già 2D,
  // aspetta che torni isometrico (stessa faccia piena: il passaggio non si vede).
  const delay = state.flow.plane > 0 ? 1.0 : 0;
  gsap.to(hole, { sink: 0, fill: 0, duration: 0.6, ease: 'power2.out', delay });
}