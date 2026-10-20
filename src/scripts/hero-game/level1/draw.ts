import { drawCube } from './cube';
import { drawGuide } from './guide';
import { clipAboveRim, drawHole, drawRim } from './hole';
import { drawLitTiles, drawWall } from './tiles';
import { getRenderPosition } from '../level1/animations';
import type { EyeState } from '../level1/animations';
import { project } from '../core/grid';
import { CONFIG, cubeMetrics } from '../core/config';
import { mixColors } from '../core/color';
import type { GameState, Palette, View } from '../core/types';

const clamp01 = (t: number) => Math.min(1, Math.max(0, t));
const smooth = (t: number) => t * t * (3 - 2 * t);

// Livello 1: percorso verde, tile illuminate, buco e cubo isometrico.
// Con il piano che diventa 2D il percorso e il buco spariscono e il cubo lascia il posto
// al quadrato (vedi level2/draw.ts).
export function drawLevel1(
  ctx: CanvasRenderingContext2D,
  state: GameState,
  eyes: EyeState,
  palette: Palette,
  view: View,
) {
  const fx = state.fx;
  const hole = state.hole;
  const { gx, gy, originX, originY, vScale, plane, floatY, now } = view;
  const { footY, v } = cubeMetrics();

  // Percorso verde: scompare quando il livello è completato (tile dopo tile + guida che svanisce).
  if (plane <= 0) {
    const vanish = state.flow.vanish;
    const pathAlpha = fx.worldAlpha * (1 - smooth(clamp01(vanish)));
    drawLitTiles(ctx, state.course, hole, gx, gy, vScale, now, palette, fx.worldAlpha, vanish);
    drawGuide(ctx, state.course, hole.progress, gx, gy, vScale, state.lastFrame, palette, pathAlpha);
  }

  // Buco: si chiude (svanisce) appena il piano comincia a trasformarsi.
  const holeFade = 1 - smooth(clamp01(plane * 6));
  if (hole.reveal > 0 && holeFade > 0.003) {
    const hp = project(state.course.hole, gx, gy, vScale, plane);
    drawHole(ctx, hp.x, hp.y, vScale, hole.reveal, palette, fx.worldAlpha * holeFade, hole.unlock, hole.deny);
  }

  // Dall'esplosione in poi il giocatore è disegnato dall'overlay a schermo intero;
  // con il piano 2D il giocatore è il quadrato.
  if (fx.explode > 0 || plane > 0) return;

  // Il cubo "galleggia" sopra la griglia: segue il centro della fascia libera e,
  // sotto pressione, si appoggia al pavimento (fx.groundY).
  const ground = project(getRenderPosition(state), originX, originY, vScale);
  const groundY = ground.y + floatY;

  // Tuffo nel buco: il cubo scende e ciò che passa sotto il bordo anteriore sparisce.
  const sinking = hole.sink > 0;
  const sinkPx = hole.sink * v * CONFIG.hole.sinkRatio;

  // Il cubo diventa rosso quando urta il muro invisibile.
  const cubePalette =
    hole.tint > 0.003
      ? { ...palette, fg: mixColors(palette.fg, palette.danger, hole.tint) }
      : palette;

  // Muro invisibile: dietro al cubo se è sul lato lontano, davanti se è sul lato vicino.
  let wall: (() => void) | null = null;
  if (hole.wall > 0.003 && hole.wallFrom) {
    const dir = { x: state.course.hole.x - hole.wallFrom.x, y: state.course.hole.y - hole.wallFrom.y };
    const wp = project(hole.wallFrom, originX, originY, vScale);
    wall = () => drawWall(ctx, wp.x, wp.y + floatY, dir, vScale, hole.wall * fx.worldAlpha, palette);
    if (dir.x + dir.y < 0) {
      wall();
      wall = null;
    }
  }

  ctx.save();

  // Sotto pressione il cubo non deve uscire dalla fascia tra navbar e fine della Hero.
  if (fx.press > 0) {
    ctx.beginPath();
    ctx.rect(0, fx.bandTop, view.width, Math.max(0, fx.bandBottom - fx.bandTop));
    ctx.clip();
  }

  if (sinking) clipAboveRim(ctx, ground.x, groundY, vScale);

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
  if (sinking) drawRim(ctx, ground.x, groundY, vScale, palette, fx.worldAlpha);
}