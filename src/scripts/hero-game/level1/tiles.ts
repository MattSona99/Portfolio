import { CONFIG, TILE, cubeMetrics } from '../core/config';
import { project } from '../core/grid';
import type { Course, HoleState, Palette, Point } from '../core/types';

function diamond(ctx: CanvasRenderingContext2D, cx: number, cy: number, a: number, b: number) {
  ctx.beginPath();
  ctx.moveTo(cx - a, cy);
  ctx.lineTo(cx, cy - b);
  ctx.lineTo(cx + a, cy);
  ctx.lineTo(cx, cy + b);
  ctx.closePath();
}

// Tile del percorso: quando il cubo le attiva in ordine si illuminano di verde per un
// secondo, poi restano appena tinte. Se il cubo ci prova a entrare nel buco senza aver
// completato il percorso, la prossima tile da attivare pulsa per indicare dove proseguire.
export function drawLitTiles(
  ctx: CanvasRenderingContext2D,
  course: Course,
  hole: HoleState,
  originX: number,
  originY: number,
  vScale: number,
  now: number,
  palette: Palette,
  alpha: number,
  vanish = 0, // 0 → 1: il percorso scompare, tile dopo tile dalla partenza al buco
) {
  if (alpha <= 0.003) return;

  const C = CONFIG.course;
  const last = course.path.length - 2; // ultima tile prima del buco
  const a = (TILE.w / 2) * 0.94;
  const b = (TILE.h / 2) * 0.94 * vScale;

  ctx.save();
  ctx.fillStyle = palette.guide;
  ctx.strokeStyle = palette.guide;
  ctx.lineJoin = 'round';

  for (let i = 1; i <= last; i++) {
    const age = (now - hole.litAt[i]) / C.litMs;
    const flash = age >= 0 && age < 1 ? Math.pow(1 - age, 1.5) : 0;
    const keep = i <= hole.progress ? C.activatedAlpha : 0;
    const fade = 1 - Math.min(1, Math.max(0, vanish * 1.6 - (i / last) * 0.6));
    if ((flash <= 0.003 && keep <= 0.003) || fade <= 0.003) continue;

    const p = project(course.path[i], originX, originY, vScale);
    diamond(ctx, p.x, p.y, a, b);

    ctx.globalAlpha = alpha * fade * (keep + flash * 0.4);
    ctx.fill();

    ctx.globalAlpha = alpha * fade * Math.min(1, keep * 3 + flash);
    ctx.lineWidth = 1.5 + flash * 1.5;
    ctx.stroke();
  }

  // Suggerimento: la prossima tile da attivare pulsa un paio di volte.
  const hintIdx = hole.progress + 1;
  const hintAge = (now - hole.hintAt) / 1600;
  if (Number.isFinite(hole.hintAt) && hintIdx <= last && hintAge >= 0 && hintAge < 1) {
    const pulse = (0.5 - 0.5 * Math.cos(hintAge * Math.PI * 6)) * (1 - hintAge);
    const p = project(course.path[hintIdx], originX, originY, vScale);
    diamond(ctx, p.x, p.y, a, b);
    ctx.globalAlpha = alpha * pulse;
    ctx.lineWidth = 2.5;
    ctx.stroke();
  }

  ctx.restore();
}

// Muro invisibile: all'impatto si rivela per un attimo come un pannello rosso eretto sul
// bordo tra la tile del cubo e la tile del buco, con un'onda che si allarga.
// (cx, cy) = centro a terra della tile da cui il cubo ha urtato; `dir` = verso il buco.
export function drawWall(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  dir: Point,
  vScale: number,
  amount: number,
  palette: Palette,
) {
  if (amount <= 0.003) return;

  const a = TILE.w / 2;
  const b = (TILE.h / 2) * vScale;
  const H = cubeMetrics().fullH * 0.85;

  // Spigolo della tile nel verso del buco.
  let p1: [number, number];
  let p2: [number, number];
  if (dir.x === 1) [p1, p2] = [[0, b], [a, 0]]; // giù-destra
  else if (dir.y === 1) [p1, p2] = [[0, b], [-a, 0]]; // giù-sinistra
  else if (dir.x === -1) [p1, p2] = [[0, -b], [-a, 0]]; // su-sinistra
  else [p1, p2] = [[0, -b], [a, 0]]; // su-destra

  const x1 = cx + p1[0];
  const y1 = cy + p1[1];
  const x2 = cx + p2[0];
  const y2 = cy + p2[1];

  ctx.save();
  ctx.strokeStyle = palette.danger;
  ctx.fillStyle = palette.danger;
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';

  // Pannello.
  ctx.globalAlpha = amount * 0.16;
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.lineTo(x2, y2 - H);
  ctx.lineTo(x1, y1 - H);
  ctx.closePath();
  ctx.fill();

  // Linee orizzontali sempre più tenui verso l'alto + spigolo di base e montanti.
  for (let k = 0; k <= 3; k++) {
    const h = (H * k) / 3;
    ctx.globalAlpha = amount * (k === 0 ? 0.9 : 0.5 * (1 - k / 4));
    ctx.lineWidth = k === 0 ? 2.5 : 1.2;
    ctx.beginPath();
    ctx.moveTo(x1, y1 - h);
    ctx.lineTo(x2, y2 - h);
    ctx.stroke();
  }

  ctx.globalAlpha = amount * 0.45;
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x1, y1 - H);
  ctx.moveTo(x2, y2);
  ctx.lineTo(x2, y2 - H);
  ctx.stroke();

  // Onda sul pavimento che parte dal punto d'impatto.
  const r = 20 + (1 - amount) * 150;
  ctx.globalAlpha = amount * 0.7;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.ellipse((x1 + x2) / 2, (y1 + y2) / 2, r, r * (TILE.h / TILE.w) * vScale, 0, 0, Math.PI * 2);
  ctx.stroke();

  ctx.restore();
}