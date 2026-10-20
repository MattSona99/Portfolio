// src/scripts/cursor.ts
import { gsap } from "gsap";

let initialized = false;

export function initCursor() {
  // Evita di inizializzare più volte durante le navigazioni di Astro
  if (initialized) return;
  
  // Attiva solo su dispositivi con mouse (ignorando touch e mobile)
  if (!window.matchMedia("(pointer: fine)").matches) return;

  const cursor = document.getElementById("custom-cursor");
  const coords = document.getElementById("cursor-coords");
  const centerEl = document.getElementById("cursor-center");
  const bracketsEl = document.getElementById("cursor-brackets");

  if (!cursor || !coords || !centerEl || !bracketsEl) return;
  initialized = true;

  // Usa quickTo per altissime performance sull'aggiornamento della posizione
  const xTo = gsap.quickTo(cursor, "x", { duration: 0.2, ease: "power3.out" });
  const yTo = gsap.quickTo(cursor, "y", { duration: 0.2, ease: "power3.out" });

  let isHovering = false;
  let hoverTarget: HTMLElement | null = null;

  // Ascoltatore globale del movimento del mouse
  window.addEventListener("mousemove", (e) => {
    // 1. Controlla se il mouse è sopra un elemento interattivo
    const target = (e.target as HTMLElement).closest("a, button, [data-card]");

    // --- HOVER IN ---
    if (target && target !== hoverTarget) {
      hoverTarget = target as HTMLElement;
      isHovering = true;
      
      const rect = hoverTarget.getBoundingClientRect();
      
      // Nascondi reticolo centrale
      gsap.to(centerEl, { opacity: 0, scale: 0.5, duration: 0.3, ease: "power2.out" });
      
      // Allarga le parentesi in base al bordo dell'elemento (aggiungiamo 16px di respiro)
      gsap.to(bracketsEl, { 
        width: rect.width + 16, 
        height: rect.height + 16, 
        duration: 0.4, 
        ease: "expo.out" 
      });
    } 
    // --- HOVER OUT ---
    else if (!target && hoverTarget) {
      hoverTarget = null;
      isHovering = false;

      // Ripristina reticolo centrale
      gsap.to(centerEl, { opacity: 1, scale: 1, duration: 0.3, ease: "power2.out" });
      
      // Restringi le parentesi
      gsap.to(bracketsEl, { 
        width: 32, // w-8
        height: 32, // h-8
        duration: 0.4, 
        ease: "expo.out" 
      });
    }

    // 2. Movimento
    if (!isHovering) {
      // Segue fluidamente il mouse
      xTo(e.clientX);
      yTo(e.clientY);
    } else if (hoverTarget) {
      // EFFETTO MAGNETICO: Forza il centro del cursore sul centro dell'elemento
      const rect = hoverTarget.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      
      xTo(centerX);
      yTo(centerY);
    }

    // 3. Aggiorna sempre i testi delle coordinate (X, Y)
    coords.textContent = `X: ${String(e.clientX).padStart(3, "0")} Y: ${String(e.clientY).padStart(3, "0")}`;
  });
}