export const CONFIG = {
  tileWidth: 700,
  tileHeight: 100,
  cubeSize: 300,
  moveDuration: 180,
  hopHeight: 36,
  cameraFollow: 9, // reattività della camera (1/s): più alto = più rigida, ~100 = bloccata sul cubo
  backgroundGridAlpha: 0.2,
  gridPadding: 3,
  centerOffsetY: -24, // il cubo sta un po' sopra il centro del canvas

  // Percorso guidato verso la TILE BUCO (generato a caso a ogni caricamento della pagina).
  course: {
    length: 20, // movimenti dalla partenza al buco
    minHoleDistance: 6, // distanza minima (in tile) tra partenza e buco
    revealDistance: 3, // il buco compare quando il cubo è a questa distanza (in tile)
    litMs: 1000, // quanto dura il lampo verde di una tile attivata
    activatedAlpha: 0.1, // tenue colore che resta sulle tile attivate (0 = nessuno)
    waveStepMs: 60, // onda di luce lungo il percorso quando è completo: ritardo tra una tile e l'altra
  },
  guide: {
    dash: 12, // lunghezza del tratto (px)
    gap: 10, // spazio tra i tratti (px)
    speed: 46, // velocità con cui scorrono i tratti verso il buco (px/s)
    width: 3,
  },
  hole: {
    levels: 5, // pareti annidate che danno profondità
    inset: 0.9, // grandezza del buco rispetto alla tile
    sinkRatio: 1, // 1 = il cubo scende fino ad avere la faccia superiore a filo con il pavimento
  },

  // Livello 2: piano visto dall'alto con un quadrato 2D.
  topdown: {
    tile: 120, // lato di una tile vista dall'alto (px): una stanza 10×7 sta intera nella Hero
    playerHalf: 0.4286, // metà lato del quadrato (in tile) all'inizio: coincide con la faccia superiore del cubo sprofondato
    playerHalfEnd: 0.36, // metà lato a trasformazione finita
    pixel: 5, // "pixel" dell'effetto: le coordinate del quadrato si agganciano a multipli di questo valore (px)
    steps: 6, // fotogrammi di un movimento (stop-motion)
    moveMs: 190, // durata di un movimento
    cameraFollow: 60, // camera quasi rigida: il quadrato resta al centro e scorre la griglia
    waveMs: 1700, // durata dell'onda che parte dal quadrato
    waveThickness: 0.9, // spessore del fronte d'onda (in tile)
  },

  // Livello 2: "Riempi i buchi" (Sokoban). Stanza casuale a ogni refresh, risolvibile per costruzione.
  sokoban: {
    w: 8, // interno della stanza (tile)
    h: 5,
    blocks: 3, // blocchi = buchi
    innerWalls: 5, // muri interni
    minPushes: 12, // spinte minime della soluzione costruita
    minMoves: 24, // mosse minime della soluzione costruita
    minDistance: 12, // distanza totale minima (in tile) tra blocchi e buchi: scarta le stanze banali
    scramble: 30, // mosse inverse "di rimescolamento" minime dopo aver aperto tutti i buchi
  },

  // Passaggio dal livello 1 al livello 2 (secondi).
  transition: {
    delay: 0.5, // pausa dopo che il cubo si è colorato
    vanish: 0.9, // il percorso verde scompare
    morph: 1.8, // da isometrico 3D a 2D visto dall'alto
    ready: 0.55, // dopo la fine della trasformazione, quando il quadrato diventa controllabile
  },

  // Scroll → focus, schiacciamento ed esplosione. `progress` = scrollY / altezza Hero.
  scroll: {
    focusLoss: 0.12, // oltre questo valore la Hero perde il focus (input disabilitato)
    focusRegain: 0.1, // sotto questo valore torna il focus e il gioco riparte da capo
    minSquash: 0.6, // altezza minima del cubo schiacciato (frazione); sotto parte l'esplosione
    explodeEnd: 0.2, // frazione di altezza della fascia a cui l'esplosione è completa
    blastDistance: 0.9, // scroll (in altezze di viewport) in cui i pezzi si disperdono per la pagina
    blastMin: 120, // scroll minimo (px) per la dispersione, se la pagina finisce prima
  },
} as const;

// Dimensioni a schermo di UNA tile (rombo) della griglia.
// Le linee della griglia hanno pendenza 3 * tileHeight / tileWidth e distano
// tileWidth / 2 in orizzontale: ne risulta un rombo largo 350 e alto 150.
export const TILE = {
  w: CONFIG.tileWidth / 2,
  h: CONFIG.tileHeight * 1.5,
} as const;

// Misure del cubo condivise da cube.ts e renderer.ts.
// footY = distanza tra il vertice alto-davanti (ancora del disegno)
// e il centro della base del cubo, cioè il punto che sta al centro della tile.
export function cubeMetrics() {
  const half = CONFIG.cubeSize / 2;
  const h = half / 2.35;
  const v = half * 1.1;
  return { half, h, v, footY: v - h, fullH: 2 * h + v };
}

// y (coordinate canvas) del centro a terra della tile (0, 0) a riposo.
export function baseGroundY(canvasHeight: number) {
  return canvasHeight / 2 + CONFIG.centerOffsetY + cubeMetrics().footY;
}

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

// Metà lato del quadrato 2D (in tile) in funzione della trasformazione del piano
// (plane: 0 = isometrico 3D, 1 = visto dall'alto).
export function playerHalf(plane: number) {
  return lerp(CONFIG.topdown.playerHalf, CONFIG.topdown.playerHalfEnd, plane);
}

// y (coordinate canvas) del centro a terra del giocatore a riposo.
// Con il piano 2D si porta al centro esatto del canvas.
export function baseGroundAt(canvasHeight: number, plane: number) {
  return lerp(baseGroundY(canvasHeight), canvasHeight / 2, plane);
}

// Ingombro del "corpo" del giocatore: il cubo a piano isometrico, il quadrato a piano 2D.
//   fullH = altezza totale, below = distanza tra il centro a terra e il bordo basso.
export function bodyMetrics(plane: number) {
  const cube = cubeMetrics();
  const side = 2 * playerHalf(plane) * CONFIG.topdown.tile;
  return { fullH: lerp(cube.fullH, side, plane), below: lerp(cube.h, side / 2, plane) };
}