import { gsap } from 'gsap';
import { CONFIG } from './config';
import type { GameState, MoveDir, Point } from './types';

const ARROWS = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'];

// Quanto cambia la posizione logica (x, y) per ogni direzione visiva.
const STEP: Record<MoveDir, Point> = {
  downRight: { x: 1, y: 0 },
  downLeft: { x: 0, y: 1 },
  upLeft: { x: -1, y: 0 },
  upRight: { x: 0, y: -1 },
};

type InputHooks = {
  // Chiamato quando parte un salto: qui si annullano le animazioni idle.
  onMoveStart?: () => void;
  // Chiamato quando il cubo atterra e non c'è un altro salto in coda.
  onLand?: () => void;
  // Se restituisce false (Hero senza focus) i tasti freccia non muovono il cubo.
  isEnabled?: () => boolean;
  // Chiamato quando il cubo arriva su una nuova tile (posizione già aggiornata).
  onArrive?: (position: Point, from: Point) => void;
  // Se restituisce false la mossa è rifiutata (es. ingresso nel buco a percorso incompleto):
  // il cubo urta un muro invisibile e rimbalza indietro (vedi onBump).
  canMove?: (next: Point) => boolean;
  // Chiamato nell'istante dell'impatto contro il muro invisibile.
  onBump?: (from: Point, next: Point) => void;
};

export function bindKeyboard(
  shell: HTMLElement,
  state: GameState,
  hooks: InputHooks = {},
): () => void {
  // Tasti premuti: per istanza, non condivisi a livello di modulo.
  const keysPressed = new Set<string>();

  shell.tabIndex = 0;
  const focusShell = () => shell.focus();
  shell.addEventListener('pointerdown', focusShell);

  const readDirection = (): MoveDir | null => {
    const k = keysPressed;
    if (k.has('ArrowDown') && k.has('ArrowRight')) return 'downRight';
    if (k.has('ArrowDown') && k.has('ArrowLeft')) return 'downLeft';
    if (k.has('ArrowUp') && k.has('ArrowLeft')) return 'upLeft';
    if (k.has('ArrowUp') && k.has('ArrowRight')) return 'upRight';
    return null;
  };

  // Mossa rifiutata: il cubo parte verso la tile, urta il muro invisibile a metà strada
  // e rimbalza indietro. Non si concatena con altri salti anche se i tasti restano premuti.
  const bump = (dir: MoveDir, next: Point, from: Point) => {
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
      .to(state, { moveProgress: 0.42, duration: 0.11, ease: 'power2.in' })
      .call(() => hooks.onBump?.(from, next))
      .to(state, { moveProgress: 0, duration: 0.4, ease: 'power3.out' });
  };

  const tryMove = () => {
    if (!(hooks.isEnabled?.() ?? true)) return;

    // Già in volo: ignora finché non atterra.
    if (state.target) return;

    const dir = readDirection();
    if (!dir) return;

    const step = STEP[dir];
    const next: Point = {
      x: state.position.x + step.x,
      y: state.position.y + step.y,
    };

    const from: Point = { ...state.position };

    if (hooks.canMove && !hooks.canMove(next)) {
      bump(dir, next, from);
      return;
    }

    state.target = next;
    state.moveDir = dir;
    state.moveProgress = 0;

    hooks.onMoveStart?.();

    // Un solo tween: moveProgress guida posizione, ribaltamento e salto (vedi index.ts / cube.ts).
    gsap.to(state, {
      moveProgress: 1,
      duration: CONFIG.moveDuration / 1000,
      ease: 'power2.inOut',
      onComplete: () => {
        state.position = next;
        state.target = null;
        state.moveDir = null;
        state.moveProgress = 0;
        state.roll = 0;

        hooks.onArrive?.(next, from);

        // Tasti ancora premuti → salta di nuovo subito, altrimenti atterraggio.
        const enabled = hooks.isEnabled?.() ?? true;
        if (enabled && readDirection()) tryMove();
        else if (enabled) hooks.onLand?.();
      },
    });
  };

  const onKeyDown = (event: KeyboardEvent) => {
    if (!ARROWS.includes(event.key)) return;

    // Hero senza focus (scroll): i tasti freccia tornano al browser.
    if (!(hooks.isEnabled?.() ?? true)) {
      keysPressed.clear();
      return;
    }

    if (document.activeElement !== shell && !shell.matches(':hover')) return;
    if ((event.target as HTMLElement)?.closest('input, textarea, button, select')) return;

    event.preventDefault();
    keysPressed.add(event.key);

    tryMove();
  };

  const onKeyUp = (event: KeyboardEvent) => {
    keysPressed.delete(event.key);
  };

  // Se la finestra perde il focus il keyup non arriva mai: evita tasti "incollati".
  const onBlur = () => keysPressed.clear();

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