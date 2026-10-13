import type { GameState } from './types';
import { CONFIG } from './config';
import { bindKeyboard } from './input';
import { render } from './renderer';
import { createHeroScroll, applyFearEyes, NEUTRAL_FX } from './scroll';
import { createEyeState, createEyeAnimator, getRenderPosition } from './animations';

export function mountHeroGame(shell: HTMLElement): () => void {
  const canvas = shell.querySelector<HTMLCanvasElement>(
    '[data-hero-canvas]',
  );
  const ctx = canvas?.getContext('2d');

  if (!canvas || !ctx) return () => {};

  const state: GameState = {
    fx: { ...NEUTRAL_FX },
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

  const resize = () => {
    const rect = shell.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    width = rect.width;
    height = rect.height;

    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);

    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  };

  const observer = new ResizeObserver(resize);
  observer.observe(shell);
  resize();

  // Scroll: schiacciamento, esplosione e focus della Hero.
  const heroScroll = createHeroScroll(shell);
  let focused = true;
  let needsReset = false;

  const unbindInput = bindKeyboard(shell, state, {
    // Senza focus (Hero scrollata via) i tasti freccia non muovono il cubo.
    isEnabled: () => focused,
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

    // Camera: insegue la posizione del cubo (interpolata durante il salto) con un po' di inerzia.
    const focus = getRenderPosition(state);
    const follow = 1 - Math.exp(-CONFIG.cameraFollow * dt);
    state.camera.x += (focus.x - state.camera.x) * follow;
    state.camera.y += (focus.y - state.camera.y) * follow;

    // ── Scroll ──
    const fx = heroScroll.read(width, height, time);
    state.fx = fx;

    if (fx.focused !== focused) {
      focused = fx.focused;

      // Perso il focus: stop alle espressioni idle (ora il cubo ha paura).
      // Ritrovato: occhi puliti, idle riattivato e il gioco riparte da capo.
      eyeAnimator.stop();

      if (focused) {
        needsReset = true;
        eyeAnimator.start();
        eyeAnimator.land();
      }
    }

    if (needsReset && !state.target) {
      // Torna alla posizione iniziale. La griglia è periodica: tenendo la camera
      // relativa alla nuova posizione, a schermo non si vede nessun salto.
      state.camera.x -= state.position.x;
      state.camera.y -= state.position.y;
      state.position = { x: 0, y: 0 };
      needsReset = false;
    }

    if (!focused) applyFearEyes(eyes, fx, time);

    if (state.target) {
      // Salto: ribaltamento di 90° + arco, entrambi guidati da moveProgress.
      const t = Math.min(state.moveProgress, 1);
      state.roll = t;
      state.hop = Math.sin(t * Math.PI) * CONFIG.hopHeight;
    } else {
      state.roll = 0;
      state.hop = focused ? Math.abs(Math.sin(time / 450)) * 2 : 0;
    }

    render(ctx, width, height, state, eyes);

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

    // Ferma timer e timeline GSAP.
    eyeAnimator.stop();
  };
}