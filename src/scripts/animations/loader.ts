// src/scripts/animations/loader.ts
import { gsap } from "gsap";

export function initLoader() {
  const loader = document.getElementById("site-loader");
  if (!loader) return;

  // Usa stringa vuota per ripristinare il "flex" o "grid" di Tailwind
  loader.style.display = ""; 
  loader.style.pointerEvents = "auto";
  document.documentElement.style.overflow = "hidden";

  const counterEl = loader.querySelector<HTMLElement>(".loader-counter");
  const barEl = loader.querySelector<HTMLElement>(".loader-bar");
  const centerBox = loader.querySelector<HTMLElement>(".loader-center");
  const shutters = loader.querySelectorAll<HTMLElement>(".loader-shutter");

  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    loader.style.display = "none";
    document.documentElement.style.overflow = "";
    return;
  }

  const state = { val: 0 };

  const tl = gsap.timeline({
    defaults: { ease: "expo.inOut" },
    onComplete: () => {
      loader.style.display = "none";
      loader.style.pointerEvents = "none";
      document.documentElement.style.overflow = "";
      window.dispatchEvent(new CustomEvent("loader:complete"));
    },
  });

  gsap.set(centerBox, { y: 20, opacity: 0 });

  tl.to(centerBox, { y: 0, opacity: 1, duration: 0.45, ease: "power3.out" }, 0);

  tl.to(state, { val: 68, duration: 0.9, ease: "power2.inOut", onUpdate: updateProgress }, 0.15)
    .to(state, { val: 100, duration: 0.75, ease: "expo.out", onUpdate: updateProgress }, ">0.08");

  tl.to(barEl, { scaleX: 0.68, duration: 0.9, ease: "power2.inOut" }, 0.15)
    .to(barEl, { scaleX: 1, duration: 0.75, ease: "expo.out" }, ">0.08");

  tl.to(centerBox, { scale: 0.94, opacity: 0, y: -24, duration: 0.45, ease: "power3.in" }, "+=0.1");

  tl.to(shutters, { scaleY: 0, duration: 0.85, stagger: 0.09, ease: "expo.inOut" }, "-=0.15");

  function updateProgress() {
    if (counterEl) {
      counterEl.textContent = String(Math.round(state.val)).padStart(3, "0");
    }
  }
}