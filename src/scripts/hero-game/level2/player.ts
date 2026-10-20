import { CONFIG, playerHalf } from '../core/config';
import { mixColors } from '../core/color';
import { project } from '../core/grid';
import type { GameState, Palette, Point, View } from '../core/types';

const clamp01 = (t: number) => Math.min(1, Math.max(0, t));
const smooth = (t: number) => t * t * (3 - 2 * t);

// Fotogramma corrente di un movimento (0 → 1 a scatti): l'effetto è "stop-motion".
export function moveFrame(state: GameState): number {
  if (!state.target) return 0;
  const steps = CONFIG.topdown.steps;
  const p = clamp01(state.moveProgress);
  return Math.min(1, Math.ceil(p * steps - 1e-6) / steps);
}

// Posizione del quadrato a fotogrammi (usata anche dalla camera, che lo tiene al centro).
export function renderPosition2D(state: GameState): Point {
  const t = state.target;
  if (!t) return state.position;
  const q = moveFrame(state);
  return {
    x: state.position.x + (t.x - state.position.x) * q,
    y: state.position.y + (t.y - state.position.y) * q,
  };
}

// Il quadrato 2D. A piano isometrico (plane ≈ 0) i suoi angoli coincidono con la faccia
// superiore del cubo sprofondato: trasformando il piano, quel rombo diventa un quadrato.
// Si disegna con gli stessi angoli proiettati dalla griglia, quindi segue la trasformazione.
export function drawPlayer(
  ctx: CanvasRenderingContext2D,
  state: GameState,
  palette: Palette,
  view: View,
) {
  const fx = state.fx;
  const { originX, originY, vScale, plane } = view;
  const P = CONFIG.topdown.pixel;
  const half = playerHalf(plane);

  // A trasformazione finita le coordinate si agganciano a una griglia di "pixel" grossi.
  const crisp = plane >= 0.999;
  const snap = (v: number) => (crisp ? Math.round(v / P) * P : v);

  const pos = renderPosition2D(state);
  const c = project(pos, originX, originY, vScale, plane);
  const cx = c.x + fx.shakeX;
  const cy = c.y + view.floatY + fx.shakeY;

  // Angoli del quadrato rispetto al suo centro, nello stesso spazio della griglia.
  const corner = (u: number, v: number, at: Point = pos) => {
    const p = project({ x: at.x + u, y: at.y + v }, originX, originY, vScale, plane);
    const m = project(at, originX, originY, vScale, plane);
    return { x: p.x - m.x, y: p.y - m.y };
  };
  const base = [corner(-half, -half), corner(half, -half), corner(half, half), corner(-half, half)];

  // Durante il movimento il quadrato si allunga nella direzione dello scatto (a fotogrammi).
  const q = moveFrame(state);
  let sxm = 1;
  let sym = 1;
  if (state.target) {
    const s = 1 + 0.16 * Math.sin(Math.PI * q);
    if (state.target.x !== state.position.x) {
      sxm = s;
      sym = 1 / s;
    } else {
      sxm = 1 / s;
      sym = s;
    }
  }

  const moved = base.map((p) => ({ x: p.x * sxm, y: p.y * sym }));
  const bottom = Math.max(...moved.map((p) => p.y));

  // Schiacciamento da scroll: ancorato al bordo basso, come il cubo.
  const pts = moved.map((p) => ({
    x: cx + snap(p.x * fx.squashX),
    y: cy + snap(bottom + (p.y - bottom) * fx.squashY),
  }));

  ctx.save();
  ctx.lineJoin = 'miter';

  // Scia: due fotogrammi precedenti, sempre più tenui.
  if (state.target) {
    ctx.fillStyle = palette.fg;
    const steps = CONFIG.topdown.steps;

    for (let k = 1; k <= 2; k++) {
      const qk = q - k / steps;
      if (qk < 0) break;

      const at = {
        x: state.position.x + (state.target.x - state.position.x) * qk,
        y: state.position.y + (state.target.y - state.position.y) * qk,
      };
      const g = project(at, originX, originY, vScale, plane);
      const off = { x: g.x - c.x, y: g.y - c.y };

      ctx.globalAlpha = k === 1 ? 0.28 : 0.13;
      ctx.beginPath();
      base.forEach((p, n) => {
        const x = cx + snap(off.x + p.x);
        const y = cy + snap(off.y + p.y);
        if (n === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.closePath();
      ctx.fill();
    }
  }

  // Corpo: stesso colore (--fg) e stesso bordo scuro del cubo pieno.
  ctx.globalAlpha = 1;
  ctx.fillStyle = palette.fg;
  ctx.strokeStyle = mixColors(palette.fg, palette.bg, 0.85);
  ctx.lineWidth = 2;

  ctx.beginPath();
  pts.forEach((p, n) => (n === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y)));
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Occhi: due barre di pixel del colore dello sfondo. Compaiono a fine trasformazione,
  // sbattono ogni tanto e guardano nella direzione dello scatto.
  const eyeAlpha = smooth(clamp01((plane - 0.7) / 0.3));
  if (eyeAlpha > 0.01) {
    const xs = pts.map((p) => p.x);
    const ys = pts.map((p) => p.y);
    const left = Math.min(...xs);
    const top = Math.min(...ys);
    const w = Math.max(...xs) - left;
    const h = Math.max(...ys) - top;

    const eyeW = Math.max(P, Math.round((w * 0.09) / P) * P);
    const eyeH0 = Math.max(P, Math.round((h * 0.22) / P) * P);
    const blink = view.now % 4300 < 120;
    const eyeH = blink ? P : eyeH0;

    let lookX = 0;
    let lookY = 0;
    if (state.target) {
      lookX = Math.sign(state.target.x - state.position.x) * P;
      lookY = Math.sign(state.target.y - state.position.y) * P;
    }

    const y = top + h * 0.36 + (eyeH0 - eyeH) / 2 + lookY;

    ctx.globalAlpha = eyeAlpha;
    ctx.fillStyle = palette.bg;
    ctx.fillRect(Math.round(left + w * 0.3 - eyeW / 2 + lookX), Math.round(y), eyeW, eyeH);
    ctx.fillRect(Math.round(left + w * 0.7 - eyeW / 2 + lookX), Math.round(y), eyeW, eyeH);
  }

  ctx.restore();
}