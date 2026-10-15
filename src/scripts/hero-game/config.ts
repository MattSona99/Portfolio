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