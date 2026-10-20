import { CONFIG, TILE } from '../core/config';
import { project } from '../core/grid';
import type { Course, Palette } from '../core/types';

// Guida verde tratteggiata che porta alla TILE BUCO.
// Il cammino è squadrato e passa per il centro delle tile: le curve sono sempre
// al centro di una tile. I tratti scorrono verso il buco.
export function drawGuide(
  ctx: CanvasRenderingContext2D,
  course: Course,
  progress: number,
  originX: number,
  originY: number,
  vScale: number,
  time: number,
  palette: Palette,
  alpha: number,
) {
  if (alpha <= 0.003) return;

  const G = CONFIG.guide;
  const pts = course.path.map((p) => project(p, originX, originY, vScale));
  const from = Math.min(Math.max(progress, 0), pts.length - 1);
  const stepLen = Math.hypot(TILE.w / 2, (TILE.h / 2) * vScale);

  ctx.save();
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  ctx.strokeStyle = palette.guide;

  // Tratto già percorso: tenue e fermo.
  if (from > 0) {
    ctx.globalAlpha = alpha * 0.22;
    ctx.lineWidth = G.width;
    ctx.setLineDash([]);
    ctx.beginPath();
    ctx.moveTo(pts[0].x, pts[0].y);
    for (let i = 1; i <= from; i++) ctx.lineTo(pts[i].x, pts[i].y);
    ctx.stroke();
  }

  // Tratto da percorrere: tratteggiato e animato. La fase dei tratti è legata alla
  // lunghezza già percorsa, così non "salta" quando il cubo avanza di una tile.
  ctx.setLineDash([G.dash, G.gap]);
  ctx.lineDashOffset = from * stepLen - (time / 1000) * G.speed;

  const stroke = (width: number, a: number) => {
    ctx.globalAlpha = alpha * a;
    ctx.lineWidth = width;
    ctx.beginPath();
    ctx.moveTo(pts[from].x, pts[from].y);
    for (let i = from + 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y);
    ctx.stroke();
  };

  stroke(G.width + 5, 0.16); // alone
  stroke(G.width, 0.95);

  ctx.restore();
}