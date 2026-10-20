import { CONFIG, TILE } from './config';
import type { Point } from './types';

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

// Vettori a schermo dei due assi del mondo (x, y) per ogni passo di una tile.
//   plane = 0 → isometrico: x va giù-destra (175, 75), y va giù-sinistra (-175, 75)
//   plane = 1 → visto dall'alto: x va a destra (150, 0), y va in basso (0, 150)
// In mezzo i due vettori si interpolano, quindi il piano si "raddrizza" con continuità.
function basis(plane: number) {
  const s = CONFIG.topdown.tile;
  return {
    exx: lerp(TILE.w / 2, s, plane),
    exy: lerp(TILE.h / 2, 0, plane),
    eyx: lerp(-TILE.w / 2, 0, plane),
    eyy: lerp(TILE.h / 2, s, plane),
  };
}

// Centro (sul pavimento) della tile `point`, dato il centro a terra della tile (0, 0).
// `vScale` comprime la griglia in verticale (schiacciamento da scroll);
// `plane` la porta da isometrica (0) a vista dall'alto (1).
export function project(point: Point, originX: number, originY: number, vScale = 1, plane = 0) {
  const b = basis(plane);
  return {
    x: originX + point.x * b.exx + point.y * b.eyx,
    y: originY + (point.x * b.exy + point.y * b.eyy) * vScale,
  };
}

const DASH = [4, 6];
const DASH_PERIOD = DASH[0] + DASH[1];
const mod = (v: number, m: number) => ((v % m) + m) % m;

// Griglia infinita: le linee vengono generate sempre attorno alla camera, quindi
// basta muovere la camera per vedere tile che si ripetono senza fine.
// I bordi stanno a coordinate "mezze" (±0.5): il centro di ogni tile coincide
// con una posizione intera in cui il giocatore può stare.
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
  plane = 0,
) {
  const alpha = Math.min(1, CONFIG.backgroundGridAlpha * alphaMul);
  if (alpha < 0.002) return;

  const cellW = lerp(TILE.w, CONFIG.topdown.tile, plane);
  const cellH = lerp(TILE.h, CONFIG.topdown.tile, plane);
  const span = Math.ceil(width / cellW + height / (cellH * Math.max(vScale, 0.3))) + 4;

  const baseX = Math.round(camera.x);
  const baseY = Math.round(camera.y);
  const x0 = baseX - span;
  const x1 = baseX + span;
  const y0 = baseY - span;
  const y1 = baseY + span;

  // Lunghezza di un passo lungo le linee di ciascuna famiglia.
  const b = basis(plane);
  const stepX = Math.hypot(b.exx, b.exy * vScale);
  const stepY = Math.hypot(b.eyx, b.eyy * vScale);

  const color = getComputedStyle(document.documentElement).getPropertyValue('--fg').trim() || '#777';

  // Spessore del pavimento (livello inferiore tratteggiato): sparisce quando il piano è 2D.
  const depth = 20 * vScale * (1 - plane);

  ctx.save();
  ctx.lineWidth = 1;
  ctx.strokeStyle = color;

  const drawLines = (yOffset: number, isDashed: boolean, a: number) => {
    ctx.globalAlpha = a;
    ctx.setLineDash(isDashed ? DASH : []);

    const oy = originY + yOffset;

    for (let k = -span; k <= span; k++) {
      // Linee a y costante (direzione dell'asse x).
      const ey = baseY + k + 0.5;
      const p = project({ x: x0, y: ey }, originX, oy, vScale, plane);
      const q = project({ x: x1, y: ey }, originX, oy, vScale, plane);

      // Il tratteggio parte dallo stesso punto "assoluto" del mondo, così non
      // scorre né sfarfalla quando la camera cambia cella di riferimento.
      ctx.lineDashOffset = isDashed ? mod(x0 * stepX, DASH_PERIOD) : 0;
      ctx.beginPath();
      ctx.moveTo(p.x, p.y);
      ctx.lineTo(q.x, q.y);
      ctx.stroke();

      // Linee a x costante (direzione dell'asse y).
      const ex = baseX + k + 0.5;
      const c = project({ x: ex, y: y0 }, originX, oy, vScale, plane);
      const d = project({ x: ex, y: y1 }, originX, oy, vScale, plane);

      ctx.lineDashOffset = isDashed ? mod(y0 * stepY, DASH_PERIOD) : 0;
      ctx.beginPath();
      ctx.moveTo(c.x, c.y);
      ctx.lineTo(d.x, d.y);
      ctx.stroke();
    }
  };

  // 1. Livello inferiore (tratteggiato e più trasparente): si appiattisce e svanisce col piano 2D.
  if (plane < 0.999) drawLines(depth, true, alpha * 0.5 * (1 - plane));

  // 2. Livello superiore (continuo, griglia principale)
  drawLines(0, false, alpha);

  ctx.restore();
}