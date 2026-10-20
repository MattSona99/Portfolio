import { drawCube } from '../level1/cube';
import { readPalette } from './palette';
import { TILE, bodyMetrics, cubeMetrics } from './config';
import { drawSquareBurst } from '../level2/burst';
import type { HeroFx, Palette } from './types';
import type { EyeState } from '../level1/animations';

// Canvas fisso a tutto schermo, sopra a tutto il sito, usato solo durante l'esplosione:
// i pezzi del cubo escono dalla Hero, si disperdono per la pagina e svaniscono.
// Non intercetta il mouse. Lo crea e lo rimuove il gioco, non serve markup in Astro.
export function createBlastOverlay() {
  const canvas = document.createElement('canvas');
  canvas.setAttribute('aria-hidden', 'true');
  Object.assign(canvas.style, {
    position: 'fixed',
    inset: '0',
    width: '100%',
    height: '100%',
    pointerEvents: 'none',
    zIndex: '2147483000',
  });
  document.body.appendChild(canvas);

  const ctx = canvas.getContext('2d');
  let width = 0;
  let height = 0;
  let dirty = false;

  const resize = () => {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    width = canvas.clientWidth;
    height = canvas.clientHeight;
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    ctx?.setTransform(dpr, 0, 0, dpr, 0, 0);
  };

  const observer = new ResizeObserver(resize);
  observer.observe(canvas);
  resize();

  // Onda d'urto che parte dal punto dell'esplosione: ellittica (isometrica) o circolare (2D).
  const drawShockwave = (x: number, y: number, t: number, palette: Palette, plane: number) => {
    const out = 1 - Math.pow(1 - t, 3);
    const rx = 80 + out * Math.max(width, height) * 0.9;
    const ry = rx * (TILE.h / TILE.w + (1 - TILE.h / TILE.w) * plane);
    const ramp = Math.min(1, t * 10);

    ctx!.save();
    ctx!.globalAlpha = (1 - t) * 0.7 * ramp;
    ctx!.strokeStyle = palette.fg;
    ctx!.lineWidth = 1 + (1 - t) * 3;
    ctx!.beginPath();
    ctx!.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
    ctx!.stroke();
    ctx!.restore();
  };

  // `plane` = 0 isometrico (esplode il cubo), 1 vista dall'alto (esplode il quadrato in pixel).
  function draw(fx: HeroFx, eyes: EyeState, plane = 0) {
    if (!ctx) return;

    // Nessuna esplosione in corso: pulisci una volta sola e non fare altro.
    if (fx.explode <= 0) {
      if (dirty) {
        ctx.clearRect(0, 0, width, height);
        dirty = false;
      }
      return;
    }

    dirty = true;
    ctx.clearRect(0, 0, width, height);

    const palette = readPalette();
    const { footY } = cubeMetrics();

    if (fx.wave > 0) drawShockwave(fx.blastX, fx.blastY, fx.wave, palette, plane);

    const burst = {
      sx: fx.squashX,
      sy: fx.squashY,
      explode: fx.explode,
      fly: fx.fly,
      vw: width,
      vh: height,
    };

    // Livello 2: il quadrato si frantuma in blocchi di pixel.
    if (plane >= 0.5) {
      drawSquareBurst(
        ctx,
        fx.blastX + fx.shakeX,
        fx.blastY + fx.shakeY,
        bodyMetrics(plane).fullH,
        burst,
        palette,
      );
      return;
    }

    // Livello 1: stesso cubo che si vedeva nella Hero, ora in coordinate viewport.
    drawCube(
      ctx,
      fx.blastX + fx.shakeX,
      fx.blastY - footY + fx.shakeY,
      palette,
      0,
      0,
      eyes,
      null,
      burst,
    );
  }

  function destroy() {
    observer.disconnect();
    canvas.remove();
  }

  return { draw, destroy };
}