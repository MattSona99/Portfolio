import Lenis from 'lenis';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

export const lenis = new Lenis({ autoRaf: false });

let scrollIndicator: HTMLElement | null = null;

lenis.on('scroll', (e) => {
    ScrollTrigger.update();
    
    if (scrollIndicator && typeof e.progress === 'number') {
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
});

gsap.ticker.add((t) => lenis.raf(t * 1000));
gsap.ticker.lagSmoothing(0);

document.addEventListener('astro:page-load', () => {
    scrollIndicator = document.getElementById('scroll-percentage');
});

document.addEventListener('astro:after-swap', () => {
    lenis.scrollTo(0, { immediate: true });
    if (scrollIndicator) {
        scrollIndicator.innerText = '000%';
        scrollIndicator.style.top = '50%';
        scrollIndicator.style.right = '8px';
        scrollIndicator.style.scale = '1';
        scrollIndicator.style.opacity = '0.6';
    }
});