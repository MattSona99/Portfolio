import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

export function initFooterMotion() {
  const stage = document.querySelector<HTMLElement>("[data-footer-stage]");
  const visual = stage?.querySelector<HTMLElement>("[data-footer-visual]");

  if (!stage || !visual) return () => {};

  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    gsap.set(visual, { clearProps: "all" });
    return () => {};
  }

  const ctx = gsap.context(() => {
    gsap.fromTo(
      visual,
      {
        yPercent: 10,
        scale: 0.96,
        autoAlpha: 0.55,
      },
      {
        yPercent: 0,
        scale: 1,
        autoAlpha: 1,
        ease: "none",
        scrollTrigger: {
          trigger: stage,
          start: "top bottom",
          end: "top top",
          scrub: 1,
          invalidateOnRefresh: true,
        },
      },
    );
  }, stage);

  ScrollTrigger.refresh();

  return () => ctx.revert();
}