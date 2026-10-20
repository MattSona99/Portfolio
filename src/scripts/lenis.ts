import Lenis from 'lenis';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

export const lenis = new Lenis({ autoRaf: false });

let scrollIndicator: HTMLElement | null = null;
let isGameFocused = true;

lenis.on('scroll', (e) => {
    ScrollTrigger.update();
    
    if (typeof e.progress === 'number') {
        // --- GESTIONE FOCUS HERO GAME ---
        if (e.progress > 0.05 && isGameFocused) {
            isGameFocused = false;
            const activeEl = document.activeElement as HTMLElement;
            if (activeEl && activeEl.closest('[data-hero]')) {
                activeEl.blur();
            }
        } else if (e.progress <= 0.05 && !isGameFocused) {
            isGameFocused = true;
            // Cerca l'elemento giocabile nella Hero (canvas o container con tabindex)
            const gameElement = document.querySelector<HTMLElement>('[data-hero] canvas, [data-hero] [tabindex]');
            if (gameElement) {
                gameElement.focus({ preventScroll: true });
            }
        }

        // --- AGGIORNAMENTO INDICATORE SCROLL ---
        if (scrollIndicator) {
            const percent = Math.min(100, Math.max(0, Math.round(e.progress * 100)));
            scrollIndicator.innerText = `${percent.toString().padStart(3, '0')}%`;

            const scaleValue = 1 + (e.progress * 1.5);
            scrollIndicator.style.scale = scaleValue.toString();

            const opacityValue = 0.6 + (e.progress * 0.4);
            scrollIndicator.style.opacity = opacityValue.toString();

            const topPos = 50 + (e.progress * 35); 
            const rightPos = 8 + (e.progress * -4); 
            
            scrollIndicator.style.top = `calc(${topPos}% - 1rem)`; 
            scrollIndicator.style.right = `${rightPos}px`;
        }
    }
});

gsap.ticker.add((t) => lenis.raf(t * 1000));
gsap.ticker.lagSmoothing(0);

// Unificato il doppio listener 'astro:page-load'
document.addEventListener('astro:page-load', () => {
    scrollIndicator = document.getElementById('scroll-percentage');
    
    lenis.scrollTo(0, { immediate: true });
    if (scrollIndicator) {
        scrollIndicator.innerText = '000%';
        scrollIndicator.style.top = '50%';
        scrollIndicator.style.right = '8px';
        scrollIndicator.style.scale = '1';
        scrollIndicator.style.opacity = '0.6';
    }
});