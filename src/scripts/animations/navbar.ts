import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { prefetch } from "astro:prefetch";
import type { TransitionBeforeSwapEvent } from "astro:transitions/client";
import { lenis } from "../lenis";

gsap.registerPlugin(ScrollTrigger);

const STORAGE_KEY = "home-scroll-y";
const DURATION = 0.65;
const EASE = "power2.inOut";

// Tween più breve per il ritorno in Home (back/forward del browser)
const BACK_DURATION = 0.3;
const BACK_EASE = "power3.out";

// Unica fonte di verità: 0 = stretta (con padding laterali), 1 = tutta larga.
// Il modulo viene caricato una sola volta, quindi sopravvive ai cambi pagina.
const state = { p: 0 };

let trigger: ScrollTrigger | undefined;
let tween: gsap.core.Tween | undefined;
let animating = false;
let lastNavType: string | undefined;
let hasLoadedOnce = false;

function isHomePath(path: string) {
  const p = path.replace(/\/+$/, "");
  return p === "" || p === "/home";
}

function updateBackButton() {
  const backBtn = document.querySelector<HTMLElement>("[data-back-btn]");
  if (!backBtn) return;

  if (isHomePath(location.pathname)) {
    // Nascondi nella Home: scorre verso sinistra e svanisce
    backBtn.classList.add("opacity-0", "-translate-x-4", "pointer-events-none");
    backBtn.classList.remove("opacity-100", "translate-x-0");
  } else {
    // Mostra in altre directory: appare al centro della sua posizione
    backBtn.classList.remove(
      "opacity-0",
      "-translate-x-4",
      "pointer-events-none",
    );
    backBtn.classList.add("opacity-100", "translate-x-0");
  }
}

function getElements() {
  return {
    nav: document.querySelector<HTMLElement>("[data-nav-shell]"),
    main: document.querySelector<HTMLElement>("main.wrap"),
    cards: document.querySelector<HTMLElement>("[data-cards-section]"),
  };
}

function applyWidth(el: HTMLElement, p: number) {
  const side = innerWidth >= 768 ? 40 : 24;
  el.style.maxWidth = `${1440 + (innerWidth - 1440) * p}px`;
  el.style.paddingLeft = `${side * (1 - p)}px`;
  el.style.paddingRight = `${side * (1 - p)}px`;
}

function render() {
  const { nav, main } = getElements();
  if (nav) applyWidth(nav, state.p);
  if (main) applyWidth(main, state.p);
}

function syncFromScroll(progress: number) {
  if (animating) return;
  state.p = progress;
  render();
}

function goTo(
  target: number,
  animate: boolean,
  duration = DURATION,
  ease = EASE,
) {
  tween?.kill();
  const t = gsap.utils.clamp(0, 1, target);

  if (!animate || Math.abs(state.p - t) < 0.001) {
    animating = false;
    state.p = t;
    render();
    return;
  }

  animating = true;
  tween = gsap.to(state, {
    p: t,
    duration,
    ease,
    onUpdate: render,
    onComplete: () => {
      animating = false;
      // Se hai scrollato durante l'animazione, riallinea allo scroll reale.
      if (trigger) syncFromScroll(trigger.progress);
    },
  });
}

function destroyTrigger() {
  trigger?.kill();
  trigger = undefined;
}

function initPage() {
  destroyTrigger();

  updateBackButton();

  const { cards } = getElements();
  const navType = lastNavType;
  lastNavType = undefined;

  // La primissima apertura non anima (c'è già il loader).
  const animate = hasLoadedOnce;
  hasLoadedOnce = true;

  // Pagine interne: allarga fino al 100% partendo dal valore corrente.
  if (!isHomePath(location.pathname) || !cards) {
    goTo(1, animate);
    return;
  }

  // Home: scroll ripristinato solo con back/forward del browser.
  const isBack = navType === "traverse";
  let savedY: number | null = null;
  if (isBack) {
    try {
      const raw = sessionStorage.getItem(STORAGE_KEY);
      savedY = raw !== null ? Number(raw) : null;
    } catch {
      savedY = null;
    }
  }
  lenis.scrollTo(savedY ?? 0, { immediate: true });

  // Finché non partiamo dal valore giusto, lo scroll non deve toccare state.p.
  tween?.kill();
  animating = true;

  trigger = ScrollTrigger.create({
    trigger: cards,
    start: "top bottom",
    end: "top top",
    invalidateOnRefresh: true,
    onUpdate: (self) => syncFromScroll(self.progress),
    onRefresh: (self) => syncFromScroll(self.progress),
  });
  ScrollTrigger.refresh();

  // Ritorno in Home: tween più corto per non far sentire il ritardo.
  // Per lo scatto istantaneo usa: goTo(trigger.progress, animate && !isBack);
  goTo(
    trigger.progress,
    animate,
    isBack ? BACK_DURATION : DURATION,
    isBack ? BACK_EASE : EASE,
  );
}

document.addEventListener("astro:before-swap", (e) => {
  const ev = e as TransitionBeforeSwapEvent;
  lastNavType = ev.navigationType;

  if (isHomePath(ev.from.pathname)) {
    try {
      sessionStorage.setItem(STORAGE_KEY, String(lenis.scroll));
    } catch {
      // la navigazione continua anche senza storage
    }
  }

  // Evita che lo reset dello scroll durante lo swap riporti state.p a 0.
  destroyTrigger();
});

// Il nuovo <main> nasce stretto: applichiamo subito lo stato corrente,
// prima del primo paint, così non c'è nessun salto.
document.addEventListener("astro:after-swap", render);

document.addEventListener("astro:page-load", () => {
  // Dalle pagine interne, pre-carica la Home così il ritorno non aspetta la rete.
  if (!isHomePath(location.pathname)) prefetch("/home");

  requestAnimationFrame(initPage);
  const backBtn = document.querySelector<HTMLElement>("[data-back-btn]");
  if (backBtn && !backBtn.hasAttribute("data-listener")) {
    backBtn.addEventListener("click", () => {
      // Se c'è una storia e non proveniamo dall'esterno, torna indietro
      if (window.history.length > 1) {
        window.history.back();
      } else {
        // Fallback robusto se l'utente atterra direttamente su una sub-directory
        window.location.href = "/home";
      }
    });
    backBtn.setAttribute("data-listener", "true");
  }
});

window.addEventListener("resize", () => {
  if (!animating) render();
});