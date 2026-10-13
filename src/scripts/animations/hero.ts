
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

function initHero() {
    const ctx = gsap.context(() => {

        gsap.to('.wrap', {
            paddingLeft: 0,
            paddingRight: 0,
            paddingInline: 0,
            maxWidth: '100%',
            ease: 'none',
            scrollTrigger: {
                trigger: '[data-cards-section]',
                start: 'top bottom',
                end: 'top top',
                scrub: true
            }
        });
    });

    document.addEventListener(
        'astro:before-swap',
        () => ctx.revert(),
        { once: true }
    );
}

document.addEventListener('astro:page-load', initHero);
