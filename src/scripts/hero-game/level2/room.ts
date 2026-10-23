import { CONFIG } from '../core/config';
import { mixColors } from '../core/color';
import { project } from '../core/grid';
import { moveFrame } from './player';
import { waveMaxRadius } from './wave';
import type { GameState, Palette, Point, View } from '../core/types';

const clamp01 = (t: number) => Math.min(1, Math.max(0, t));
const smooth = (t: number) => t * t * (3 - 2 * t);
const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);
const hash = (n: number) => {
  const r = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return r - Math.floor(r);
};

// Quanto di un oggetto della stanza è già comparso: la stanza si rivela con l'onda che parte
// dal quadrato, tile dopo tile, a 3 livelli (a scatti, come tutto il resto del livello 2).
function reveal(state: GameState, tile: Point, view: View): number {
  const L = state.level2;
  const t = (view.now - L.revealAt) / CONFIG.topdown.waveMs;
  if (!(t > 0)) return 0;
  if (t >= 1) return 1;

  const radius = t * waveMaxRadius(state, view);
  const d = Math.hypot(tile.x - L.revealFrom.x, tile.y - L.revealFrom.y);
  return Math.ceil(clamp01((radius - d) / 1.4) * 3) / 3;
}

// Percorso di un quadrato di mezzo lato `half` (in tile) centrato sulla tile `c`.
function quad(ctx: CanvasRenderingContext2D, c: Point, half: number, view: View) {
  const corners: [number, number][] = [[-1, -1], [1, -1], [1, 1], [-1, 1]];

  ctx.beginPath();
  corners.forEach(([u, v], n) => {
    const p = project({ x: c.x + u * half, y: c.y + v * half }, view.gx, view.gy, view.vScale, view.plane);
    if (n === 0) ctx.moveTo(p.x, p.y);
    else ctx.lineTo(p.x, p.y);
  });
  ctx.closePath();
}

const key = (p: Point) => `${p.x},${p.y}`;

// Pavimento, muri, varco e buchi della stanza.
export function drawRoomBase(
  ctx: CanvasRenderingContext2D,
  state: GameState,
  palette: Palette,
  view: View,
) {
  const L = state.level2;
  if (!L.placed) return;

  const room = L.room;
  const world = state.fx.worldAlpha;
  const now = view.now;

  const wallFill = mixColors(palette.bg, palette.fg, 0.2);
  const wallInner = mixColors(palette.bg, palette.fg, 0.32);
  const pitFill = mixColors(palette.bg, '#000000', 0.5);

  const drawWall = (tile: Point, alpha: number) => {
    if (alpha <= 0.003) return;
    ctx.globalAlpha = alpha;
    ctx.fillStyle = wallFill;
    quad(ctx, tile, 0.5, view);
    ctx.fill();
    ctx.fillStyle = wallInner;
    quad(ctx, tile, 0.36, view);
    ctx.fill();
  };

  ctx.save();
  ctx.lineJoin = 'miter';

  // Pavimento: appena più chiaro dello sfondo, per distinguere l'interno della stanza.
  ctx.fillStyle = palette.fg;
  for (let y = 0; y < room.h; y++) {
    for (let x = 0; x < room.w; x++) {
      const tile = { x: L.origin.x + x, y: L.origin.y + y };
      if (L.walls.has(key(tile))) continue;

      const a = reveal(state, tile, view) * world;
      if (a <= 0.003) continue;

      ctx.globalAlpha = a * 0.035;
      quad(ctx, tile, 0.5, view);
      ctx.fill();
    }
  }

  // Muri.
  for (const w of L.wallList) drawWall(w, reveal(state, w, view) * world);

  // Varco: finché i buchi non sono pieni è un muro; quando si apre, il muro si dissolve a pixel
  // e al suo posto compare una linea verde (la striscia 1D) che porta fuori dalla stanza.
  {
    const a = reveal(state, L.exit, view) * world;
    drawWall(L.exit, a * (1 - L.exitOpen));

    if (L.exitOpen > 0.01 && a > 0.003) {
      const pulse = 0.65 + 0.35 * Math.sin(now / 220);

      ctx.strokeStyle = palette.guide;
      ctx.lineWidth = 3;
      ctx.globalAlpha = a * L.exitOpen * pulse;
      quad(ctx, L.exit, 0.46, view);
      ctx.stroke();

      const p0 = project(L.exit, view.gx, view.gy, view.vScale, view.plane);
      const p1 = project(
        { x: L.exit.x + L.exitDir.x * 3, y: L.exit.y + L.exitDir.y * 3 },
        view.gx,
        view.gy,
        view.vScale,
        view.plane,
      );

      ctx.lineCap = 'round';
      ctx.lineWidth = 4;
      ctx.setLineDash([CONFIG.guide.dash, CONFIG.guide.gap]);
      ctx.lineDashOffset = -(now / 1000) * CONFIG.guide.speed;
      ctx.globalAlpha = a * L.exitOpen;
      ctx.beginPath();
      ctx.moveTo(p0.x, p0.y);
      ctx.lineTo(p1.x, p1.y);
      ctx.stroke();
      ctx.setLineDash([]);
    }
  }

  // Buchi: aperti = pozzo con pareti annidate (come nel livello 1, visto dall'alto);
  // pieni = pavimento rattoppato, con un lampo verde appena riempiti.
  ctx.lineWidth = 2;
  for (const hole of L.holes) {
    const a = reveal(state, hole.at, view) * world;
    if (a <= 0.003) continue;

    if (!hole.filled) {
      ctx.fillStyle = pitFill;
      ctx.globalAlpha = a;
      quad(ctx, hole.at, 0.46, view);
      ctx.fill();

      ctx.strokeStyle = palette.fg;
      [0.46, 0.33, 0.2].forEach((half, i) => {
        ctx.globalAlpha = a * (0.85 - i * 0.28);
        quad(ctx, hole.at, half, view);
        ctx.stroke();
      });
    } else {
      ctx.fillStyle = palette.fg;
      ctx.globalAlpha = a * 0.07;
      quad(ctx, hole.at, 0.46, view);
      ctx.fill();

      ctx.strokeStyle = palette.fg;
      ctx.globalAlpha = a * 0.22;
      quad(ctx, hole.at, 0.22, view);
      ctx.stroke();

      const age = (now - hole.fillAt) / 700;
      if (age >= 0 && age < 1) {
        ctx.fillStyle = palette.guide;
        ctx.globalAlpha = a * 0.45 * (Math.ceil((1 - age) * 4) / 4);
        quad(ctx, hole.at, 0.46, view);
        ctx.fill();
      }
    }
  }

  ctx.restore();
}

