import { drawCube } from './cube';
import { drawInfiniteGrid, project } from './grid';
import { readPalette } from './palette';
import { TILE, baseGroundY, cubeMetrics } from './config';
import type { GameState, Palette } from './types';
import { getRenderPosition } from './animations';
import type { EyeState } from './animations';

// Onda d'urto isometrica che parte dal cubo quando esplode.
function drawShockwave(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  e: number,
  vScale: number,
  palette: Palette,
) {
  const t = Math.min(1, e);
  const out = 1 - Math.pow(1 - t, 3);
  const rx = 80 + out * 900;
  const ry = rx * (TILE.h / TILE.w) * vScale;
  const ramp = Math.min(1, t * 10);

  ctx.save();
  ctx.globalAlpha = (1 - t) * 0.7 * ramp;
  ctx.strokeStyle = palette.fg;
  ctx.lineWidth = 1 + (1 - t) * 3;
  ctx.beginPath();
  ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();
}

export function render(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  state: GameState,
  eyes: EyeState,
) {
  const palette = readPalette();
  const fx = state.fx;

  ctx.clearRect(0, 0, width, height);

  ctx.fillStyle = palette.bg;
  ctx.fillRect(0, 0, width, height);

  const { footY } = cubeMetrics();

  // Punto dello schermo in cui la camera "guarda" (centro a terra del cubo).
  // Con lo scroll si sposta verso il centro della fascia libera della Hero.
  const centerX = width / 2;
  const centerY = Number.isFinite(fx.groundY) ? fx.groundY : baseGroundY(height);

  // Dove cade a schermo la tile (0, 0): la camera è al centro, quindi tutto il
  // mondo scorre di quanto la camera si è allontanata dall'origine.
  const cam = project(state.camera, 0, 0, fx.gridV);
  const originX = centerX - cam.x;
  const originY = centerY - cam.y;

  drawInfiniteGrid(
    ctx,
    width,
    height,
    originX + fx.shakeX * 0.4,
    originY + fx.shakeY * 0.4,
    state.camera,
    fx.gridV,
    fx.gridAlpha,
  );

  // Centro a terra del cubo (interpolato durante il salto), relativo alla camera.
  const ground = project(getRenderPosition(state), originX, originY, fx.gridV);

  ctx.save();

  // Sotto pressione il cubo (e i detriti) non devono uscire dalla fascia
  // tra navbar e fine della Hero.
  if (fx.press > 0) {
    ctx.beginPath();
    ctx.rect(0, fx.bandTop, width, Math.max(0, fx.bandBottom - fx.bandTop));
    ctx.clip();
  }

  if (fx.explode > 0) {
    drawShockwave(ctx, ground.x, ground.y, fx.explode, fx.gridV, palette);
  }

  drawCube(
    ctx,
    ground.x + fx.shakeX,
    ground.y - footY + fx.shakeY,
    palette,
    state.roll,
    state.hop,
    eyes,
    state.moveDir,
    { sx: fx.squashX, sy: fx.squashY, explode: fx.explode },
  );

  ctx.restore();
}