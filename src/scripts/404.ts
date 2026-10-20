import gsap from "gsap";

/**
 * Animazioni della pagina 404.
 * - il "404" viene scalato per riempire tutto lo spazio disponibile
 * - le due cifre "4" salgono da una maschera, il cubo cade e rimbalza
 * - il cubo galleggia, sbatte le palpebre e segue il mouse con lo sguardo
 * - click sul cubo: salto con giro
 * - leggero parallax del "404" col mouse
 * Ritorna la funzione di cleanup.
 */
export function initNotFound(): (() => void) | undefined {
  const root = document.querySelector<HTMLElement>("[data-notfound]");
  const stage = root?.querySelector<HTMLElement>("[data-nf-stage]");
  const word = root?.querySelector<HTMLElement>("[data-nf-word]");
  if (!root || !stage || !word) return;

  const all = <T extends Element>(sel: string) =>
    Array.from(root.querySelectorAll<T>(sel));

  // --- Percorso richiesto (textContent: nessun rischio di injection) ---
  let path = location.pathname;
  try {
    path = decodeURIComponent(path);
  } catch {
    // percorso malformato: lo mostriamo così com'è
  }
  all<HTMLElement>("[data-nf-path]").forEach((el) => (el.textContent = path));

  // --- Fit: il 404 occupa tutto lo spazio dello stage ---
  const fit = () => {
    const w = stage.clientWidth;
    const h = stage.clientHeight;
    if (!w || !h) return;
    word.style.fontSize = "100px";
    const ww = word.offsetWidth;
    const wh = word.offsetHeight;
    if (!ww || !wh) return;
    const size = Math.floor(100 * Math.min(w / ww, h / wh) * 0.96);
    word.style.fontSize = `${size}px`;
  };
  fit();
  document.fonts?.ready.then(fit);
  const ro = new ResizeObserver(fit);
  ro.observe(stage);

  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduce) {
    root.setAttribute("data-ready", "");
    return () => {
      ro.disconnect();
      root.removeAttribute("data-ready");
    };
  }

  const digits = all<HTMLElement>("[data-nf-digit]");
  const cube = root.querySelector<HTMLElement>("[data-nf-cube]");
  const float = root.querySelector<SVGElement>("[data-nf-float]");
  const eyes = all<SVGElement>("[data-nf-eye], [data-nf-pupil]");
  const pupils = all<SVGElement>("[data-nf-pupil]");

  let hopping = false;
  let onMove: ((e: PointerEvent) => void) | undefined;
  let onHop: (() => void) | undefined;

  const ctx = gsap.context(() => {
    // Parallax del 404 e sguardo del cubo (quickTo = nessuna allocazione per frame)
    const wordX = gsap.quickTo(word, "x", { duration: 0.6, ease: "power3" });
    const wordY = gsap.quickTo(word, "y", { duration: 0.6, ease: "power3" });
    const pupilX = pupils.map((p) =>
      gsap.quickTo(p, "x", { duration: 0.25, ease: "power3" }),
    );
    const pupilY = pupils.map((p) =>
      gsap.quickTo(p, "y", { duration: 0.25, ease: "power3" }),
    );

    const blink = () =>
      ctx.add(() => {
        gsap.to(eyes, {
          attr: { ry: 0.01 },
          duration: 0.07,
          yoyo: true,
          repeat: 1,
          ease: "none",
        });
      });

    const scheduleBlink = () =>
      ctx.add(() => {
        gsap.delayedCall(gsap.utils.random(2.2, 5), () => {
          blink();
          scheduleBlink();
        });
      });

    const startIdle = () =>
      ctx.add(() => {
        if (float) {
          gsap.to(float, {
            yPercent: -5,
            duration: 1.6,
            ease: "sine.inOut",
            yoyo: true,
            repeat: -1,
          });
        }
        scheduleBlink();

        onMove = (e: PointerEvent) => {
          wordX(-(e.clientX / innerWidth - 0.5) * 28);
          wordY(-(e.clientY / innerHeight - 0.5) * 18);

          if (!float) return;
          // Gli occhi stanno sulla faccia destra: centro circa (69%, 56%).
          const r = float.getBoundingClientRect();
          const dx = e.clientX - (r.left + r.width * 0.69);
          const dy = e.clientY - (r.top + r.height * 0.56);
          const dist = Math.hypot(dx, dy) || 1;
          const f = Math.min(1, dist / 260);
          // Spostamento in px del viewBox → coordinate della faccia (u, v).
          const sx = (dx / dist) * 1.6 * f;
          const sy = (dy / dist) * 3 * f;
          const u = sx / 38;
          const v = (sy + 22 * u) / 44;
          pupilX.forEach((fn) => fn(u));
          pupilY.forEach((fn) => fn(v));
        };
        window.addEventListener("pointermove", onMove);

        if (cube) {
          onHop = () => {
            if (hopping) return;
            hopping = true;
            ctx.add(() => {
              blink();
              gsap
                .timeline({
                  onComplete: () => {
                    gsap.set(cube, { rotation: 0 });
                    hopping = false;
                  },
                })
                .to(cube, { yPercent: -40, duration: 0.28, ease: "power2.out" })
                .to(cube, { yPercent: 0, duration: 0.5, ease: "bounce.out" })
                .to(
                  cube,
                  { rotation: 360, duration: 0.78, ease: "power2.inOut" },
                  0,
                );
            });
          };
          cube.addEventListener("click", onHop);
        }
      });

    // --- Intro ---
    const tl = gsap.timeline({
      defaults: { ease: "power4.out" },
      onComplete: startIdle,
    });

    tl.fromTo(
      digits,
      { yPercent: 110, opacity: 1 },
      { yPercent: 0, opacity: 1, duration: 1, stagger: 0.12 },
    );

    if (cube) {
      tl.fromTo(
        cube,
        {
          yPercent: -170,
          rotation: -25,
          opacity: 1,
          transformOrigin: "50% 100%",
        },
        { yPercent: 0, rotation: 0, opacity: 1, duration: 1.1, ease: "bounce.out" },
        0.35,
      );
    }

    tl.fromTo(
      "[data-nf-line]",
      { scaleX: 0, opacity: 1 },
      { scaleX: 1, opacity: 1, duration: 0.9, ease: "power2.inOut" },
      "-=0.7",
    ).fromTo(
      "[data-nf-in]",
      { opacity: 0, y: 16 },
      { opacity: 1, y: 0, duration: 0.6, stagger: 0.08 },
      "-=0.5",
    );
  }, root);

  root.setAttribute("data-ready", "");

  return () => {
    if (onMove) window.removeEventListener("pointermove", onMove);
    if (onHop && cube) cube.removeEventListener("click", onHop);
    ro.disconnect();
    ctx.revert();
    word.style.fontSize = "";
    root.removeAttribute("data-ready");
  };
}