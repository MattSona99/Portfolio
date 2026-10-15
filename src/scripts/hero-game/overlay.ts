import { drawCube } from './cube';
import { readPalette } from './palette';
import { TILE, cubeMetrics } from './config';
import type { HeroFx, Palette } from './types';
import type { EyeState } from './animations';

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

  // Onda d'urto isometrica che parte dal punto dell'esplosione.
  const drawShockwave = (x: number, y: number, t: number, palette: Palette) => {
    const out = 1 - Math.pow(1 - t, 3);
    const rx = 80 + out * Math.max(width, height) * 0.9;
    const ry = rx * (TILE.h / TILE.w);
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

  function draw(fx: HeroFx, eyes: EyeState) {
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

    if (fx.wave > 0) drawShockwave(fx.blastX, fx.blastY, fx.wave, palette);

    // Stesso cubo che si vedeva nella Hero, ora in coordinate viewport.
    drawCube(
      ctx,
      fx.blastX + fx.shakeX,
      fx.blastY - footY + fx.shakeY,
      palette,
      0,
      0,
      eyes,
      null,
      {
        sx: fx.squashX,
        sy: fx.squashY,
        explode: fx.explode,
        fly: fx.fly,
        vw: width,
        vh: height,
      },
    );
  }

  function destroy() {
    observer.disconnect();
    canvas.remove();
  }

  return { draw, destroy };
}