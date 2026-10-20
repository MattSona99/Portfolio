import { drawInfiniteGrid, project } from './grid';
import { readPalette } from './palette';
import { baseGroundAt } from './config';
import { drawLevel1 } from '../level1/draw';
import { drawLevel2 } from '../level2/draw';
import type { GameState, View } from './types';
import type { EyeState } from '../level1/animations';

// Disegno di un frame: sfondo e griglia (comuni a tutti i livelli), poi i livelli.
// La griglia passa da isometrica (plane = 0) a vista dall'alto (plane = 1) con continuità.
export function render(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  state: GameState,
  eyes: EyeState,
) {
  const palette = readPalette();
  const fx = state.fx;
  const plane = state.flow.plane;

  ctx.clearRect(0, 0, width, height);

  ctx.fillStyle = palette.bg;
  ctx.fillRect(0, 0, width, height);

  // La griglia resta ancorata alla Hero: con lo scroll si muove solo insieme alla pagina,
  // quindi niente flickering. La camera segue il giocatore. Col piano 2D il centro a terra
  // sale al centro esatto del canvas: il quadrato sta al centro della griglia.
  const baseGround = baseGroundAt(height, plane);
  const cam = project(state.camera, 0, 0, fx.gridV, plane);
  const originX = width / 2 - cam.x;
  const originY = baseGround - cam.y;

  const view: View = {
    width,
    height,
    originX,
    originY,
    // Origine di griglia, guida, buco e onda (con un po' del tremore da schiacciamento).
    gx: originX + fx.shakeX * 0.4,
    gy: originY + fx.shakeY * 0.4,
    vScale: fx.gridV,
    plane,
    floatY: Number.isFinite(fx.groundY) ? fx.groundY - baseGround : 0,
    now: performance.now(),
  };

  drawInfiniteGrid(ctx, width, height, view.gx, view.gy, state.camera, fx.gridV, fx.gridAlpha, plane);

  drawLevel1(ctx, state, eyes, palette, view);
  if (plane > 0) drawLevel2(ctx, state, palette, view);
}