// Blocchi (anche mentre vengono spinti, a fotogrammi come il quadrato) e scoppi di pixel.
export function drawRoomObjects(
  ctx: CanvasRenderingContext2D,
  state: GameState,
  palette: Palette,
  view: View,
) {
  const L = state.level2;
  if (!L.placed) return;

  const world = state.fx.worldAlpha;
  const now = view.now;
  const P = CONFIG.topdown.pixel;
  const snap = (v: number) => Math.round(v / P) * P;

  const crateFill = mixColors(palette.bg, palette.fg, 0.12);
  const push = state.target && L.plan?.push ? L.plan.push : null;
  const q = push ? moveFrame(state) : 0;

  ctx.save();
  ctx.lineJoin = 'miter';

  L.blocks.forEach((b, i) => {
    // Il blocco spinto avanza con gli stessi fotogrammi del quadrato.
    const at =
      push && push.index === i
        ? { x: push.from.x + (push.to.x - push.from.x) * q, y: push.from.y + (push.to.y - push.from.y) * q }
        : b;

    const a = reveal(state, b, view) * world;
    if (a <= 0.003) return;

    ctx.globalAlpha = a;
    ctx.fillStyle = crateFill;
    ctx.strokeStyle = palette.fg;
    ctx.lineWidth = 3;
    quad(ctx, at, 0.38, view);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = palette.fg;
    quad(ctx, at, 0.15, view);
    ctx.fill();
  });

  // Scoppi di pixel quando un blocco riempie un buco.
  L.puffs = L.puffs.filter((p) => now - p.t < 600);
  for (const puff of L.puffs) {
    const age = (now - puff.t) / 600;
    const c = project(puff.at, view.gx, view.gy, view.vScale, view.plane);
    const out = easeOutCubic(age);

    for (let i = 0; i < 16; i++) {
      const ang = hash(i * 2 + 1) * Math.PI * 2;
      const dist = out * CONFIG.topdown.tile * (0.35 + 0.5 * hash(i * 2 + 2));
      const size = Math.max(P, snap(10 * (1 - age)));

      ctx.globalAlpha = (1 - age) * world;
      ctx.fillStyle = i % 2 ? palette.guide : palette.fg;
      ctx.fillRect(snap(c.x + Math.cos(ang) * dist - size / 2), snap(c.y + Math.sin(ang) * dist - size / 2), size, size);
    }
  }

  ctx.restore();
}

// Promemoria dei comandi, discreto, dopo che la stanza è comparsa.
export function drawHint(
  ctx: CanvasRenderingContext2D,
  state: GameState,
  palette: Palette,
  view: View,
) {
  const L = state.level2;
  if (!L.placed || L.done) return;

  const a = smooth(clamp01((view.now - L.revealAt - CONFIG.topdown.waveMs) / 700)) * 0.5 * state.fx.worldAlpha;
  if (a <= 0.01) return;

  ctx.save();
  ctx.globalAlpha = a;
  ctx.fillStyle = palette.fg;
  ctx.font = '12px ui-monospace, SFMono-Regular, Menlo, Consolas, monospace';
  ctx.textAlign = 'center';
  ctx.fillText('Z  annulla      R  ricomincia', view.width / 2, view.height - 22);
  ctx.restore();
}