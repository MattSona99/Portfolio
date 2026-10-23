import { drawPlayer } from './player';
import { drawHint, drawRoomBase, drawRoomObjects } from './room';
import { drawStamp, drawWave } from './wave';
import type { GameState, Palette, View } from '../core/types';

// Livello 2: stanza (pavimento, muri, buchi, varco), onda dal quadrato, impronta della tile
// lasciata, blocchi e quadrato 2D.
export function drawLevel2(
  ctx: CanvasRenderingContext2D,
  state: GameState,
  palette: Palette,
  view: View,
) {
  const fx = state.fx;

  drawRoomBase(ctx, state, palette, view);
  drawWave(ctx, state, palette, view);
  drawStamp(ctx, state, palette, view);
  drawRoomObjects(ctx, state, palette, view);

  // Dall'esplosione in poi il quadrato è disegnato dall'overlay come esplosione di pixel.
  if (fx.explode > 0) return;

  ctx.save();

  // Sotto pressione il quadrato non deve uscire dalla fascia tra navbar e fine della Hero.
  if (fx.press > 0) {
    ctx.beginPath();
    ctx.rect(0, fx.bandTop, view.width, Math.max(0, fx.bandBottom - fx.bandTop));
    ctx.clip();
  }

  drawPlayer(ctx, state, palette, view);

  ctx.restore();

  drawHint(ctx, state, palette, view);
}