import { CONFIG } from '../core/config';
import { project } from '../core/grid';
import type { GameState, Palette, Point, View } from '../core/types';

// Riempie una tile (con un piccolo margine, così restano visibili le linee della griglia).
function fillTile(ctx: CanvasRenderingContext2D, tile: Point, view: View, inset = 0.46) {
  const corners: [number, number][] = [[-1, -1], [1, -1], [1, 1], [-1, 1]];

  ctx.beginPath();
  corners.forEach(([u, v], n) => {
    const p = project({ x: tile.x + u * inset, y: tile.y + v * inset }, view.gx, view.gy, view.vScale, view.plane);
    if (n === 0) ctx.moveTo(p.x, p.y);
    else ctx.lineTo(p.x, p.y);
  });
  ctx.closePath();
  ctx.fill();
}

// Onda che parte dal quadrato: colora per un attimo le tile vicine e si allarga sempre più.
// Il fronte è un cerchio sulla griglia di tile, quindi ne esce un'onda "a pixel";
// l'intensità è a 4 livelli, non continua.
export function drawWave(
  ctx: CanvasRenderingContext2D,
  state: GameState,
  palette: Palette,
  view: View,
) {
  const T = CONFIG.topdown;
  const f = state.flow;
  const t = (view.now - f.waveAt) / T.waveMs;
  if (!(t > 0 && t < 1)) return;

  const maxRadius = Math.ceil(Math.hypot(view.width, view.height) / (2 * T.tile)) + 2;
  const radius = t * maxRadius;
  const reach = Math.ceil(radius + T.waveThickness);
  const fade = Math.pow(1 - t, 1.2);

  ctx.save();
  ctx.fillStyle = palette.fg;

  for (let dy = -reach; dy <= reach; dy++) {
    for (let dx = -reach; dx <= reach; dx++) {
      if (dx === 0 && dy === 0) continue; // la tile del quadrato

      const k = 1 - Math.abs(Math.hypot(dx, dy) - radius) / T.waveThickness;
      if (k <= 0) continue;

      const level = Math.ceil(k * 4) / 4;
      ctx.globalAlpha = 0.3 * level * fade * state.fx.worldAlpha;
      fillTile(ctx, { x: f.waveFrom.x + dx, y: f.waveFrom.y + dy }, view);
    }
  }

  ctx.restore();
}

// La tile appena lasciata si illumina per un attimo (a scatti), come un'impronta di pixel.
export function drawStamp(
  ctx: CanvasRenderingContext2D,
  state: GameState,
  palette: Palette,
  view: View,
) {
  const f = state.flow;
  if (!f.stamp) return;

  const age = (view.now - f.stampAt) / 380;
  if (!(age >= 0 && age < 1)) return;

  ctx.save();
  ctx.fillStyle = palette.fg;
  ctx.globalAlpha = 0.16 * (Math.ceil((1 - age) * 4) / 4) * state.fx.worldAlpha;
  fillTile(ctx, f.stamp, view);
  ctx.restore();
}