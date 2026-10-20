import { CONFIG, cubeMetrics } from "../core/config";
import type { MoveDir, Palette } from "../core/types";
import { mixColors } from "../core/color";
import { createEyeState } from "./animations";
import type { EyeState } from "./animations";

// Stato neutro usato quando non vengono passati occhi.
const NEUTRAL_EYES = createEyeState();

// ───────────────────────── Geometria 3D del cubo ─────────────────────────
//
// Coordinate del cubo (a, b, c), ognuna in [0, 1]:
//   a → verso destra-su     (spigolo in alto a destra)
//   b → verso sinistra-su   (spigolo in alto a sinistra)
//   c → verso il basso      (spigolo verticale)
// Origine = vertice alto più vicino allo spettatore (0, 0) a schermo.
// Faccia destra = b = 0, faccia sinistra = a = 0, faccia sopra = c = 0.

type V3 = [number, number, number];

// Asse orizzontale (0 = a, 1 = b) e verso verso cui il cubo si ribalta.
// downRight (x+) = verso -b, downLeft (y+) = verso -a, e così via.
const ROLL_AXIS: Record<MoveDir, { axis: 0 | 1; sign: 1 | -1 }> = {
  downRight: { axis: 1, sign: -1 },
  upLeft: { axis: 1, sign: 1 },
  downLeft: { axis: 0, sign: -1 },
  upRight: { axis: 0, sign: 1 },
};

// Rotazione di `angle` attorno al centro del cubo: la faccia in alto va "avanti"
// nella direzione del salto. Con center = 0.5 ruota punti, con center = 0 vettori.
function rotateRoll(
  p: V3,
  axis: 0 | 1,
  sign: 1 | -1,
  angle: number,
  center: number,
): V3 {
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);

  const s = sign * (p[axis] - center); // coordinata lungo la direzione del salto
  const u = center - p[2]; // altezza (c cresce verso il basso)

  const s2 = s * cos + u * sin;
  const u2 = -s * sin + u * cos;

  const out: V3 = [p[0], p[1], p[2]];
  out[axis] = center + sign * s2;
  out[2] = center - u2;
  return out;
}

// I 12 spigoli, con le due facce (asse, lato) che li condividono.
type Edge = { from: V3; to: V3; faces: [[number, number], [number, number]] };

const EDGES: Edge[] = (() => {
  const edges: Edge[] = [];
  for (let k = 0; k < 3; k++) {
    const [i, j] = [0, 1, 2].filter((x) => x !== k);
    for (const vi of [0, 1]) {
      for (const vj of [0, 1]) {
        const from: V3 = [0, 0, 0];
        from[i] = vi;
        from[j] = vj;
        const to: V3 = [from[0], from[1], from[2]];
        to[k] = 1;
        edges.push({ from, to, faces: [[i, vi], [j, vj]] });
      }
    }
  }
  return edges;
})();

const clamp01 = (t: number) => Math.min(1, Math.max(0, t));
const smooth = (t: number) => t * t * (3 - 2 * t);
const easeOutBack = (t: number) => {
  const c1 = 1.70158;
  const c3 = c1 + 1;
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
};

const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);

// Pseudo-random deterministico: l'esplosione dipende solo dallo scroll, quindi
// tornando indietro i pezzi si ricompongono esattamente.
const hash = (n: number) => {
  const r = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return r - Math.floor(r);
};

// fly/vw/vh: dispersione dei pezzi per tutta la pagina (solo nel canvas overlay).
type Burst = { sx: number; sy: number; explode: number; fly?: number; vw?: number; vh?: number };
const NEUTRAL_BURST: Burst = { sx: 1, sy: 1, explode: 0 };

