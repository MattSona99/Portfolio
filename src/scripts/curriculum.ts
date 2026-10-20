/**
 * Animazioni scrubbed del Curriculum.
 *
 * Tutto è legato alla posizione di scroll (non a timer): scendendo il testo
 * appare, risalendo si "smonta" al contrario. Lenis aggiorna lo scroll nativo,
 * quindi basta ascoltare l'evento `scroll` + rAF, senza dipendere dall'istanza.
 *
 * Attributi usati nel markup:
 *   data-split         titoli: parole che salgono da una maschera (scrub)
 *   data-split + data-intro   come sopra ma a tempo, solo all'apertura (hero)
 *   data-fade          paragrafo: le parole si accendono una a una (scrub)
 *   data-reveal        blocchi: fade + leggero slide (scrub)
 *   data-line          divisori: scaleX da sinistra (scrub)
 *   data-hero-content  contenitore hero: sfuma e sale mentre si scende
 */

const clamp = (v: number, min = 0, max = 1) => Math.min(max, Math.max(min, v));
const easeOut = (t: number) => 1 - Math.pow(1 - t, 3);
const easeInOut = (t: number) =>
  t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

type Kind = "split" | "fade" | "reveal" | "line";

interface Item {
  el: HTMLElement;
  kind: Kind;
  intro: boolean;
  words: HTMLElement[];
  /** traslazione verticale corrente (px), per misurare la posizione "a riposo" */
  dy: number;
}

/** Divide il testo in parole. Mantiene il testo accessibile via aria-label. */
function splitWords(el: HTMLElement, masked: boolean): HTMLElement[] {
  if (el.dataset.splitDone) {
    return Array.from(el.querySelectorAll<HTMLElement>("[data-w]"));
  }

  const text = (el.textContent ?? "").trim();
  el.setAttribute("aria-label", text);
  el.textContent = "";

  const words = text.split(/\s+/).map((word, i, all) => {
    const outer = document.createElement("span");
    outer.setAttribute("aria-hidden", "true");
    outer.style.display = "inline-block";

    let target: HTMLElement = outer;
    if (masked) {
      // maschera: la parola sale da sotto una linea invisibile
      outer.style.overflow = "hidden";
      outer.style.verticalAlign = "bottom";
      outer.style.paddingBottom = "0.12em";
      outer.style.marginBottom = "-0.12em";
      const inner = document.createElement("span");
      inner.dataset.w = "";
      inner.style.display = "inline-block";
      inner.style.willChange = "transform";
      inner.textContent = word;
      outer.appendChild(inner);
      target = inner;
    } else {
      outer.dataset.w = "";
      outer.style.willChange = "opacity";
      outer.textContent = word;
    }

    el.appendChild(outer);
    if (i < all.length - 1) el.appendChild(document.createTextNode(" "));
    return target;
  });

  el.dataset.splitDone = "true";
  return words;
}

