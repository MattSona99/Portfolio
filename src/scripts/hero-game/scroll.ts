import { CONFIG, baseGroundY, cubeMetrics } from './config';
import type { HeroFx } from './types';
import type { EyeState } from './animations';

const clamp01 = (t: number) => Math.min(1, Math.max(0, t));
const smooth = (t: number) => t * t * (3 - 2 * t);

export const NEUTRAL_FX: HeroFx = {
  progress: 0,
  focused: true,
  groundY: NaN, // NaN = usa il layout base (renderer)
  bandTop: 0,
  bandBottom: 1e9,
  press: 0,
  squashX: 1,
  squashY: 1,
  explode: 0,
  fear: 0,
  shake: 0,
  shakeX: 0,
  shakeY: 0,
  gridV: 1,
  gridAlpha: 1,
};

// Misura ogni frame la "fascia" libera della Hero:
//   soffitto  = bordo basso della navbar (fissa, si allarga con lo scroll)
//   pavimento = fine del contenitore Hero (sale mentre si scorre)
// Quando la fascia diventa più bassa del cubo, il cubo viene schiacciato tra i due
// e, se la fascia continua a ridursi, esplode. Tutto è una funzione dello scroll:
// tornando indietro l'animazione si riavvolge da sola.
//
// `shell` = elemento passato a mountHeroGame (il contenitore della Hero).
// Per indicare la navbar: data-hero-nav="#mia-navbar" sullo shell
// (altrimenti si cerca la prima header / nav / [data-navbar] fissa o sticky).
export function createHeroScroll(shell: HTMLElement) {
  const selector = shell.dataset.heroNav || '[data-navbar], header, nav';
  const S = CONFIG.scroll;

  let nav: HTMLElement | null = null;
  let focused = true;

  const resolveNav = () => {
    if (nav && nav.isConnected) return nav;

    const all = Array.from(document.querySelectorAll<HTMLElement>(selector)).filter(
      (el) => !shell.contains(el),
    );

    nav =
      all.find((el) => {
        const position = getComputedStyle(el).position;
        return position === 'fixed' || position === 'sticky';
      }) ??
      all[0] ??
      null;

    return nav;
  };

  function read(width: number, height: number, time: number): HeroFx {
    const rect = shell.getBoundingClientRect();
    const viewport = window.innerHeight;

    const navEl = resolveNav();
    const navBottom = navEl
      ? Math.min(Math.max(navEl.getBoundingClientRect().bottom, 0), viewport)
      : 0;

    // Fascia visibile della Hero, in coordinate canvas.
    const top = Math.max(rect.top, navBottom);
    const bottom = Math.min(rect.bottom, viewport);
    const bandTop = top - rect.top;
    const bandBottom = bottom - rect.top;
    const bandH = Math.max(0, bandBottom - bandTop);

    const { h, fullH } = cubeMetrics();

    // ── Focus (con un filo di isteresi) ──
    const progress = clamp01(window.scrollY / Math.max(1, shell.offsetHeight));

    if (focused && progress > S.focusLoss) focused = false;
    else if (!focused && progress < S.focusRegain) focused = true;

    const dim = clamp01((progress - S.focusRegain) / 0.25);

    // r = fascia / altezza del cubo. Se la Hero è ancora "a fuoco" non schiacciamo
    // mai (es. finestre molto basse).
    const r = progress > S.focusRegain ? bandH / fullH : 99;

    const press = clamp01((1 - r) / (1 - S.minSquash));
    const explode = clamp01((S.minSquash - r) / (S.minSquash - S.explodeEnd));

    // ── Schiacciamento: il cubo riempie esattamente la fascia ──
    const sy0 = Math.min(1, Math.max(S.minSquash, r));
    const sx0 = Math.min(1.45, 1 + (1 / sy0 - 1) * 0.6); // conserva (grosso modo) il volume
    // Quando esplode "si gonfia" di colpo e torna alle proporzioni normali.
    const pop = smooth(clamp01(explode * 3));
    const squashY = sy0 + (1 - sy0) * pop;
    const squashX = sx0 + (1 - sx0) * pop;

    // ── Posizione: dal layout base al centro della fascia, poi appoggiato al pavimento ──
    const baseGround = baseGroundY(height);
    const pressedGround = bandBottom - h - Math.max(0, (bandH - fullH) / 2);
    const follow = Math.max(
      smooth(clamp01((progress - S.focusRegain) / 0.25)),
      clamp01((2 - r) / 0.75),
    );
    const groundY = baseGround + (pressedGround - baseGround) * follow;

    // ── Paura e tremore ──
    const fearR = clamp01((2 - r) / 1.1);
    const fearP = clamp01((progress - S.focusLoss) / 0.25) * 0.55;
    const fear = Math.max(fearR, fearP);

    const shake =
      smooth(clamp01((1.4 - r) / (1.4 - S.minSquash))) *
      (1 - smooth(clamp01((explode - 0.5) / 0.5)));

    const ts = time / 1000;
    const shakeX = (Math.sin(ts * 71) + Math.sin(ts * 43) * 0.6) * shake * 3.2;
    const shakeY = Math.sin(ts * 59 + 1.3) * shake * 2.2;

    // ── Griglia: si comprime, si illumina sotto pressione, poi svanisce ──
    const gridV = 1 - 0.6 * press + 0.6 * press * smooth(clamp01(explode * 2));
    const gridFade = 1 - smooth(clamp01((explode - 0.4) / 0.6));
    const gridAlpha = (1 + 1.4 * press) * (1 - 0.4 * dim) * gridFade;

    return {
      progress,
      focused,
      groundY,
      bandTop,
      bandBottom,
      press,
      squashX,
      squashY,
      explode,
      fear,
      shake,
      shakeX,
      shakeY,
      gridV,
      gridAlpha,
    };
  }

  return { read };
}

// Occhi del cubo quando la Hero non è a fuoco: spalancati, nervosi, poi ">  <" e "X".
// Si scrivono direttamente (le espressioni idle sono ferme finché non torna il focus).
export function applyFearEyes(eyes: EyeState, fx: HeroFx, time: number) {
  const f = fx.fear;
  const t = time / 1000;

  eyes.scaleX = 1 + 0.5 * f;
  eyes.scaleY = 1 + 0.9 * f;
  eyes.offsetX = Math.sin(t * 2.3) * 4 * f + Math.sin(t * 41) * 1.6 * f * f;
  eyes.offsetY = -3 * f + Math.sin(t * 37) * 1.2 * f * f;
  eyes.lid = 0;
  eyes.bodyX = Math.sin(t * 47) * 0.006 * fx.shake;
  eyes.bodyRotation = Math.sin(t * 33) * 0.025 * fx.shake;

  eyes.shape = fx.explode > 0.04 ? 'cross' : fx.press > 0.35 ? 'chevron' : 'round';
}