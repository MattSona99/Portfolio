import { gsap } from 'gsap';
import { CONFIG } from './config';
import type { GameState, MoveDir, Point } from './types';

const ARROWS = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'];

// Livello 1 (isometrico): serve una combinazione di due frecce, come le diagonali del piano.
// Quanto cambia la posizione logica (x, y) per ogni direzione visiva.
const ISO_STEP: Record<MoveDir, Point> = {
  downRight: { x: 1, y: 0 },
  downLeft: { x: 0, y: 1 },
  upLeft: { x: -1, y: 0 },
  upRight: { x: 0, y: -1 },
};

// Livello 2 (visto dall'alto): una freccia = un passo.
const TOPDOWN_STEP: Record<string, Point> = {
  ArrowUp: { x: 0, y: -1 },
  ArrowDown: { x: 0, y: 1 },
  ArrowLeft: { x: -1, y: 0 },
  ArrowRight: { x: 1, y: 0 },
};

const ACTIONS: Record<string, 'undo' | 'restart'> = { z: 'undo', Z: 'undo', r: 'restart', R: 'restart' };

type InputHooks = {
  // Modalità dei comandi: 'iso' (due frecce insieme) o 'topdown' (una freccia).
  mode?: () => 'iso' | 'topdown';
  // Chiamato quando parte un salto: qui si annullano le animazioni idle.
  onMoveStart?: () => void;
  // Chiamato quando il giocatore atterra e non c'è un altro salto in coda.
  onLand?: () => void;
  // Se restituisce false (Hero senza focus) i tasti freccia non muovono il giocatore.
  isEnabled?: () => boolean;
  // Chiamato quando il giocatore arriva su una nuova tile (posizione già aggiornata).
  onArrive?: (position: Point, from: Point) => void;
  // Se restituisce false la mossa è rifiutata (livello 1: ingresso nel buco a percorso incompleto;
  // livello 2: muro, buco aperto, blocco bloccato): il giocatore urta e rimbalza (vedi onBump).
  canMove?: (next: Point) => boolean;
  // Chiamato nell'istante dell'impatto contro il muro invisibile.
  onBump?: (from: Point, next: Point) => void;
  // Solo modalità 'topdown': Z annulla l'ultima mossa, R ricomincia la stanza.
  onAction?: (action: 'undo' | 'restart') => void;
};

