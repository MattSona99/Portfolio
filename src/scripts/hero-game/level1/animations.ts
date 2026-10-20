import { gsap } from 'gsap';
import type { GameState } from '../core/types';

export type EyeShape =
  | 'round'
  | 'heart'
  | 'cross'
  | 'spiral'
  | 'happy'
  | 'chevron'
  | 'dash';

export interface EyeState {
  // ── Occhi (offset in px, scale come moltiplicatori) ──
  scaleX: number;
  scaleY: number;
  offsetX: number;
  offsetY: number;
  rotation: number; // radianti, ogni occhio ruota su se stesso
  lid: number; // 0 aperto → 1 chiuso (entrambi)
  angry: number; // 0 → 1, taglia la parte alta degli occhi

  // Controlli per singolo occhio
  leftScaleX: number;
  leftScaleY: number;
  rightScaleX: number;
  rightScaleY: number;
  leftOffsetX: number;
  leftOffsetY: number;
  rightOffsetX: number;
  rightOffsetY: number;
  leftLid: number;
  rightLid: number;

  // ── Geometria della coppia ──
  merge: number; // 0 normale, 1 occhi fusi in uno, <0 occhi più distanti
  spin: number; // radianti: gli occhi orbitano attorno al loro centro
  glitch: number; // 0 → 1, occhi "a fette" che scorrono
  shape: EyeShape;

  // ── Corpo del cubo (spostamenti in frazioni di cubeSize) ──
  bodyX: number;
  bodyY: number; // negativo = verso l'alto
  bodyRotation: number;
  bodyScaleX: number;
  bodyScaleY: number; // squash & stretch ancorato alla base
}

const NEUTRAL_NUMBERS = {
  scaleX: 1,
  scaleY: 1,
  offsetX: 0,
  offsetY: 0,
  rotation: 0,
  lid: 0,
  angry: 0,

  leftScaleX: 1,
  leftScaleY: 1,
  rightScaleX: 1,
  rightScaleY: 1,
  leftOffsetX: 0,
  leftOffsetY: 0,
  rightOffsetX: 0,
  rightOffsetY: 0,
  leftLid: 0,
  rightLid: 0,

  merge: 0,
  spin: 0,
  glitch: 0,

  bodyX: 0,
  bodyY: 0,
  bodyRotation: 0,
  bodyScaleX: 1,
  bodyScaleY: 1,
};

export function getRenderPosition(state: GameState) {
  if (!state.target) return state.position;
  const t = Math.min(state.moveProgress, 1);
  return {
    x: state.position.x + (state.target.x - state.position.x) * t,
    y: state.position.y + (state.target.y - state.position.y) * t,
  };
}

export function createEyeState(): EyeState {
  return { ...NEUTRAL_NUMBERS, shape: 'round' };
}

export type ExpressionName =
  | 'blink'
  | 'doubleBlink'
  | 'angry'
  | 'curious'
  | 'stunned'
  | 'sleepy'
  | 'wink'
  | 'asymmetric'
  | 'crossEyed'
  | 'eyeRoll'
  | 'love'
  | 'dizzy'
  | 'knockout'
  | 'glitch'
  | 'chameleon'
  | 'happyJump'
  | 'ouch'
  | 'cyclops'
  | 'propeller'
  | 'suspicious';

type Tl = gsap.core.Timeline;

type Expression = {
  name: ExpressionName;
  weight: number;
  play: () => Tl;
};

const rand = (min: number, max: number) => min + Math.random() * (max - min);