export function drawCube(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  palette: Palette,
  roll: number, // 0 → 1: ribaltamento di 90° durante il salto
  hop: number,
  eyes?: EyeState,
  moveDir: MoveDir | null = null,
  burst: Burst = NEUTRAL_BURST, // schiacciamento + esplosione guidati dallo scroll
  fill = 0, // 0 → 1: facce piene di colore --fg (cubo dentro al buco)
) {
  const s = CONFIG.cubeSize;
  const { half, h, v } = cubeMetrics();

  const e = eyes ?? NEUTRAL_EYES;

  // Proiezione: stessi vertici di prima (0,0), (half,-h), (-half,-h), (0,v)...
  const proj = (p: V3) => ({
    x: p[0] * half + p[1] * -half,
    y: p[0] * -h + p[1] * -h + p[2] * v,
  });

  // Direzione di vista (vettore nullo della proiezione): serve a capire
  // quali facce sono rivolte verso di noi.
  const view: V3 = [1, 1, (2 * h) / v];

  const roll01 = clamp01(roll);
  const dir = moveDir && roll01 > 0 ? ROLL_AXIS[moveDir] : null;
  const angle = roll01 * (Math.PI / 2);

  const rot = (p: V3, center: number): V3 =>
    dir ? rotateRoll(p, dir.axis, dir.sign, angle, center) : p;

  // > 0 = faccia rivolta verso lo spettatore (1 = come a riposo per la faccia destra).
  const facing = (axis: number, side: number) => {
    const n: V3 = [0, 0, 0];
    n[axis] = side ? 1 : -1;
    const r = rot(n, 0);
    return -(r[0] * view[0] + r[1] * view[1] + r[2] * view[2]);
  };

  const front: number[][] = [0, 1, 2].map((axis) => [facing(axis, 0), facing(axis, 1)]);

  ctx.save();

  // Corpo: spostamento + squash & stretch ancorato alla base + rotazione.
  ctx.translate(x + e.bodyX * s, y - hop + e.bodyY * s);
  ctx.translate(0, v);
  ctx.scale(e.bodyScaleX * burst.sx, e.bodyScaleY * burst.sy);
  ctx.translate(0, -v);
  ctx.rotate(e.bodyRotation);

  // ── Spigoli: pieni se visibili, tratteggiati se nascosti ──
  const ex = clamp01(burst.explode);
  const fly = clamp01(burst.fly ?? 0);
  const flyOut = easeOutCubic(fly);
  const vw = burst.vw ?? 0;
  const vh = burst.vh ?? 0;
  // Origine locale del disegno (stessa translate usata sopra).
  const originX = x + e.bodyX * s;
  const originY = y - hop + e.bodyY * s;
  const center = proj([0.5, 0.5, 0.5]);

  // Con le facce piene gli spigoli diventano scuri, per tenere leggibile la forma.
  ctx.strokeStyle = fill > 0 ? mixColors(palette.fg, palette.bg, 0.85 * fill) : palette.fg;
  ctx.lineWidth = 2;
  ctx.lineJoin = "round";

  if (ex <= 0) {
    const solid: [{ x: number; y: number }, { x: number; y: number }][] = [];
    const hidden: [{ x: number; y: number }, { x: number; y: number }][] = [];

    for (const edge of EDGES) {
      const visible = edge.faces.some(([ax, sd]) => front[ax][sd] > 1e-6);
      const a = proj(rot(edge.from, 0.5));
      const b = proj(rot(edge.to, 0.5));
      (visible ? solid : hidden).push([a, b]);
    }

    // Facce piene: sopra più chiara, poi sinistra e destra.
    if (fill > 0) {
      ctx.fillStyle = palette.fg;

      for (let axis = 0; axis < 3; axis++) {
        for (const side of [0, 1]) {
          if (front[axis][side] <= 1e-6) continue;

          const [i, j] = [0, 1, 2].filter((q) => q !== axis);
          const corners: [number, number][] = [[0, 0], [1, 0], [1, 1], [0, 1]];

          ctx.beginPath();
          corners.forEach(([u, w], n) => {
            const c: V3 = [0, 0, 0];
            c[axis] = side;
            c[i] = u;
            c[j] = w;
            const q = proj(rot(c, 0.5));
            if (n === 0) ctx.moveTo(q.x, q.y);
            else ctx.lineTo(q.x, q.y);
          });
          ctx.closePath();

          ctx.globalAlpha = fill * (axis === 2 ? 1 : axis === 0 ? 0.78 : 0.6);
          ctx.fill();
        }
      }

      ctx.globalAlpha = 1;
    }

    ctx.lineCap = "round";

    ctx.beginPath();
    for (const [a, b] of solid) {
      ctx.moveTo(a.x, a.y);
      ctx.lineTo(b.x, b.y);
    }
    ctx.stroke();

    ctx.beginPath();
    ctx.lineCap = "butt";
    ctx.setLineDash([5, 5]);
    ctx.globalAlpha = 0.35 * (1 - fill);
    for (const [a, b] of hidden) {
      ctx.moveTo(a.x, a.y);
      ctx.lineTo(b.x, b.y);
    }
    ctx.stroke();

    ctx.setLineDash([]);
    ctx.globalAlpha = 1.0;
  } else {
    // ── Esplosione (guidata dallo scroll) ──
    // Fase 1 (ex): gli spigoli si staccano e volano via ruotando, schiacciati in verticale.
    // Fase 2 (fly): i pezzi proseguono verso punti sparsi di tutta la pagina e svaniscono.
    // Tornando indietro le stesse formule li riportano da quei punti dentro il cubo.
    const out = easeOutCubic(ex);
    const alphaFar = 1 - smooth(clamp01((fly - 0.5) / 0.5));
    const shrink = 1 - 0.55 * flyOut;

    ctx.lineCap = "round";

    EDGES.forEach((edge, i) => {
      const a = proj(rot(edge.from, 0.5));
      const b = proj(rot(edge.to, 0.5));

      const midX = (a.x + b.x) / 2;
      const midY = (a.y + b.y) / 2;
      const vx0 = midX - center.x;
      const vy0 = midY - center.y;
      const len = Math.hypot(vx0, vy0) || 1;

      const r1 = hash(i * 3 + 1);
      const r2 = hash(i * 3 + 2);

      // Posizione dopo la fase 1.
      const dist = out * (150 + 260 * r1);
      const nearX = midX + (vx0 / len) * dist + (r2 - 0.5) * 60 * out;
      const nearY = midY + (vy0 / len) * dist * 0.45 + ex * ex * 90 * (0.5 + r1);

      // Fase 2: verso un punto lontano della pagina, con una piccola curva.
      const farX = hash(i * 5 + 21) * vw - originX;
      const farY = hash(i * 5 + 22) * vh - originY;
      const dx = farX - nearX;
      const dy = farY - nearY;
      const dl = Math.hypot(dx, dy) || 1;
      const curve = Math.sin(Math.PI * flyOut) * (r2 - 0.5) * 260;

      const px0 = nearX + dx * flyOut - (dy / dl) * curve;
      const py0 = nearY + dy * flyOut + (dx / dl) * curve;

      const ang =
        (r2 - 0.5) * Math.PI * 3 * out + (hash(i * 3 + 7) - 0.5) * Math.PI * 6 * flyOut;
      const ca = Math.cos(ang);
      const sa = Math.sin(ang);
      const hx = ((b.x - a.x) / 2) * shrink;
      const hy = ((b.y - a.y) / 2) * shrink;
      const rx0 = hx * ca - hy * sa;
      const ry0 = hx * sa + hy * ca;

      ctx.globalAlpha = alphaFar;
      ctx.beginPath();
      ctx.moveTo(px0 - rx0, py0 - ry0);
      ctx.lineTo(px0 + rx0, py0 + ry0);
      ctx.stroke();
    });

    // Lampo iniziale.
    const flash = 1 - clamp01(ex * 4);
    if (flash > 0) {
      const fr = 60 + 260 * out;
      ctx.globalAlpha = flash * 0.3;
      ctx.fillStyle = palette.fg;
      ctx.beginPath();
      ctx.ellipse(center.x, center.y, fr, fr * 0.45, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    // Scintille: a raggiera, poi sparse per la pagina.
    ctx.fillStyle = palette.fg;
    for (let i = 0; i < 40; i++) {
      const sparkAng = hash(i * 7 + 11) * Math.PI * 2;
      const d = out * (120 + 300 * hash(i * 7 + 12));
      const nearX = center.x + Math.cos(sparkAng) * d;
      const nearY = center.y + Math.sin(sparkAng) * d * 0.45 + ex * ex * 60;
      const farX = hash(i * 7 + 14) * vw - originX;
      const farY = hash(i * 7 + 15) * vh - originY;

      const sx0 = nearX + (farX - nearX) * flyOut;
      const sy0 = nearY + (farY - nearY) * flyOut;
      const size = (1.5 + 3.5 * hash(i * 7 + 13)) * (1 - 0.5 * ex) * (1 - 0.6 * flyOut);

      ctx.globalAlpha = alphaFar * clamp01(ex * 6);
      ctx.fillRect(sx0 - size / 2, sy0 - size / 2, size, size);
    }

    ctx.globalAlpha = 1.0;
  }

  // ── Occhi ──
  // Sulla faccia destra (b = 0). Durante il ribaltamento "viaggiano" con la faccia
  // (si accorciano e spariscono quando si gira di lato / sotto), poi nell'ultimo
  // tratto tornano scivolando sulla faccia destra con un piccolo "pop".
  const faceCenter: V3 = [0.5, 0, 0.35];
  const faceHalf: V3 = [0.18, 0, 0]; // semi-distanza tra i due occhi

  const rest = proj(faceCenter);
  const restHalf = proj(faceHalf);
  const ride = proj(rot(faceCenter, 0.5));
  const rideHalf = proj(rot(faceHalf, 0));

  const ew = clamp01((roll01 - 0.6) / 0.4);
  const w = smooth(ew);

  const mx = ride.x + (rest.x - ride.x) * w;
  const my = ride.y + (rest.y - ride.y) * w;
  const ax = rideHalf.x + (restHalf.x - rideHalf.x) * w;
  const ay = rideHalf.y + (restHalf.y - rideHalf.y) * w;

  // Visibilità: 1 a riposo, 0 con la faccia girata, overshoot al rientro.
  const vis = clamp01(facing(1, 0)) * (1 - w) + w * easeOutBack(ew);
  const vx = vis * (1 - 0.5 * flyOut);
  const vy = (0.55 + 0.45 * vis) * (1 - 0.5 * flyOut);

  // Con l'esplosione gli occhi schizzano via, si disperdono per la pagina e svaniscono.
  const eyeOut = easeOutCubic(ex);
  const eyeAlpha = 1 - smooth(clamp01((fly - 0.5) / 0.5));

  const k = 1 - e.merge;
  const cos = Math.cos(e.spin);
  const sin = Math.sin(e.spin);
  const px = (ax * cos - ay * sin) * k;
  const py = (ax * sin + ay * cos) * k;

  // Pseudo-random stabile per ~70ms, così il glitch "sfarfalla" senza impazzire.
  const seed = Math.floor(performance.now() / 70);
  const rnd = (n: number) => {
    const r = Math.sin(seed * 12.9898 + n * 78.233) * 43758.5453;
    return r - Math.floor(r);
  };

  const strokePx = Math.max(1.5, s * 0.028);

  type EyeOpts = {
    side: -1 | 1; // -1 occhio sinistro, 1 occhio destro
    sx: number;
    sy: number;
    ox: number;
    oy: number;
    lid: number;
  };

  const drawEye = (cx: number, cy: number, o: EyeOpts) => {
    const rx = s * 0.035 * e.scaleX * o.sx * vx;
    const ry = s * 0.07 * e.scaleY * o.sy * vy;

    // lid = 0: aperto; lid = 1: completamente chiuso.
    const open = Math.max(0.025, 1 - Math.min(1, e.lid + o.lid) * 0.975);
    const ryo = ry * open;

    const paint = () => {
      switch (e.shape) {
        case "heart": {
          const w = rx;
          const hh = ryo;
          ctx.beginPath();
          ctx.moveTo(0, hh * 0.95);
          ctx.bezierCurveTo(-w * 2.4, -hh * 0.1, -w * 1.5, -hh * 1.3, 0, -hh * 0.35);
          ctx.bezierCurveTo(w * 1.5, -hh * 1.3, w * 2.4, -hh * 0.1, 0, hh * 0.95);
          ctx.closePath();
          ctx.fill();
          break;
        }

        case "cross": {
          ctx.beginPath();
          ctx.moveTo(-rx * 1.1, -ryo * 0.75);
          ctx.lineTo(rx * 1.1, ryo * 0.75);
          ctx.moveTo(rx * 1.1, -ryo * 0.75);
          ctx.lineTo(-rx * 1.1, ryo * 0.75);
          ctx.stroke();
          break;
        }

        case "spiral": {
          const steps = 40;
          const turns = 2.2;
          const rr = ry * 0.95;
          ctx.beginPath();
          for (let i = 0; i <= steps; i++) {
            const t = i / steps;
            const a = t * turns * Math.PI * 2;
            const px2 = Math.cos(a) * t * rr;
            const py2 = Math.sin(a) * t * rr * open;
            if (i === 0) ctx.moveTo(px2, py2);
            else ctx.lineTo(px2, py2);
          }
          ctx.stroke();
          break;
        }

        case "happy": {
          ctx.beginPath();
          ctx.moveTo(-rx * 1.6, ryo * 0.45);
          ctx.quadraticCurveTo(0, -ryo * 1.1, rx * 1.6, ryo * 0.45);
          ctx.stroke();
          break;
        }

        case "chevron": {
          // Occhio sinistro ">" e occhio destro "<".
          const f = -o.side;
          ctx.beginPath();
          ctx.moveTo(-rx * 1.5 * f, -ryo * 0.75);
          ctx.lineTo(rx * 1.3 * f, 0);
          ctx.lineTo(-rx * 1.5 * f, ryo * 0.75);
          ctx.stroke();
          break;
        }

        case "dash": {
          ctx.beginPath();
          ctx.moveTo(-rx * 1.5, 0);
          ctx.lineTo(rx * 1.5, 0);
          ctx.stroke();
          break;
        }

        default: {
          ctx.beginPath();
          ctx.ellipse(0, 0, rx, ryo, 0, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    };

    ctx.save();

    ctx.translate(cx + e.offsetX + o.ox, cy + e.offsetY + o.oy);
    ctx.rotate(e.rotation);

    // Sguardo arrabbiato: taglio diagonale sulla parte alta, angolo interno più basso.
    if (e.angry > 0.001) {
      const yL = (xu: number) =>
        (-1.3 + e.angry * (1.2 + 0.9 * -o.side * xu)) * ry;

      ctx.beginPath();
      ctx.moveTo(-rx * 3, yL(-3));
      ctx.lineTo(rx * 3, yL(3));
      ctx.lineTo(rx * 3, ry * 3);
      ctx.lineTo(-rx * 3, ry * 3);
      ctx.closePath();
      ctx.clip();
    }

    if (e.glitch > 0.01) {
      // Occhio spezzato in 3 fasce orizzontali che scorrono o spariscono.
      const edges = [-1.8, -0.6, 0.6, 1.8];

      for (let i = 0; i < 3; i++) {
        const n = i + (o.side + 1) * 5;
        if (rnd(n) < e.glitch * 0.18) continue;

        const top = edges[i] * ry;
        const bottom = edges[i + 1] * ry;

        ctx.save();
        ctx.beginPath();
        ctx.rect(-rx * 5, top, rx * 10, bottom - top);
        ctx.clip();
        ctx.translate((rnd(n + 3) - 0.5) * 2 * e.glitch * rx * 1.6, 0);
        paint();
        ctx.restore();
      }
    } else {
      paint();
    }

    ctx.restore();
  };

  // Occhi nascosti (faccia girata): niente da disegnare.
  if (vis > 0.03 && eyeAlpha > 0.01) {
    const nearL = { x: mx - px - eyeOut * 150, y: my - py - eyeOut * 70 + ex * ex * 90 };
    const nearR = { x: mx + px + eyeOut * 150, y: my + py - eyeOut * 70 + ex * ex * 90 };
    const farL = { x: hash(901) * vw - originX, y: hash(902) * vh - originY };
    const farR = { x: hash(903) * vw - originX, y: hash(904) * vh - originY };

    // Sul cubo pieno gli occhi prendono il colore dello sfondo.
    const eyeColor = fill > 0 ? mixColors(palette.fg, palette.bg, fill) : palette.fg;
    ctx.fillStyle = eyeColor;
    ctx.strokeStyle = eyeColor;
    ctx.lineWidth = strokePx;
    ctx.globalAlpha = eyeAlpha;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    drawEye(nearL.x + (farL.x - nearL.x) * flyOut, nearL.y + (farL.y - nearL.y) * flyOut, {
      side: -1,
      sx: e.leftScaleX,
      sy: e.leftScaleY,
      ox: e.leftOffsetX,
      oy: e.leftOffsetY,
      lid: e.leftLid,
    });

    drawEye(nearR.x + (farR.x - nearR.x) * flyOut, nearR.y + (farR.y - nearR.y) * flyOut, {
      side: 1,
      sx: e.rightScaleX,
      sy: e.rightScaleY,
      ox: e.rightOffsetX,
      oy: e.rightOffsetY,
      lid: e.rightLid,
    });
  }

  ctx.restore();
}