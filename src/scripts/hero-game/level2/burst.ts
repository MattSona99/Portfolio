import { CONFIG } from '../core/config';
import type { Palette } from '../core/types';

const clamp01 = (t: number) => Math.min(1, Math.max(0, t));
const smooth = (t: number) => t * t * (3 - 2 * t);
const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);

// Pseudo-random deterministico: l'esplosione dipende solo dallo scroll, quindi
// tornando indietro i pezzi si ricompongono esattamente.
const hash = (n: number) => {
  const r = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return r - Math.floor(r);
};

type Burst = { sx: number; sy: number; explode: number; fly?: number; vw?: number; vh?: number };

const GRID = 6; // il quadrato si frantuma in GRID × GRID blocchi

// Esplosione del quadrato 2D (livello 2): si rompe in blocchi di pixel che volano via,
// poi si disperdono per tutta la pagina e svaniscono. Come per il cubo (core/overlay.ts)
// tutto è guidato dallo scroll e tornando indietro i blocchi rientrano nel quadrato.
// (x, y) = centro a terra del quadrato, in coordinate viewport; `side` = suo lato.
export function drawSquareBurst(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  side: number,
  burst: Burst,
  palette: Palette,
) {
  const ex = clamp01(burst.explode);
  if (ex <= 0) return;

  const fly = clamp01(burst.fly ?? 0);
  const flyOut = easeOutCubic(fly);
  const vw = burst.vw ?? 0;
  const vh = burst.vh ?? 0;
  const P = CONFIG.topdown.pixel;
  const snap = (v: number) => Math.round(v / P) * P;

  // Partenza: il quadrato com'era quando si è fermato (schiacciato, appoggiato al pavimento).
  const w = side * burst.sx;
  const h = side * burst.sy;
  const bottom = y + side / 2;
  const cx = x;
  const cy = bottom - h / 2;

  const out = easeOutCubic(ex);
  const alphaFar = 1 - smooth(clamp01((fly - 0.5) / 0.5));
  const shrink = 1 - 0.55 * flyOut;

  ctx.save();
  ctx.fillStyle = palette.fg;

  // Lampo iniziale.
  const flash = 1 - clamp01(ex * 4);
  if (flash > 0) {
    const fs = side * (1 + out * 2.5);
    ctx.globalAlpha = flash * 0.25;
    ctx.fillRect(snap(cx - fs / 2), snap(cy - fs / 2), snap(fs), snap(fs));
  }

  // Blocchi.
  const bw = w / GRID;
  const bh = h / GRID;

  for (let j = 0; j < GRID; j++) {
    for (let i = 0; i < GRID; i++) {
      const n = j * GRID + i;
      const bx = cx - w / 2 + (i + 0.5) * bw;
      const by = cy - h / 2 + (j + 0.5) * bh;

      const r1 = hash(n * 3 + 1);
      const r2 = hash(n * 3 + 2);

      // Fase 1: a raggiera dal centro, un po' schiacciata in verticale.
      let vx = bx - cx;
      let vy = by - cy;
      let len = Math.hypot(vx, vy);
      if (len < 1e-3) {
        const a = r1 * Math.PI * 2;
        vx = Math.cos(a);
        vy = Math.sin(a);
        len = 1;
      }

      const dist = out * (120 + 280 * r1);
      const nearX = bx + (vx / len) * dist + (r2 - 0.5) * 50 * out;
      const nearY = by + (vy / len) * dist * 0.6 + ex * ex * 100 * (0.5 + r1);

      // Fase 2: verso un punto lontano della pagina.
      const farX = hash(n * 5 + 21) * vw;
      const farY = hash(n * 5 + 22) * vh;

      const px = nearX + (farX - nearX) * flyOut;
      const py = nearY + (farY - nearY) * flyOut;

      ctx.globalAlpha = alphaFar;
      ctx.fillRect(snap(px - (bw * shrink) / 2), snap(py - (bh * shrink) / 2), Math.max(P, snap(bw * shrink)), Math.max(P, snap(bh * shrink)));
    }
  }

  // Scintille: piccoli pixel sparsi.
  for (let i = 0; i < 30; i++) {
    const a = hash(i * 7 + 11) * Math.PI * 2;
    const d = out * (100 + 300 * hash(i * 7 + 12));
    const nearX = cx + Math.cos(a) * d;
    const nearY = cy + Math.sin(a) * d * 0.6 + ex * ex * 60;
    const farX = hash(i * 7 + 14) * vw;
    const farY = hash(i * 7 + 15) * vh;

    const px = nearX + (farX - nearX) * flyOut;
    const py = nearY + (farY - nearY) * flyOut;
    const size = Math.max(P, snap((4 + 6 * hash(i * 7 + 13)) * (1 - 0.6 * flyOut)));

    ctx.globalAlpha = alphaFar * clamp01(ex * 6);
    ctx.fillRect(snap(px - size / 2), snap(py - size / 2), size, size);
  }

  ctx.restore();
}