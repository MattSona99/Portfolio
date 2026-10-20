import { gsap } from 'gsap';
import { CONFIG } from './config';
import type { Flow, GameState } from './types';

// Timeline della transizione in corso, per poterla fermare se il gioco si riavvia.
const running = new WeakMap<Flow, gsap.core.Timeline>();

export function createFlow(): Flow {
  return {
    level: 1,
    started: false,
    vanish: 0,
    plane: 0,
    ready: false,
    waveAt: -Infinity,
    waveFrom: { x: 0, y: 0 },
    stamp: null,
    stampAt: -Infinity,
  };
}

// Livello 1 completato → livello 2. In sequenza:
//   1. il percorso verde scompare;
//   2. il piano passa da isometrico 3D a 2D visto dall'alto (il cubo diventa un quadrato);
//   3. un'onda parte dal quadrato, colora per un attimo le tile vicine e si allarga;
//   4. il quadrato diventa controllabile con le frecce.
// Il quadrato resta sempre al centro della griglia: la camera è già sul cubo.
export function startTransition(state: GameState) {
  const f = state.flow;
  if (f.started) return;
  f.started = true;

  const T = CONFIG.transition;

  const tl = gsap.timeline();
  running.set(f, tl);

  tl.to(f, { vanish: 1, duration: T.vanish, ease: 'power1.inOut' }, T.delay)
    .to(f, { plane: 1, duration: T.morph, ease: 'power2.inOut' }, T.delay + T.vanish * 0.7)
    .call(
      () => {
        f.level = 2;
        f.waveFrom = { ...state.position };
        f.waveAt = performance.now();
      },
      [],
      '>-0.2',
    )
    .call(
      () => {
        f.ready = true;
      },
      [],
      `+=${T.ready}`,
    );
}

// Riporta il flusso al livello 1: il piano torna isometrico con l'animazione inversa.
// (Si usa insieme a resetCourse, quando il gioco riparte da capo.)
export function resetFlow(state: GameState) {
  const f = state.flow;

  running.get(f)?.kill();
  running.delete(f);
  gsap.killTweensOf(f);

  f.started = false;
  f.ready = false;
  f.level = 1;
  f.vanish = 0;
  f.waveAt = -Infinity;
  f.stamp = null;
  f.stampAt = -Infinity;

  if (f.plane > 0) gsap.to(f, { plane: 0, duration: 1.0, ease: 'power2.inOut' });
}

// Cleanup quando il gioco viene smontato.
export function disposeFlow(state: GameState) {
  running.get(state.flow)?.kill();
  running.delete(state.flow);
  gsap.killTweensOf(state.flow);
}