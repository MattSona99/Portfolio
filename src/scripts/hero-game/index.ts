import type { GameState } from './core/types';
import { CONFIG } from './core/config';
import { bindKeyboard } from './core/input';
import { render } from './core/renderer';
import { createHeroScroll, applyFearEyes, NEUTRAL_FX } from './core/scroll';
import { createBlastOverlay } from './core/overlay';
import { createFlow, startTransition, resetFlow, disposeFlow } from './core/flow';
import { renderPosition2D } from './level2/player';
import { gsap } from 'gsap';
import { generateCourse, createHoleState, canMove, handleArrival, handleDenied, resetCourse } from './level1/course';
import { createEyeState, createEyeAnimator, getRenderPosition } from './level1/animations';

export function mountHeroGame(shell: HTMLElement): () => void {
  const canvas = shell.querySelector<HTMLCanvasElement>(
    '[data-hero-canvas]',
  );
  const ctx = canvas?.getContext('2d');

  if (!canvas || !ctx) return () => {};

  const course = generateCourse(); // percorso casuale: cambia a ogni refresh della pagina

  const state: GameState = {
    fx: { ...NEUTRAL_FX },
    flow: createFlow(),
    course,
    hole: createHoleState(course),
    bumping: false,
    position: { x: 0, y: 0 },
    camera: { x: 0, y: 0 },
    target: null,
    moveDir: null,
    moveProgress: 0,
    roll: 0,
    hop: 0,
    lastFrame: 0,
  };

  // Ogni istanza del gioco ha i propri occhi e animatore.
  const eyes = createEyeState();
  const eyeAnimator = createEyeAnimator(eyes);

  let width = 0;
  let height = 0;
  let raf = 0;
  let destroyed = false;

  // Il canvas è largo quanto la finestra e centrato sulla Hero (che ha overflow-hidden):
  // quando la Hero si allarga con lo scroll (.wrap → 100%) il canvas NON va ridimensionato.
  // Prima ogni cambio di larghezza riallocava il bitmap, che così veniva svuotato dopo il
  // disegno del frame e il browser mostrava un frame vuoto → flickering.
  const resize = () => {
    const rect = shell.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    width = Math.max(document.documentElement.clientWidth, Math.ceil(rect.width));
    height = rect.height;

    const pixelW = Math.round(width * dpr);
    const pixelH = Math.round(height * dpr);
    const reallocated = canvas.width !== pixelW || canvas.height !== pixelH;

    if (reallocated) {
      canvas.width = pixelW;
      canvas.height = pixelH;
    }

    Object.assign(canvas.style, {
      position: 'absolute',
      top: '0',
      left: '50%',
      width: `${width}px`,
      height: `${height}px`,
      maxWidth: 'none',
      transform: 'translateX(-50%)',
    });

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    // Assegnare width/height svuota il canvas: ridisegna subito, nello stesso frame,
    // così non viene mai mostrato un frame vuoto.
    if (reallocated) render(ctx, width, height, state, eyes);
  };

  const observer = new ResizeObserver(resize);
  observer.observe(shell);
  resize();

  // Scroll: schiacciamento, esplosione e focus della Hero.
  const heroScroll = createHeroScroll(shell);
  // Canvas a tutto schermo per i pezzi dell'esplosione che escono dalla Hero.
  const blast = createBlastOverlay();
  let focused = true;
  let pendingReset = false;

  const unbindInput = bindKeyboard(shell, state, {
    // Livello 1: due frecce insieme (diagonali isometriche). Livello 2: una freccia = un passo.
    mode: () => (state.flow.level === 2 ? 'topdown' : 'iso'),
    // Senza focus (Hero scrollata via) i tasti freccia non muovono il giocatore.
    // Livello 1: dopo il tuffo nel buco i comandi si fermano finché il piano non è diventato 2D.
    isEnabled: () => focused && (state.flow.level === 2 ? state.flow.ready : !state.hole.done),
    // Il buco si apre solo dopo aver attivato in ordine tutte le tile del percorso.
    canMove: (next) => canMove(state, next),
    // Avanzamento sulla guida, comparsa del buco e tuffo.
    onArrive: (_pos, from) => {
      if (state.flow.level === 2) {
        // Livello 2: la tile appena lasciata si illumina per un attimo.
        state.flow.stamp = { ...from };
        state.flow.stampAt = performance.now();
        return;
      }

      handleArrival(state, from, {
        onImpact: () => eyeAnimator.land(),
        // Cubo colorato di --fg: parte il passaggio al livello 2.
        onComplete: () => startTransition(state),
      });
    },
    // Urto contro il muro invisibile: cubo rosso, occhi ">  <" e squash.
    onBump: (from) => {
      handleDenied(state, from);
      eyes.shape = 'chevron';
      eyeAnimator.land();
      gsap.delayedCall(0.9, () => {
        eyes.shape = 'round';
      });
    },
    // Muovere il cubo annulla le espressioni idle in corso.
    onMoveStart: () => eyeAnimator.interrupt(),
    onLand: () => eyeAnimator.land(),
  });

  // Le animazioni idle partono quando il gioco viene montato.
  eyeAnimator.start();

  const frame = (time: number) => {
    if (destroyed) return;

    const dt = state.lastFrame ? Math.min((time - state.lastFrame) / 1000, 0.05) : 0;
    state.lastFrame = time;

    // Camera: insegue il giocatore (interpolato durante il salto) con un po' di inerzia.
    // Col piano 2D è quasi rigida e segue i fotogrammi dello scatto: il quadrato resta al
    // centro e a scorrere è la griglia.
    const plane = state.flow.plane;
    const focus = plane >= 0.5 ? renderPosition2D(state) : getRenderPosition(state);
    const rate = plane >= 1 ? CONFIG.topdown.cameraFollow : CONFIG.cameraFollow;
    const follow = 1 - Math.exp(-rate * dt);
    state.camera.x += (focus.x - state.camera.x) * follow;
    state.camera.y += (focus.y - state.camera.y) * follow;

    // ── Scroll ──
    const fx = heroScroll.read(width, height, time, plane);
    state.fx = fx;

    if (fx.focused !== focused) {
      focused = fx.focused;

      // Perso il focus: stop alle espressioni idle (ora il cubo ha paura).
      // Ritrovato: occhi puliti e idle riattivato.
      eyeAnimator.stop();

      if (focused) {
        eyeAnimator.start();
        eyeAnimator.land();
      } else {
        pendingReset = true;
      }
    }

    // Il gioco riparte da capo (livello 1, giocatore in (0, 0), buco nascosto) solo quando guida
    // e buco sono già svaniti con lo scroll: la griglia è periodica, quindi non si vede nessun
    // salto. Se era già al livello 2 il piano torna isometrico con l'animazione inversa.
    if (pendingReset && !focused && fx.worldAlpha < 0.02 && !state.target) {
      resetCourse(state);
      resetFlow(state);
      pendingReset = false;
    }

    if (!focused) applyFearEyes(eyes, fx, time);

    if (state.target) {
      // Salto: ribaltamento di 90° + arco, entrambi guidati da moveProgress.
      const t = Math.min(Math.max(state.moveProgress, 0), 1);
      state.roll = t;
      // Nell'urto il cubo si inclina verso il muro ma non fa il salto intero.
      state.hop = Math.sin(t * Math.PI) * CONFIG.hopHeight * (state.bumping ? 0.2 : 1);
    } else {
      state.roll = 0;
      state.hop = focused && !state.hole.done && plane <= 0 ? Math.abs(Math.sin(time / 450)) * 2 : 0;
    }

    render(ctx, width, height, state, eyes);
    blast.draw(state.fx, eyes, plane);

    raf = requestAnimationFrame(frame);
  };

  raf = requestAnimationFrame(frame);

  const themeObserver = new MutationObserver(() => {
    render(ctx, width, height, state, eyes);
  });

  themeObserver.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['data-theme', 'class', 'style'],
  });

  return () => {
    destroyed = true;

    cancelAnimationFrame(raf);
    observer.disconnect();
    themeObserver.disconnect();
    unbindInput();
    blast.destroy();
    disposeFlow(state);

    // Ferma timer e timeline GSAP.
    eyeAnimator.stop();
  };
}