export function createEyeAnimator(eyes: EyeState) {
  let timer: ReturnType<typeof setTimeout> | undefined;
  let activeTimeline: Tl | undefined;
  let enabled = false;
  let lastName: ExpressionName | undefined;

  const reset = () => {
    gsap.killTweensOf(eyes);
    Object.assign(eyes, NEUTRAL_NUMBERS, { shape: 'round' as EyeShape });
  };

  const blink = () =>
    gsap
      .timeline()
      .to(eyes, { lid: 1, duration: 0.09, ease: 'power2.in' })
      .to(eyes, { lid: 0, duration: 0.16, ease: 'power2.out' });

  // Riporta TUTTO alla posizione neutra (tranne la forma).
  const settle = (t: Tl, duration = 0.6, ease = 'elastic.out(1, 0.6)') =>
    t.to(eyes, { ...NEUTRAL_NUMBERS, duration, ease });

  // Cambia forma degli occhi nascondendo il cambio dietro a un "blink".
  const morph = (t: Tl, shape: EyeShape) =>
    t
      .to(eyes, { lid: 1, duration: 0.07, ease: 'power2.in' })
      .call(() => {
        eyes.shape = shape;
      })
      .to(eyes, { lid: 0, duration: 0.14, ease: 'power2.out' });

  const expressions: Expression[] = [
    // ───────────── Base ─────────────
    { name: 'blink', weight: 6, play: () => blink() },

    {
      name: 'doubleBlink',
      weight: 2.5,
      play: () =>
        gsap
          .timeline()
          .to(eyes, { lid: 1, duration: 0.08, ease: 'power2.in' })
          .to(eyes, { lid: 0, duration: 0.1, ease: 'power2.out' })
          .to(eyes, { lid: 1, duration: 0.08, ease: 'power2.in' })
          .to(eyes, { lid: 0, duration: 0.18, ease: 'power2.out' }),
    },

    // ───────────── Emozioni ─────────────
    {
      name: 'angry',
      weight: 1.5,
      play: () => {
        const t = gsap.timeline();
        t.to(eyes, {
          angry: 1,
          scaleX: 1.25,
          scaleY: 0.8,
          offsetY: 1,
          bodyScaleX: 1.06,
          bodyScaleY: 0.93,
          duration: 0.35,
          ease: 'power3.out',
        })
          // Il cubo "ribolle" dalla rabbia.
          .to(eyes, {
            bodyX: 0.015,
            duration: 0.04,
            repeat: 13,
            yoyo: true,
            ease: 'none',
          });
        return settle(t, 0.7);
      },
    },

    {
      name: 'curious',
      weight: 2,
      play: () => {
        const t = gsap.timeline();
        t.to(eyes, {
          scaleX: 1.6,
          scaleY: 1.8,
          offsetY: -4,
          bodyRotation: -0.12,
          duration: 0.4,
          ease: 'back.out(1.7)',
        })
          .to(eyes, { offsetX: 5, duration: 0.35, ease: 'sine.inOut' })
          .to(eyes, {
            offsetX: -5,
            bodyRotation: 0.12,
            duration: 0.5,
            ease: 'sine.inOut',
          })
          .to(eyes, { offsetX: 0, duration: 0.25, ease: 'sine.inOut' });
        return settle(t, 0.7);
      },
    },

    {
      name: 'stunned',
      weight: 1.2,
      play: () => {
        const t = gsap.timeline();
        t.to(eyes, {
          scaleX: 1.9,
          scaleY: 2.0,
          bodyY: -0.16,
          bodyScaleX: 0.92,
          bodyScaleY: 1.12,
          duration: 0.16,
          ease: 'power4.out',
        })
          .to(eyes, {
            bodyY: 0,
            bodyScaleX: 1.1,
            bodyScaleY: 0.88,
            duration: 0.22,
            ease: 'power2.in',
          })
          .to(eyes, {
            bodyScaleX: 1,
            bodyScaleY: 1,
            duration: 0.3,
            ease: 'elastic.out(1, 0.4)',
          })
          // Tremolio da shock.
          .to(eyes, {
            offsetX: -3,
            offsetY: -2,
            duration: 0.05,
            repeat: 9,
            yoyo: true,
            ease: 'none',
          });
        return settle(t, 0.8);
      },
    },

    {
      name: 'sleepy',
      weight: 1,
      play: () => {
        const t = gsap.timeline();
        t.to(eyes, {
          scaleY: 0.7,
          lid: 0.5,
          bodyRotation: 0.05,
          duration: 0.8,
          ease: 'sine.inOut',
        })
          .to(eyes, {
            lid: 0.88,
            bodyRotation: 0.15,
            bodyY: 0.03,
            duration: 0.8,
            ease: 'sine.in',
          })
          // Si risveglia di soprassalto!
          .to(eyes, {
            lid: 0,
            scaleX: 1.4,
            scaleY: 1.5,
            bodyRotation: -0.06,
            bodyY: -0.06,
            duration: 0.12,
            ease: 'power4.out',
          });
        return settle(t, 0.6);
      },
    },

    {
      name: 'suspicious',
      weight: 1.3,
      play: () => {
        const t = gsap.timeline();
        t.to(eyes, {
          lid: 0.45,
          angry: 0.35,
          scaleX: 1.25,
          offsetX: -4,
          bodyRotation: 0.04,
          duration: 0.25,
          ease: 'power3.out',
        })
          .to(eyes, { offsetX: 5, duration: 0.12, ease: 'power4.inOut' })
          .to(eyes, { offsetX: 5, duration: 0.45 })
          .to(eyes, { offsetX: -5, duration: 0.1, ease: 'power4.inOut' })
          .to(eyes, { offsetX: -5, duration: 0.3 });
        return settle(t, 0.4, 'power2.inOut');
      },
    },

    // ───────────── Asimmetrie ─────────────
    {
      name: 'wink',
      weight: 1.2,
      play: () => {
        const key = Math.random() < 0.5 ? 'leftLid' : 'rightLid';
        const dir = key === 'leftLid' ? -1 : 1;
        const t = gsap.timeline();
        t.to(eyes, {
          [key]: 1,
          bodyRotation: 0.09 * dir,
          scaleX: 1.1,
          scaleY: 1.1,
          duration: 0.12,
          ease: 'power2.in',
        }).to(eyes, {
          bodyY: -0.04,
          duration: 0.2,
          repeat: 1,
          yoyo: true,
          ease: 'sine.inOut',
        });
        return settle(t, 0.45, 'back.out(2.2)');
      },
    },

    {
      name: 'asymmetric',
      weight: 1,
      play: () => {
        const t = gsap.timeline();
        t.to(eyes, {
          leftScaleX: 1.5,
          leftScaleY: 1.4,
          rightScaleX: 0.72,
          rightScaleY: 0.78,
          rotation: 0.08,
          bodyRotation: -0.08,
          duration: 0.55,
          ease: 'power2.out',
        }).to(eyes, { duration: 0.5 });
        return settle(t, 0.7);
      },
    },

    {
      name: 'chameleon',
      weight: 1.2,
      play: () => {
        // Ogni occhio guarda per conto suo, come un camaleonte.
        const t = gsap.timeline();
        t.to(eyes, {
          leftOffsetX: -4,
          leftOffsetY: -3,
          rightOffsetX: 4,
          rightOffsetY: 3,
          leftScaleX: 1.4,
          leftScaleY: 1.4,
          rightScaleX: 0.8,
          rightScaleY: 0.8,
          duration: 0.35,
          ease: 'power3.out',
        })
          .to(eyes, {
            leftOffsetX: 3,
            leftOffsetY: 2,
            rightOffsetX: -3,
            rightOffsetY: -4,
            leftScaleX: 0.8,
            leftScaleY: 0.8,
            rightScaleX: 1.4,
            rightScaleY: 1.4,
            duration: 0.4,
            ease: 'sine.inOut',
          })
          .to(eyes, {
            leftOffsetX: -2,
            leftOffsetY: 3,
            rightOffsetX: 5,
            rightOffsetY: -2,
            duration: 0.3,
            ease: 'sine.inOut',
          });
        return settle(t, 0.5);
      },
    },

    {
      name: 'crossEyed',
      weight: 1.3,
      play: () => {
        const t = gsap.timeline();
        t.to(eyes, { merge: 0.45, duration: 0.35, ease: 'power2.out' }).to(
          eyes,
          {
            offsetX: 3,
            bodyRotation: 0.05,
            duration: 0.3,
            repeat: 3,
            yoyo: true,
            ease: 'sine.inOut',
          },
        );
        return settle(t, 0.7);
      },
    },

    // ───────────── Movimenti folli ─────────────
    {
      name: 'eyeRoll',
      weight: 1.5,
      play: () => {
        const p = { t: 0 };
        const t = gsap.timeline();
        t.to(eyes, { lid: 0.35, duration: 0.2, ease: 'sine.out' })
          .to(p, {
            t: 1,
            duration: 1.5,
            ease: 'none',
            onUpdate: () => {
              // r sale e scende dolcemente: si parte e si finisce da 0.
              const r = Math.min(1, p.t * 6, (1 - p.t) * 6);
              const a = p.t * Math.PI * 4 - Math.PI / 2;
              eyes.offsetX = Math.cos(a) * r * 5;
              eyes.offsetY = Math.sin(a) * r * 4;
              eyes.bodyRotation = Math.sin(p.t * Math.PI * 4) * 0.05 * r;
            },
          })
          .to(eyes, { lid: 0, duration: 0.25, ease: 'sine.in' });
        return t;
      },
    },

    {
      name: 'cyclops',
      weight: 1,
      play: () => {
        // Gli occhi si fondono in uno solo.
        const t = gsap.timeline();
        t.to(eyes, {
          merge: 1,
          scaleX: 1.5,
          scaleY: 1.6,
          duration: 0.45,
          ease: 'power3.inOut',
        })
          .to(eyes, {
            offsetX: 5,
            duration: 0.45,
            repeat: 3,
            yoyo: true,
            ease: 'sine.inOut',
          })
          .to(eyes, { lid: 1, duration: 0.09, ease: 'power2.in' })
          .to(eyes, { lid: 0, duration: 0.15, ease: 'power2.out' });
        // L'elastico sfora: gli occhi si separano un po' troppo, poi si assestano.
        return settle(t, 0.9, 'elastic.out(1, 0.5)');
      },
    },

    {
      name: 'propeller',
      weight: 1,
      play: () => {
        // Gli occhi orbitano come un'elica, allargandosi e restringendosi.
        const t = gsap.timeline();
        t.to(eyes, {
          spin: Math.PI * 4,
          merge: -0.6,
          scaleX: 1.2,
          scaleY: 1.2,
          bodyRotation: -0.06,
          duration: 0.9,
          ease: 'power2.in',
        })
          .to(eyes, {
            spin: Math.PI * 6,
            merge: 0,
            bodyRotation: 0,
            duration: 0.9,
            ease: 'power2.out',
          })
          .set(eyes, { spin: 0 }); // 6π = 3 giri esatti, nessun salto visibile
        return settle(t, 0.5);
      },
    },

    {
      name: 'glitch',
      weight: 1.2,
      play: () => {
        const shapes: EyeShape[] = ['round', 'dash', 'cross', 'round', 'chevron'];
        const t = gsap.timeline();
        t.to(eyes, { glitch: 1, duration: 0.06 });

        for (let i = 0; i < 10; i++) {
          t.to(eyes, {
            offsetX: rand(-6, 6),
            offsetY: rand(-4, 4),
            leftScaleX: rand(0.4, 2.2),
            leftScaleY: rand(0.2, 2),
            rightScaleX: rand(0.4, 2.2),
            rightScaleY: rand(0.2, 2),
            bodyX: rand(-0.025, 0.025),
            bodyScaleX: rand(0.92, 1.1),
            duration: rand(0.04, 0.1),
            ease: 'steps(1)',
          });

          if (Math.random() < 0.35) {
            t.call(() => {
              eyes.shape = shapes[Math.floor(Math.random() * shapes.length)];
            });
          }
        }

        t.call(() => {
          eyes.shape = 'round';
        });
        return settle(t, 0.12, 'power4.out');
      },
    },

    // ───────────── Forme speciali ─────────────
    {
      name: 'love',
      weight: 1.2,
      play: () => {
        const t = gsap.timeline();
        morph(t, 'heart');
        t.to(eyes, {
          scaleX: 1.3,
          scaleY: 1.3,
          duration: 0.3,
          ease: 'back.out(2)',
        })
          // Battito del cuore + cubo che saltella a tempo.
          .to(eyes, {
            scaleX: 1.75,
            scaleY: 1.75,
            duration: 0.12,
            repeat: 7,
            yoyo: true,
            ease: 'power2.out',
          })
          .to(
            eyes,
            {
              bodyY: -0.05,
              duration: 0.12,
              repeat: 7,
              yoyo: true,
              ease: 'sine.out',
            },
            '<',
          );
        settle(t, 0.3, 'power2.out');
        return morph(t, 'round');
      },
    },

    {
      name: 'dizzy',
      weight: 1,
      play: () => {
        const t = gsap.timeline();
        morph(t, 'spiral');
        t.to(eyes, {
          rotation: -Math.PI * 6,
          duration: 1.8,
          ease: 'sine.inOut',
        })
          .to(
            eyes,
            {
              bodyRotation: 0.12,
              duration: 0.3,
              repeat: 5,
              yoyo: true,
              ease: 'sine.inOut',
            },
            '<',
          )
          .set(eyes, { rotation: 0 }); // 3 giri esatti, nessun salto visibile
        settle(t, 0.25, 'power2.out');
        return morph(t, 'round');
      },
    },

    {
      name: 'knockout',
      weight: 0.8,
      play: () => {
        const t = gsap.timeline();
        t.call(() => {
          eyes.shape = 'cross';
        })
          .to(eyes, {
            bodyRotation: 0.4,
            bodyY: 0.05,
            bodyScaleX: 1.12,
            bodyScaleY: 0.88,
            duration: 0.14,
            ease: 'power4.out',
          })
          .to(eyes, {
            bodyRotation: 0.34,
            duration: 0.08,
            repeat: 3,
            yoyo: true,
          })
          .to(eyes, { bodyRotation: 0.4, duration: 0.6 })
          // Resuscita con un balzo.
          .call(() => {
            eyes.shape = 'round';
          })
          .to(eyes, {
            bodyRotation: 0,
            bodyY: -0.12,
            bodyScaleX: 0.9,
            bodyScaleY: 1.15,
            scaleX: 1.8,
            scaleY: 1.8,
            duration: 0.22,
            ease: 'power3.out',
          });
        return settle(t, 0.7, 'bounce.out');
      },
    },

    {
      name: 'happyJump',
      weight: 1.3,
      play: () => {
        const t = gsap.timeline();
        morph(t, 'happy');

        for (let i = 0; i < 2; i++) {
          const flip = i === 1; // il secondo salto è una capriola
          t.to(eyes, {
            bodyScaleX: 1.14,
            bodyScaleY: 0.84,
            duration: 0.14,
            ease: 'power2.out',
          })
            .addLabel(`up${i}`)
            .to(
              eyes,
              {
                bodyY: -0.22,
                bodyScaleX: 0.9,
                bodyScaleY: 1.18,
                duration: 0.3,
                ease: 'power2.out',
              },
              `up${i}`,
            );

          if (flip) {
            t.to(
              eyes,
              {
                bodyRotation: Math.PI * 2,
                duration: 0.55,
                ease: 'power1.inOut',
              },
              `up${i}`,
            );
          }

          t.to(
            eyes,
            {
              bodyY: 0,
              bodyScaleX: 1.12,
              bodyScaleY: 0.86,
              duration: 0.25,
              ease: 'power2.in',
            },
            `up${i}+=0.3`,
          ).to(eyes, {
            bodyScaleX: 1,
            bodyScaleY: 1,
            duration: 0.35,
            ease: 'elastic.out(1, 0.4)',
          });
        }

        t.set(eyes, { bodyRotation: 0 }); // 2π = giro completo
        return morph(t, 'round');
      },
    },

    {
      name: 'ouch',
      weight: 1,
      play: () => {
        const t = gsap.timeline();
        morph(t, 'chevron');
        t.to(eyes, {
          bodyScaleX: 1.14,
          bodyScaleY: 0.86,
          scaleX: 1.15,
          duration: 0.1,
          ease: 'power3.out',
        }).to(eyes, {
          bodyX: 0.02,
          duration: 0.04,
          repeat: 9,
          yoyo: true,
          ease: 'none',
        });
        settle(t, 0.5);
        return morph(t, 'round');
      },
    },
  ];

  function chooseExpression(): Expression {
    // Mai la stessa espressione due volte di fila.
    const pool = expressions.filter((x) => x.name !== lastName);
    const total = pool.reduce((sum, x) => sum + x.weight, 0);

    let value = Math.random() * total;

    for (const expression of pool) {
      value -= expression.weight;
      if (value <= 0) return expression;
    }

    return pool[0];
  }

  function run(expression: Expression) {
    if (timer) {
      clearTimeout(timer);
      timer = undefined;
    }

    if (activeTimeline) {
      activeTimeline.kill();
      reset();
    }

    lastName = expression.name;

    const timeline = expression.play();
    activeTimeline = timeline;

    timeline.eventCallback('onComplete', () => {
      if (activeTimeline !== timeline) return;

      activeTimeline = undefined;
      reset(); // azzera eventuali errori di arrotondamento
      // ~20% delle volte concatena subito un'altra espressione (combo).
      scheduleNext(Math.random() < 0.2);
    });
  }

  function scheduleNext(chain = false, delayOverride?: number) {
    if (!enabled) return;

    // Pause molto più brevi di prima (era 3–7 secondi).
    const delay =
      delayOverride ??
      (chain ? 1000 + Math.random() * 500 : 2000 + Math.random() * 3000);

    timer = setTimeout(() => {
      timer = undefined;
      if (!enabled) return;

      run(chooseExpression());
    }, delay);
  }

  // Forza un'espressione (utile per click, tasti, eventi di gioco...).
  function play(name?: ExpressionName) {
    const expression = name
      ? expressions.find((x) => x.name === name)
      : chooseExpression();

    if (expression) run(expression);
  }

  function start() {
    if (enabled) return;

    enabled = true;
    scheduleNext();
  }

  function stop() {
    enabled = false;

    if (timer) clearTimeout(timer);
    timer = undefined;

    activeTimeline?.kill();
    activeTimeline = undefined;

    reset();
  }

  // Il giocatore muove il cubo: annulla l'espressione in corso, riporta tutto
  // al neutro con un breve easing e riprogramma l'idle dopo `resumeAfterMs`.
  function interrupt(resumeAfterMs = 2200) {
    if (timer) {
      clearTimeout(timer);
      timer = undefined;
    }

    if (activeTimeline) {
      activeTimeline.kill();
      activeTimeline = undefined;
    }

    gsap.killTweensOf(eyes);
    eyes.shape = 'round';
    gsap.to(eyes, {
      ...NEUTRAL_NUMBERS,
      duration: 0.15,
      ease: 'power2.out',
    });

    if (enabled) scheduleNext(false, resumeAfterMs);
  }

  // Piccolo squash all'atterraggio, ancorato alla base del cubo.
  function land() {
    gsap.fromTo(
      eyes,
      { bodyScaleX: 1.12, bodyScaleY: 0.88 },
      {
        bodyScaleX: 1,
        bodyScaleY: 1,
        duration: 0.4,
        ease: 'elastic.out(1, 0.45)',
        overwrite: 'auto',
      },
    );
  }

  return { start, stop, blink, play, interrupt, land, eyes };
}