export function bindKeyboard(
  shell: HTMLElement,
  state: GameState,
  hooks: InputHooks = {},
): () => void {
  // Tasti premuti: per istanza, non condivisi a livello di modulo.
  const keysPressed = new Set<string>();
  // Ordine di pressione: in modalità 'topdown' l'ultimo tasto premuto ha la precedenza.
  const order: string[] = [];

  shell.tabIndex = 0;
  const focusShell = () => shell.focus();
  shell.addEventListener('pointerdown', focusShell);

  const isTopdown = () => (hooks.mode?.() ?? 'iso') === 'topdown';

  const readMove = (): { dir: MoveDir | null; step: Point } | null => {
    if (isTopdown()) {
      for (let i = order.length - 1; i >= 0; i--) {
        const step = TOPDOWN_STEP[order[i]];
        if (step) return { dir: null, step };
      }
      return null;
    }

    const k = keysPressed;
    let dir: MoveDir | null = null;
    if (k.has('ArrowDown') && k.has('ArrowRight')) dir = 'downRight';
    else if (k.has('ArrowDown') && k.has('ArrowLeft')) dir = 'downLeft';
    else if (k.has('ArrowUp') && k.has('ArrowLeft')) dir = 'upLeft';
    else if (k.has('ArrowUp') && k.has('ArrowRight')) dir = 'upRight';

    return dir ? { dir, step: ISO_STEP[dir] } : null;
  };

  // Mossa rifiutata: il cubo parte verso la tile, urta il muro invisibile a metà strada
  // e rimbalza indietro. Non si concatena con altri salti anche se i tasti restano premuti.
  const bump = (dir: MoveDir | null, next: Point, from: Point) => {
    state.target = next;
    state.moveDir = dir;
    state.moveProgress = 0;
    state.bumping = true;

    hooks.onMoveStart?.();

    gsap
      .timeline({
        onComplete: () => {
          state.target = null;
          state.moveDir = null;
          state.moveProgress = 0;
          state.roll = 0;
          state.bumping = false;
        },
      })
      .to(state, { moveProgress: isTopdown() ? 0.25 : 0.42, duration: 0.11, ease: 'power2.in' })
      .call(() => hooks.onBump?.(from, next))
      .to(state, { moveProgress: 0, duration: 0.4, ease: 'power3.out' });
  };

  const tryMove = () => {
    if (!(hooks.isEnabled?.() ?? true)) return;

    // Già in volo: ignora finché non atterra.
    if (state.target) return;

    const move = readMove();
    if (!move) return;

    const topdown = isTopdown();
    const next: Point = {
      x: state.position.x + move.step.x,
      y: state.position.y + move.step.y,
    };

    const from: Point = { ...state.position };

    if (hooks.canMove && !hooks.canMove(next)) {
      bump(move.dir, next, from);
      return;
    }

    state.target = next;
    state.moveDir = move.dir;
    state.moveProgress = 0;

    hooks.onMoveStart?.();

    // Un solo tween: moveProgress guida posizione, ribaltamento e salto (livello 1)
    // oppure i fotogrammi dello scatto (livello 2, ease lineare: a scatti ci pensa il disegno).
    gsap.to(state, {
      moveProgress: 1,
      duration: (topdown ? CONFIG.topdown.moveMs : CONFIG.moveDuration) / 1000,
      ease: topdown ? 'none' : 'power2.inOut',
      onComplete: () => {
        state.position = next;
        state.target = null;
        state.moveDir = null;
        state.moveProgress = 0;
        state.roll = 0;

        hooks.onArrive?.(next, from);

        // Tasti ancora premuti → muoviti di nuovo subito, altrimenti atterraggio.
        const enabled = hooks.isEnabled?.() ?? true;
        if (enabled && readMove()) tryMove();
        else if (enabled) hooks.onLand?.();
      },
    });
  };

  const onKeyDown = (event: KeyboardEvent) => {
    // Livello 2: Z annulla, R ricomincia.
    const action = ACTIONS[event.key];
    if (action && hooks.onAction && isTopdown() && !event.ctrlKey && !event.metaKey && !event.altKey) {
      if (!(hooks.isEnabled?.() ?? true)) return;
      if (document.activeElement !== shell && !shell.matches(':hover')) return;
      if ((event.target as HTMLElement)?.closest('input, textarea, button, select')) return;

      event.preventDefault();
      if (!event.repeat) hooks.onAction(action);
      return;
    }

    if (!ARROWS.includes(event.key)) return;

    // Hero senza focus (scroll): i tasti freccia tornano al browser.
    if (!(hooks.isEnabled?.() ?? true)) {
      keysPressed.clear();
      order.length = 0;
      return;
    }

    if (document.activeElement !== shell && !shell.matches(':hover')) return;
    if ((event.target as HTMLElement)?.closest('input, textarea, button, select')) return;

    event.preventDefault();

    keysPressed.add(event.key);
    if (!order.includes(event.key)) order.push(event.key);

    tryMove();
  };

  const onKeyUp = (event: KeyboardEvent) => {
    keysPressed.delete(event.key);
    const i = order.indexOf(event.key);
    if (i >= 0) order.splice(i, 1);
  };

  // Se la finestra perde il focus il keyup non arriva mai: evita tasti "incollati".
  const onBlur = () => {
    keysPressed.clear();
    order.length = 0;
  };

  window.addEventListener('keydown', onKeyDown);
  window.addEventListener('keyup', onKeyUp);
  window.addEventListener('blur', onBlur);

  return () => {
    window.removeEventListener('keydown', onKeyDown);
    window.removeEventListener('keyup', onKeyUp);
    window.removeEventListener('blur', onBlur);
    shell.removeEventListener('pointerdown', focusShell);
    gsap.killTweensOf(state);
  };
}