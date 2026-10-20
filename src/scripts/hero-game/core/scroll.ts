import { CONFIG, baseGroundAt, bodyMetrics } from './config';
import type { HeroFx } from './types';
import type { EyeState } from '../level1/animations';

const clamp01 = (t: number) => Math.min(1, Math.max(0, t));
const smooth = (t: number) => t * t * (3 - 2 * t);

// Costante di tempo del filtro passa-basso (s) per i valori che NON devono combaciare
// al pixel con i bordi del DOM: filtra la irregolarità con cui arriva lo scroll.
const TAU = 0.09;

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
  fly: 0,
  wave: 0,
  blastX: 0,
  blastY: 0,
  fear: 0,
  shake: 0,
  shakeX: 0,
  shakeY: 0,
  gridV: 1,
  gridAlpha: 1,
  worldAlpha: 1,
};

// Misura ogni frame la "fascia" libera della Hero:
//   soffitto  = bordo basso della navbar (fissa, si allarga con lo scroll)
//   pavimento = fine del contenitore Hero (sale mentre si scorre)
// Quando la fascia diventa più bassa del cubo, il cubo viene schiacciato tra i due
// e, se la fascia continua a ridursi, esplode; i pezzi poi si disperdono per tutta la
// pagina (canvas overlay) e svaniscono. Tutto è una funzione dello scroll:
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

  // Valori filtrati nel tempo.
  const sm = { primed: false, t: 0, ground: 0, gridV: 1, gridAlpha: 1, fear: 0 };

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

  // `plane` = 0 isometrico (il giocatore è il cubo), 1 vista dall'alto (è il quadrato):
  // cambia l'ingombro del corpo che viene schiacciato tra navbar e fine della Hero.
  function read(width: number, height: number, time: number, plane = 0): HeroFx {
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
    const rawBand = bottom - top; // può diventare negativo a Hero uscita
    const bandH = Math.max(0, rawBand);

    const { fullH, below } = bodyMetrics(plane);

    // ── Filtro temporale ──
    const dt = sm.primed ? Math.min(Math.max(time - sm.t, 0), 50) / 1000 : 0;
    const k = sm.primed ? 1 - Math.exp(-dt / TAU) : 1;
    const lp = (cur: number, target: number) => (sm.primed ? cur + (target - cur) * k : target);
    sm.t = time;

    // ── Focus (con un filo di isteresi) ──
    const progress = clamp01(window.scrollY / Math.max(1, shell.offsetHeight));

    if (focused && progress > S.focusLoss) focused = false;
    else if (!focused && progress < S.focusRegain) focused = true;

    const dim = clamp01((progress - S.focusRegain) / 0.25);

    // r = fascia / altezza del cubo. Se la Hero è ancora "a fuoco" non schiacciamo
    // mai (es. finestre molto basse).
    const active = progress > S.focusRegain;
    const r = active ? bandH / fullH : 99;

    const press = clamp01((1 - r) / (1 - S.minSquash));

    // `over` = pixel di scroll oltre il punto in cui parte l'esplosione.
    const overEx = (S.minSquash - S.explodeEnd) * fullH;
    const over = active ? S.minSquash * fullH - rawBand : -1e9;
    const explode = clamp01(over / overEx);

    // Distanza di dispersione: se la pagina finisce prima, i pezzi arrivano
    // comunque in fondo alla corsa (e quindi svaniscono).
    const maxScroll = Math.max(0, document.documentElement.scrollHeight - viewport);
    const overMax = over + (maxScroll - window.scrollY);
    const blastPx = Math.max(S.blastMin, Math.min(S.blastDistance * viewport, overMax - overEx - 20));
    const fly = clamp01((over - overEx) / blastPx);
    const wave = clamp01(over / (overEx + 0.55 * blastPx));

    // Origine dell'esplosione (viewport): dove si trova il cubo schiacciato nell'istante
    // in cui parte lo scoppio. È solo geometria, quindi il passaggio tra il canvas della
    // Hero e l'overlay è continuo in entrambi i sensi.
    const blastX = rect.left + (rect.width || width) / 2;
    const blastY = navBottom + S.minSquash * fullH - below;

    // ── Schiacciamento: il cubo riempie esattamente la fascia ──
    const sy0 = Math.min(1, Math.max(S.minSquash, r));
    const sx0 = Math.min(1.45, 1 + (1 / sy0 - 1) * 0.6); // conserva (grosso modo) il volume
    // Quando esplode "si gonfia" di colpo e torna alle proporzioni normali.
    const pop = smooth(clamp01(explode * 3));
    const squashY = sy0 + (1 - sy0) * pop;
    const squashX = sx0 + (1 - sx0) * pop;

    // ── Posizione verticale del cubo (rispetto al layout base) ──
    // Libero: segue il centro della fascia, filtrato nel tempo (niente scatti).
    // Avvicinandosi allo schiacciamento (r da 1.7 a 1) recupera gradualmente il ritardo del
    // filtro e si aggancia ai bordi reali: da r = 1 è incollato al pavimento, senza filtro.
    const baseGround = baseGroundAt(height, plane);
    const pressedGround = bandBottom - below - Math.max(0, (bandH - fullH) / 2);
    const follow = Math.max(
      smooth(clamp01((progress - S.focusRegain) / 0.25)),
      clamp01((2 - r) / 0.75),
    );
    sm.ground = lp(sm.ground, baseGround + (pressedGround - baseGround) * follow);
    const pin = smooth(clamp01((1.7 - r) / 0.7));
    const groundY = sm.ground + (pressedGround - sm.ground) * pin;

    // ── Paura e tremore ──
    const fearR = clamp01((2 - r) / 1.1);
    const fearP = clamp01((progress - S.focusLoss) / 0.25) * 0.55;
    sm.fear = lp(sm.fear, Math.max(fearR, fearP));

    const shake =
      smooth(clamp01((1.4 - r) / (1.4 - S.minSquash))) *
      (1 - smooth(clamp01((explode - 0.5) / 0.5)));

    const ts = time / 1000;
    const shakeX = (Math.sin(ts * 71) + Math.sin(ts * 43) * 0.6) * shake * 3.2;
    const shakeY = Math.sin(ts * 59 + 1.3) * shake * 2.2;

    // ── Griglia: ferma nella Hero; si comprime sul posto, si illumina, poi svanisce ──
    const gridVRaw = 1 - 0.6 * press + 0.6 * press * smooth(clamp01(explode * 2));
    const gridFade = 1 - smooth(clamp01((explode - 0.4) / 0.6));
    const gridAlphaRaw = (1 + 1.4 * press) * (1 - 0.4 * dim) * gridFade;
    sm.gridV = lp(sm.gridV, gridVRaw);
    sm.gridAlpha = lp(sm.gridAlpha, gridAlphaRaw);

    // Guida e buco svaniscono appena la Hero perde il focus: quando sono spariti il gioco
    // può ripartire da capo senza che si veda alcun salto.
    const worldAlpha = (1 - smooth(clamp01(dim * 3))) * gridFade;

    sm.primed = true;

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
      fly,
      wave,
      blastX,
      blastY,
      fear: sm.fear,
      shake,
      shakeX,
      shakeY,
      gridV: sm.gridV,
      gridAlpha: sm.gridAlpha,
      worldAlpha,
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