export function initCurriculum(): () => void {
  const root = document.querySelector<HTMLElement>("[data-curriculum]");
  if (!root) return () => {};

  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const items: Item[] = [];
  const add = (selector: string, kind: Kind) => {
    root.querySelectorAll<HTMLElement>(selector).forEach((el) => {
      const masked = kind === "split";
      const words =
        kind === "split" || kind === "fade" ? splitWords(el, masked) : [];
      items.push({
        el,
        kind,
        intro: el.hasAttribute("data-intro"),
        words,
        dy: 0,
      });
    });
  };
  add("[data-split]", "split");
  add("[data-fade]", "fade");
  add("[data-reveal]", "reveal");
  add("[data-line]", "line");

  const heroContent = root.querySelector<HTMLElement>("[data-hero-content]");

  // ---- intro a tempo (solo hero) -----------------------------------------
  // parte quando il loader del sito non copre più la pagina (max 6s di attesa)
  let intro = reduce ? 1 : 0;
  let introStart = 0;
  const t0 = performance.now();
  const INTRO_DELAY = 150;
  const INTRO_MS = 1400;

  const loaderActive = () => {
    const l = document.getElementById("site-loader");
    if (!l) return false;
    const cs = getComputedStyle(l);
    if (
      cs.display === "none" ||
      cs.visibility === "hidden" ||
      parseFloat(cs.opacity) < 0.05
    )
      return false;
    const r = l.getBoundingClientRect();
    return (
      r.width > 0 &&
      r.height > 0 &&
      r.bottom > 0 &&
      r.top < window.innerHeight &&
      r.right > 0 &&
      r.left < window.innerWidth
    );
  };

  // ---- loop --------------------------------------------------------------
  let raf = 0;
  const schedule = () => {
    if (!raf) raf = requestAnimationFrame(update);
  };

  function update(now = performance.now()) {
    raf = 0;
    const vh = window.innerHeight;

    if (!reduce && intro < 1) {
      if (!introStart && !(loaderActive() && now - t0 < 6000)) {
        introStart = now;
      }
      intro = introStart
        ? clamp((now - introStart - INTRO_DELAY) / INTRO_MS)
        : 0;
    }

    for (const it of items) {
      const { el, kind } = it;
      // elementi nascosti (lingua non attiva) non hanno box: salta
      if (!el.getClientRects().length) continue;

      let p: number;
      if (reduce) {
        p = 1;
      } else if (it.intro) {
        p = intro;
      } else {
        const rect = el.getBoundingClientRect();
        const top = rect.top - it.dy; // posizione senza la nostra traslazione
        let start = vh * 0.92;
        let end = vh * 0.6;
        if (kind === "fade") {
          start = vh * 0.85;
          end = vh * 0.35;
        }
        if (kind === "line") {
          start = vh * 0.98;
          end = vh * 0.8;
        }
        p = clamp((start - top) / (start - end));
      }

      switch (kind) {
        case "split": {
          const n = it.words.length;
          const stagger = 0.12;
          const span = 1 + stagger * (n - 1);
          it.words.forEach((w, i) => {
            const wp = easeOut(clamp(p * span - i * stagger));
            w.style.transform = `translateY(${(1 - wp) * 110}%)`;
          });
          break;
        }
        case "fade": {
          const n = it.words.length;
          const span = n; // ogni parola occupa 1/n del progresso
          it.words.forEach((w, i) => {
            const wp = clamp(p * span - i);
            w.style.opacity = String(0.14 + 0.86 * easeInOut(wp));
          });
          break;
        }
        case "reveal": {
          const e = easeOut(p);
          it.dy = (1 - e) * 28;
          el.style.opacity = String(e);
          el.style.transform = it.dy ? `translateY(${it.dy}px)` : "";
          break;
        }
        case "line": {
          el.style.transform = `scaleX(${easeInOut(p)})`;
          break;
        }
      }
    }

    // hero: sfuma e sale scendendo, ritorna risalendo
    if (heroContent && !reduce) {
      const hp = clamp(window.scrollY / (vh * 0.7));
      heroContent.style.opacity = String(1 - easeInOut(hp));
      heroContent.style.transform = `translateY(${hp * -48}px)`;
    }

    if (!reduce && intro < 1) schedule();
  }

  const onScroll = () => schedule();
  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", onScroll);

  // cambio lingua: l'attributo lang su <html> cambia → ricalcola
  // (update sincrono: niente frame in cui la lingua nuova appare "non animata")
  const mo = new MutationObserver(() => update());
  mo.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["lang"],
  });

  // i font (Bespoke) cambiano le altezze: ricalcola quando sono pronti
  document.fonts?.ready.then(schedule);

  // primo stato calcolato in modo sincrono, poi si toglie il "nascondi iniziale" CSS
  update();
  root.dataset.ready = "";

  return () => {
    delete root.dataset.ready;
    cancelAnimationFrame(raf);
    window.removeEventListener("scroll", onScroll);
    window.removeEventListener("resize", onScroll);
    mo.disconnect();
  };
}