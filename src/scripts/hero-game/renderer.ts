import { drawCube } from './cube';
import { drawInfiniteGrid, project } from './grid';
import { drawGuide } from './guide';
import { clipAboveRim, drawHole, drawRim } from './hole';
import { drawLitTiles, drawWall } from './tiles';
import { mixColors } from './color';
import { readPalette } from './palette';
import { CONFIG, baseGroundY, cubeMetrics } from './config';
import type { GameState } from './types';
import { getRenderPosition } from './animations';
import type { EyeState } from './animations';

export function render(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  state: GameState,
  eyes: EyeState,
) {
  const palette = readPalette();
  const fx = state.fx;
  const hole = state.hole;

  ctx.clearRect(0, 0, width, height);

  ctx.fillStyle = palette.bg;
  ctx.fillRect(0, 0, width, height);

  const { footY, v } = cubeMetrics();

  // La griglia resta ancorata alla Hero (centro a terra della tile (0, 0) a riposo):
  // con lo scroll si muove solo insieme alla pagina, quindi niente flickering.
  // La camera continua a seguire il cubo quando si gioca.
  const baseGround = baseGroundY(height);
  const cam = project(state.camera, 0, 0, fx.gridV);
  const originX = width / 2 - cam.x;
  const originY = baseGround - cam.y;

  // Origine di griglia, guida e buco (con un po' del tremore da schiacciamento).
  const gx = originX + fx.shakeX * 0.4;
  const gy = originY + fx.shakeY * 0.4;

  drawInfiniteGrid(ctx, width, height, gx, gy, state.camera, fx.gridV, fx.gridAlpha);

  // Tile attivate (lampo verde), guida verde verso il buco e, quando il cubo si avvicina, il buco.
  drawLitTiles(ctx, state.course, hole, gx, gy, fx.gridV, performance.now(), palette, fx.worldAlpha);
  drawGuide(ctx, state.course, hole.progress, gx, gy, fx.gridV, state.lastFrame, palette, fx.worldAlpha);

  if (hole.reveal > 0) {
    const hp = project(state.course.hole, gx, gy, fx.gridV);
    drawHole(ctx, hp.x, hp.y, fx.gridV, hole.reveal, palette, fx.worldAlpha, hole.unlock, hole.deny);
  }

  // Dall'esplosione in poi il cubo e i suoi pezzi sono disegnati dall'overlay a schermo intero.
  if (fx.explode > 0) return;

  // Il cubo "galleggia" sopra la griglia: segue il centro della fascia libera e,
  // sotto pressione, si appoggia al pavimento (fx.groundY).
  const floatY = Number.isFinite(fx.groundY) ? fx.groundY - baseGround : 0;
  const ground = project(getRenderPosition(state), originX, originY, fx.gridV);
  const groundY = ground.y + floatY;

  // Tuffo nel buco: il cubo scende e ciò che passa sotto il bordo anteriore sparisce.
  const sinking = hole.sink > 0;

  // Il cubo diventa rosso quando urta il muro invisibile.
  const cubePalette = hole.tint > 0.003
    ? { ...palette, fg: mixColors(palette.fg, palette.danger, hole.tint) }
    : palette;

  // Muro invisibile: dietro al cubo se è sul lato lontano, davanti se è sul lato vicino.
  let wall: (() => void) | null = null;
  if (hole.wall > 0.003 && hole.wallFrom) {
    const dir = { x: state.course.hole.x - hole.wallFrom.x, y: state.course.hole.y - hole.wallFrom.y };
    const wp = project(hole.wallFrom, originX, originY, fx.gridV);
    wall = () => drawWall(ctx, wp.x, wp.y + floatY, dir, fx.gridV, hole.wall * fx.worldAlpha, palette);
    if (dir.x + dir.y < 0) {
      wall();
      wall = null;
    }
  }
  const sinkPx = hole.sink * v * CONFIG.hole.sinkRatio;

  ctx.save();

  // Sotto pressione il cubo non deve uscire dalla fascia tra navbar e fine della Hero.
  if (fx.press > 0) {
    ctx.beginPath();
    ctx.rect(0, fx.bandTop, width, Math.max(0, fx.bandBottom - fx.bandTop));
    ctx.clip();
  }

  if (sinking) clipAboveRim(ctx, ground.x, groundY, fx.gridV);

  drawCube(
    ctx,
    ground.x + fx.shakeX,
    groundY - footY + fx.shakeY + sinkPx,
    cubePalette,
    state.roll,
    state.hop,
    eyes,
    state.moveDir,
    { sx: fx.squashX, sy: fx.squashY, explode: 0 },
    hole.fill,
  );

  ctx.restore();

  wall?.();

  // Bordo anteriore del buco, sopra il cubo.
  if (sinking) drawRim(ctx, ground.x, groundY, fx.gridV, palette, fx.worldAlpha);
}