/**
 * Pagina Manifest: animazioni scrubbed + barra indice verticale.
 *
 * Stessa tecnica di curriculum.ts: tutto è legato alla posizione di scroll
 * (non a timer). Lenis aggiorna lo scroll nativo, quindi bastano l'evento
 * `scroll` + rAF. Nessuna dipendenza esterna.
 *
 * Attributi usati nel markup:
 *   data-split (+ data-intro)  titoli: parole che salgono da una maschera (hero: a tempo)
 *   data-fade                  paragrafo: le parole si accendono una a una
 *   data-reveal                blocchi: fade + slide
 *   data-line                  divisori: scaleX da sinistra
 *   data-hero-content          hero: sfuma e sale mentre si scende
 *   .manifest-prose            corpo MDX: ogni blocco / voce di lista appare da sé
 *   data-spy                   sezioni seguite dall'indice (id = ancora)
 *   data-toc, data-toc-*       barra indice (vedi manifest.astro)
 */
import { lenis } from "./lenis";

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
  /** traslazione verticale applicata (px), per misurare la posizione "a riposo" */
  dy: number;
  /** ultimo progresso applicato (-1 = mai): evita scritture inutili */
  p: number;
  top: number;
  shown: boolean;
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

export function initManifest(): () => void {
  const root = document.querySelector<HTMLElement>("[data-manifest]");
  if (!root) return () => {};

  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const canHover = window.matchMedia("(hover: hover)").matches;

  // i link esterni nel testo si aprono in una nuova scheda
  root
    .querySelectorAll<HTMLAnchorElement>('.manifest-prose a[href^="http"]')
    .forEach((a) => {
      if (a.hostname !== location.hostname) {
        a.target = "_blank";
        a.rel = "noopener noreferrer";
      }
    });

  // =========================================================================
  // 1. Animazioni scrubbed
  // =========================================================================
  const items: Item[] = [];
  const add = (nodes: Iterable<HTMLElement>, kind: Kind) => {
    for (const el of nodes) {
      const words =
        kind === "split" || kind === "fade"
          ? splitWords(el, kind === "split")
          : [];
      items.push({
        el,
        kind,
        intro: el.hasAttribute("data-intro"),
        words,
        dy: 0,
        p: -1,
        top: 0,
        shown: false,
      });
    }
  };

  add(root.querySelectorAll<HTMLElement>("[data-split]"), "split");
  add(root.querySelectorAll<HTMLElement>("[data-fade]"), "fade");
  // corpo MDX: ogni paragrafo/titolo e ogni voce di lista appare per conto suo
  add(
    root.querySelectorAll<HTMLElement>(
      "[data-reveal], .manifest-prose > :not(ul):not(ol), .manifest-prose > ul > li, .manifest-prose > ol > li",
    ),
    "reveal",
  );
  add(root.querySelectorAll<HTMLElement>("[data-line]"), "line");

  const heroContent = root.querySelector<HTMLElement>("[data-hero-content]");

  const apply = (it: Item, p: number) => {
    switch (it.kind) {
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
        it.words.forEach((w, i) => {
          const wp = clamp(p * n - i);
          w.style.opacity = String(0.14 + 0.86 * easeInOut(wp));
        });
        break;
      }
      case "reveal": {
        const e = easeOut(p);
        it.dy = (1 - e) * 28;
        it.el.style.opacity = String(e);
        it.el.style.transform = it.dy ? `translateY(${it.dy}px)` : "";
        break;
      }
      case "line": {
        it.el.style.transform = `scaleX(${easeInOut(p)})`;
        break;
      }
    }
  };

  // ---- intro a tempo (solo hero): parte quando il loader non copre più la pagina
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

  // =========================================================================
  // 2. Barra indice (rail) + scroll-spy
  // =========================================================================
  const toc = root.querySelector<HTMLElement>("[data-toc]");
  const toggle = root.querySelector<HTMLButtonElement>("[data-toc-toggle]");
  const scroller = root.querySelector<HTMLElement>("[data-toc-scroll]");
  const percentEl = root.querySelector<HTMLElement>("[data-toc-percent]");
  const links = Array.from(
    root.querySelectorAll<HTMLElement>("[data-toc-link]"),
  );
  const ticks = Array.from(root.querySelectorAll<HTMLElement>("[data-tick]"));
  const spies = Array.from(root.querySelectorAll<HTMLElement>("[data-spy]"));

  let current: string | null = null;
  let armed = false; // l'hash si aggiorna solo dopo il primo scroll (non cancella un deep link in apertura)

  const setActive = (key: string | null) => {
    for (const a of links) {
      const on = a.dataset.tocLink === key;
      a.toggleAttribute("data-active", on);
      if (on) a.setAttribute("aria-current", "location");
      else a.removeAttribute("aria-current");
    }
    for (const t of ticks)
      t.toggleAttribute("data-active", t.dataset.tick === key);

    // tiene la voce attiva a vista nel pannello (se la lista è più lunga dello schermo)
    const active = links.find((a) => a.dataset.tocLink === key);
    if (active && scroller && scroller.scrollHeight > scroller.clientHeight) {
      scroller.scrollTo({
        top: active.offsetTop - scroller.clientHeight / 2,
        behavior: reduce ? "auto" : "smooth",
      });
    }
  };

  const syncHash = (key: string | null) => {
    if (!armed) return;
    const next = key ? `#${key}` : "";
    if (location.hash === next) return;
    // history.state va preservato: il ClientRouter di Astro ci salva lo scroll
    history.replaceState(
      history.state,
      "",
      next || location.pathname + location.search,
    );
  };

  // ---- apertura / chiusura del pannello
  let pinned = false; // aperto con click/tap (resta aperto finché non lo chiudi)
  let hoverTimer = 0;
  const isOpen = () => toc?.hasAttribute("data-open") ?? false;
  const setOpen = (open: boolean) => {
    toc?.toggleAttribute("data-open", open);
    toggle?.setAttribute("aria-expanded", String(open));
  };

  const onToggle = () => {
    if (isOpen() && pinned) {
      pinned = false;
      setOpen(false);
    } else {
      pinned = true;
      setOpen(true);
    }
  };
  const onEnter = (e: PointerEvent) => {
    if (e.pointerType !== "mouse") return;
    clearTimeout(hoverTimer);
    setOpen(true);
  };
  const onLeave = (e: PointerEvent) => {
    if (e.pointerType !== "mouse" || pinned) return;
    hoverTimer = window.setTimeout(() => setOpen(false), 200);
  };
  const onPointerDown = (e: PointerEvent) => {
    if (pinned && toc && !toc.contains(e.target as Node)) {
      pinned = false;
      setOpen(false);
    }
  };
  const onKey = (e: KeyboardEvent) => {
    if (e.key === "Escape" && isOpen()) {
      pinned = false;
      setOpen(false);
      toggle?.focus();
    }
  };

  toggle?.addEventListener("click", onToggle);
  toc?.addEventListener("pointerenter", onEnter);
  toc?.addEventListener("pointerleave", onLeave);
  document.addEventListener("pointerdown", onPointerDown);
  document.addEventListener("keydown", onKey);

  // ---- navigazione: tutti i link #ancora della pagina, via Lenis se c'è
  const scrollToEl = (el: HTMLElement) => {
    const offset = -(parseFloat(getComputedStyle(el).scrollMarginTop) || 0);

    if (!reduce) {
      lenis.scrollTo(el, {
        offset,
        duration: 1.4,
      });
    } else {
      el.scrollIntoView({
        behavior: "auto",
        block: "start",
      });
    }
  };

  const onClick = (e: MouseEvent) => {
    const target = e.target as Element;

    if (target.closest("[data-toc-top]")) {
      if (!reduce) {
        lenis.scrollTo(0, { duration: 1.4 });
      } else {
        window.scrollTo({ top: 0, behavior: "auto" });
      }
      return;
    }

    const a = target.closest<HTMLAnchorElement>('a[href^="#"]');
    if (
      !a ||
      e.button !== 0 ||
      e.metaKey ||
      e.ctrlKey ||
      e.shiftKey ||
      e.altKey
    )
      return;
    const id = decodeURIComponent(a.getAttribute("href")!.slice(1));
    const dest = id ? document.getElementById(id) : null;
    if (!dest) return;

    e.preventDefault();
    scrollToEl(dest);
    // su touch il pannello copre il testo: si chiude dopo la scelta
    if (!canHover && toc?.contains(a)) {
      pinned = false;
      setOpen(false);
    }
  };
  root.addEventListener("click", onClick);

  // =========================================================================
  // 3. Loop
  // =========================================================================
  let raf = 0;
  const schedule = () => {
    if (!raf) raf = requestAnimationFrame(update);
  };

  function update(now = performance.now()) {
    raf = 0;
    const vh = window.innerHeight;

    if (!reduce && intro < 1) {
      if (!introStart && !(loaderActive() && now - t0 < 6000)) introStart = now;
      intro = introStart
        ? clamp((now - introStart - INTRO_DELAY) / INTRO_MS)
        : 0;
    }

    // ---- fase di LETTURA (tutti i rect insieme, prima di scrivere)
    for (const it of items) {
      const r = it.el.getBoundingClientRect();
      // elementi nascosti (lingua non attiva: display none) hanno box 0x0
      it.shown = r.width > 0 || r.height > 0;
      it.top = r.top - it.dy;
    }
    const spyRects = spies.map((s) => s.getBoundingClientRect());

    // ---- fase di SCRITTURA
    for (const it of items) {
      if (!it.shown) continue;

      let p = 1;
      if (!reduce) {
        if (it.intro) {
          p = intro;
        } else {
          let start = vh * 0.92;
          let end = vh * 0.6;
          if (it.kind === "fade") {
            start = vh * 0.85;
            end = vh * 0.35;
          } else if (it.kind === "line") {
            start = vh * 0.98;
            end = vh * 0.8;
          }
          p = clamp((start - it.top) / (start - end));
        }
      }

      if (p === it.p) continue;
      it.p = p;
      apply(it, p);
    }

    // hero: sfuma e sale scendendo, ritorna risalendo
    if (heroContent && !reduce) {
      const hp = clamp(window.scrollY / (vh * 0.7));
      heroContent.style.opacity = String(1 - easeInOut(hp));
      heroContent.style.transform = `translateY(${hp * -48}px)`;
    }

    // ---- indice: visibilità, progresso, sezione attiva
    if (spies.length) {
      const first = spyRects[0];
      const last = spyRects[spyRects.length - 1];

      // il rail compare quando si entra nel contenuto e sparisce dopo l'ultima sezione
      root?.toggleAttribute(
        "data-toc-visible",
        first.top < vh * 0.6 && last.bottom > vh * 0.25,
      );

      const progress = clamp(
        -first.top / Math.max(1, last.bottom - first.top - vh),
      );
      toc?.style.setProperty("--p", progress.toFixed(4));
      if (percentEl) percentEl.textContent = String(Math.round(progress * 100));

      const probe = vh * 0.4;
      let key: string | null = null;
      for (let i = 0; i < spies.length; i++) {
        if (spyRects[i].top <= probe && spyRects[i].bottom > probe) {
          key = spies[i].dataset.spy ?? null;
          break;
        }
      }
      // oltre l'ultima sezione (footer) resta attiva l'ultima
      if (key === null && last.bottom <= probe) {
        key = spies[spies.length - 1].dataset.spy ?? null;
      }

      if (key !== current) {
        current = key;
        setActive(key);
        syncHash(key);
      }
    }

    if (!reduce && intro < 1) schedule();
  }

  const onScroll = () => {
    armed = true;
    schedule();
  };
  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", schedule);

  // cambio lingua: l'attributo lang su <html> cambia → ricalcola subito
  // (le altezze cambiano: ogni lingua ha testi di lunghezza diversa)
  const mo = new MutationObserver(() => update());
  mo.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["lang"],
  });

  // i font (Bespoke) cambiano le altezze: ricalcola quando sono pronti.
  // Se si arriva con un deep link (#capitolo), riallinea una volta dopo i font.
  const hash = decodeURIComponent(location.hash.slice(1));
  document.fonts?.ready.then(() => {
    schedule();
    if (hash) document.getElementById(hash)?.scrollIntoView();
  });

  // primo stato calcolato in modo sincrono, poi si toglie il "nascondi iniziale" CSS
  update();
  root.dataset.ready = "";

  return () => {
    delete root.dataset.ready;
    cancelAnimationFrame(raf);
    clearTimeout(hoverTimer);
    window.removeEventListener("scroll", onScroll);
    window.removeEventListener("resize", schedule);
    document.removeEventListener("pointerdown", onPointerDown);
    document.removeEventListener("keydown", onKey);
    root.removeEventListener("click", onClick);
    toggle?.removeEventListener("click", onToggle);
    toc?.removeEventListener("pointerenter", onEnter);
    toc?.removeEventListener("pointerleave", onLeave);
    mo.disconnect();
  };
}
