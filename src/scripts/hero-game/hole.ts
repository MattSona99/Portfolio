import { CONFIG, TILE } from './config';
import { mixColors } from './color';
import type { Palette } from './types';

const clamp01 = (t: number) => Math.min(1, Math.max(0, t));
const smooth = (t: number) => t * t * (3 - 2 * t);
const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);

// Mezza larghezza / mezza altezza della bocca del buco (centrata sulla tile).
function mouth(vScale: number) {
  return {
    a: (TILE.w / 2) * CONFIG.hole.inset,
    b: (TILE.h / 2) * CONFIG.hole.inset * vScale,
  };
}

// TILE BUCO: la tile sembra sprofondare nella griglia. Si vedono le pareti di fondo
// come rombi annidati sempre più piccoli e più in basso. (cx, cy) = centro della tile.
export function drawHole(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  vScale: number,
  reveal: number,
  palette: Palette,
  alpha: number,
  unlock = 0, // 0 → 1: percorso completato, le pareti diventano verdi
  deny = 0, // 0 → 1: ingresso rifiutato, le pareti lampeggiano di rosso
) {
  if (reveal <= 0 || alpha <= 0.003) return;

  const m = mouth(vScale);
  const levels = CONFIG.hole.levels;

  // Si apre con un piccolo "scatto" di dimensione e le pareti compaiono una dopo l'altra.
  const grow = 0.6 + 0.4 * easeOutCubic(clamp01(reveal * 1.5));
  const a = m.a * grow;
  const b = m.b * grow;

  ctx.save();
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';

  // Fondo: copre i tratteggi della griglia che altrimenti attraverserebbero il buco.
  ctx.globalAlpha = alpha * smooth(clamp01(reveal * 3));
  ctx.fillStyle = palette.bg;
  ctx.beginPath();
  ctx.moveTo(cx - a, cy);
  ctx.lineTo(cx, cy - b);
  ctx.lineTo(cx + a, cy);
  ctx.lineTo(cx, cy + b);
  ctx.closePath();
  ctx.fill();

  // Pareti di fondo: solo i due spigoli alti di ogni rombo ("^"), sempre più in basso.
  ctx.strokeStyle = mixColors(mixColors(palette.fg, palette.guide, unlock), palette.danger, deny);
  ctx.lineWidth = 1.5 + deny;

  for (let k = 0; k < levels; k++) {
    const level = clamp01(reveal * levels - k * 0.8);
    if (level <= 0) break;

    const scale = 1 - 0.2 * k;
    const shift = 0.23 * b * k;

    ctx.globalAlpha = alpha * level * (1 - 0.1 * k);
    ctx.beginPath();
    ctx.moveTo(cx - a * scale, cy + shift);
    ctx.lineTo(cx, cy - b * scale + shift);
    ctx.lineTo(cx + a * scale, cy + shift);
    ctx.stroke();
  }

  ctx.restore();
}

// Area visibile di un cubo sprofondato: tutto ciò che sta sopra il bordo anteriore
// del buco. Quello che scende sotto il bordo è "dentro" al buco e non si vede.
export function clipAboveRim(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  vScale: number,
) {
  const { a, b } = mouth(vScale);
  const BIG = 5000;

  ctx.beginPath();
  ctx.moveTo(cx - BIG, cy - BIG);
  ctx.lineTo(cx + BIG, cy - BIG);
  ctx.lineTo(cx + BIG, cy);
  ctx.lineTo(cx + a, cy);
  ctx.lineTo(cx, cy + b);
  ctx.lineTo(cx - a, cy);
  ctx.lineTo(cx - BIG, cy);
  ctx.closePath();
  ctx.clip();
}

// Bordo anteriore del buco, disegnato sopra il cubo sprofondato.
export function drawRim(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  vScale: number,
  palette: Palette,
  alpha: number,
) {
  if (alpha <= 0.003) return;

  const { a, b } = mouth(vScale);

  ctx.save();
  ctx.globalAlpha = alpha * 0.9;
  ctx.strokeStyle = palette.fg;
  ctx.lineWidth = 2;
  ctx.lineJoin = 'round';
  ctx.beginPath();
  ctx.moveTo(cx - a, cy);
  ctx.lineTo(cx, cy + b);
  ctx.lineTo(cx + a, cy);
  ctx.stroke();
  ctx.restore();
}