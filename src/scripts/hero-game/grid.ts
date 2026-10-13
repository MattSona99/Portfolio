import { CONFIG, TILE } from './config';
import type { Point } from './types';

// Centro (sul pavimento) della tile `point`, dato il centro a terra della tile (0, 0).
// Un passo = metà rombo: (TILE.w / 2, TILE.h / 2) = (175, 75) px.
// `vScale` comprime la griglia in verticale (animazione di schiacciamento).
export function project(point: Point, originX: number, originY: number, vScale = 1) {
  return {
    x: originX + (point.x - point.y) * TILE.w / 2,
    y: originY + (point.x + point.y) * TILE.h / 2 * vScale,
  };
}

const DASH = [4, 6];
const DASH_PERIOD = DASH[0] + DASH[1];
const mod = (v: number, m: number) => ((v % m) + m) % m;

// Griglia infinita: le linee vengono generate sempre attorno alla camera, quindi
// basta muovere la camera per vedere tile che si ripetono senza fine.
// I bordi stanno a coordinate "mezze" (±0.5): il centro di ogni tile coincide
// con una posizione intera in cui il cubo può atterrare.
// (originX, originY) = posizione a schermo del centro a terra della tile (0, 0).
export function drawInfiniteGrid(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  originX: number,
  originY: number,
  camera: Point,
  vScale = 1,
  alphaMul = 1,
) {
  const alpha = Math.min(1, CONFIG.backgroundGridAlpha * alphaMul);
  if (alpha < 0.002) return;

  const span = Math.ceil(width / TILE.w + height / (TILE.h * Math.max(vScale, 0.3))) + 4;

  const baseX = Math.round(camera.x);
  const baseY = Math.round(camera.y);
  const x0 = baseX - span;
  const x1 = baseX + span;
  const y0 = baseY - span;
  const y1 = baseY + span;

  // Lunghezza di un passo lungo una linea della griglia.
  const stepLen = Math.hypot(TILE.w / 2, (TILE.h / 2) * vScale);

  const color = getComputedStyle(document.documentElement).getPropertyValue('--fg').trim() || '#777';

  // Spessore del pavimento in pixel (distanza tra la griglia sopra e quella sotto)
  const depth = 20 * vScale;

  ctx.save();
  ctx.lineWidth = 1;
  ctx.strokeStyle = color;

  const drawLines = (yOffset: number, isDashed: boolean, alpha: number) => {
    ctx.globalAlpha = alpha;
    ctx.setLineDash(isDashed ? DASH : []);

    const oy = originY + yOffset;

    for (let k = -span; k <= span; k++) {
      // Linee a y costante (verso basso-destra).
      const ey = baseY + k + 0.5;
      const a = project({ x: x0, y: ey }, originX, oy, vScale);
      const b = project({ x: x1, y: ey }, originX, oy, vScale);

      // Il tratteggio parte dallo stesso punto "assoluto" del mondo, così non
      // scorre né sfarfalla quando la camera cambia cella di riferimento.
      ctx.lineDashOffset = isDashed ? mod(x0 * stepLen, DASH_PERIOD) : 0;
      ctx.beginPath();
      ctx.moveTo(a.x, a.y);
      ctx.lineTo(b.x, b.y);
      ctx.stroke();

      // Linee a x costante (verso basso-sinistra).
      const ex = baseX + k + 0.5;
      const c = project({ x: ex, y: y0 }, originX, oy, vScale);
      const d = project({ x: ex, y: y1 }, originX, oy, vScale);

      ctx.lineDashOffset = isDashed ? mod(y0 * stepLen, DASH_PERIOD) : 0;
      ctx.beginPath();
      ctx.moveTo(c.x, c.y);
      ctx.lineTo(d.x, d.y);
      ctx.stroke();
    }
  };

  // 1. Livello inferiore (tratteggiato e più trasparente)
  drawLines(depth, true, alpha * 0.5);

  // 2. Livello superiore (continuo, griglia principale)
  drawLines(0, false, alpha);

  ctx.restore();
}