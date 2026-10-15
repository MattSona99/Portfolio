type RGB = [number, number, number];

function parse(color: string): RGB | null {
  const c = color.trim();

  let m = /^#([0-9a-f]{3})$/i.exec(c);
  if (m) {
    const h = m[1];
    return [parseInt(h[0] + h[0], 16), parseInt(h[1] + h[1], 16), parseInt(h[2] + h[2], 16)];
  }

  m = /^#([0-9a-f]{6})([0-9a-f]{2})?$/i.exec(c);
  if (m) {
    const n = parseInt(m[1], 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  }

  m = /^rgba?\(\s*([\d.]+)[,\s]+([\d.]+)[,\s]+([\d.]+)/i.exec(c);
  if (m) return [Number(m[1]), Number(m[2]), Number(m[3])];

  return null;
}

// Mix lineare tra due colori CSS (esadecimali o rgb()). Se uno dei due non è
// interpretabile (es. color-mix(), var()) fa uno scambio netto a metà.
export function mixColors(a: string, b: string, t: number): string {
  const ca = parse(a);
  const cb = parse(b);
  if (!ca || !cb) return t < 0.5 ? a : b;

  const k = Math.min(1, Math.max(0, t));
  const ch = (i: number) => Math.round(ca[i] + (cb[i] - ca[i]) * k);
  return `rgb(${ch(0)}, ${ch(1)}, ${ch(2)})`;
}