import { gsap } from "gsap";

export function initCards() {
  const cleanups: Array<() => void> = [];
  const cards = document.querySelectorAll<HTMLElement>("[data-card]");

  cards.forEach((card) => {
    const topChars = card.querySelectorAll<HTMLElement>("[data-char-top]");
    const bottomChars = card.querySelectorAll<HTMLElement>("[data-char-bottom]");
    const bgCurtain = card.querySelector<HTMLElement>("[data-card-bg]");
    const pattern = card.querySelector<HTMLElement>("[data-card-pattern]");

    const centerMain = card.querySelector<HTMLElement>("[data-center-main]");
    const centerChars = card.querySelectorAll<HTMLElement>("[data-center-char]");
    const echoTop = card.querySelector<HTMLElement>("[data-center-echo-top]");
    const echoBottom = card.querySelector<HTMLElement>("[data-center-echo-bottom]");

    let isHovered = false;
    let enterTl: gsap.core.Timeline | null = null;
    let headerLoopTween: gsap.core.Tween | null = null;
    let centerLoopTl: gsap.core.Timeline | null = null;
    let patternLoopTween: gsap.core.Tween | null = null;

    // ─── STATO INIZIALE ───
    gsap.set(topChars, { yPercent: 0, scaleY: 1 });
    gsap.set(bottomChars, { yPercent: 115, scaleY: 1 });
    gsap.set([echoTop, echoBottom], { yPercent: 0, opacity: 0, scale: 0.95 });

    // ─── HOVER ENTER ───
    card.addEventListener("mouseenter", () => {
      isHovered = true;

      enterTl?.kill();
      headerLoopTween?.kill();
      centerLoopTl?.kill();
      patternLoopTween?.kill();
      gsap.killTweensOf([
        topChars,
        bottomChars,
        bgCurtain,
        pattern,
        centerMain,
        centerChars,
        echoTop,
        echoBottom,
      ]);

      // Scorri lentamente il pattern vettoriale in loop durante l'hover
      if (pattern) {
        gsap.to(pattern, {
          opacity: 0.12,
          scale: 1.05,
          duration: 0.5,
          ease: "power2.out",
        });
        patternLoopTween = gsap.to(pattern, {
          backgroundPosition: "220px 220px",
          duration: 12,
          repeat: -1,
          ease: "none",
        });
      }

      enterTl = gsap.timeline({
        onComplete: () => {
          if (!isHovered) return;

          // LOOP 1: Onda continua sulle lettere dell'header superiore
          headerLoopTween = gsap.to(bottomChars, {
            yPercent: -18,
            scaleY: 1.2,
            duration: 0.32,
            stagger: {
              each: 0.045,
              repeat: -1,
              yoyo: true,
            },
            ease: "sine.inOut",
          });

          // LOOP 2: Pulsazione magnetica delle scritte centrali
          centerLoopTl = gsap.timeline({ repeat: -1, yoyo: true });
          centerLoopTl
            .to(
              echoTop,
              { yPercent: -105, scale: 1.04, opacity: 0.45, duration: 0.7, ease: "sine.inOut" },
              0,
            )
            .to(
              echoBottom,
              { yPercent: 105, scale: 1.04, opacity: 0.45, duration: 0.7, ease: "sine.inOut" },
              0,
            )
            .to(
              centerChars,
              {
                yPercent: -8,
                duration: 0.4,
                stagger: { each: 0.04, repeat: 1, yoyo: true },
                ease: "sine.inOut",
              },
              0,
            );
        },
      });

      // 1. Roll-up del titolo in alto
      enterTl.to(
        topChars,
        {
          yPercent: -115,
          duration: 0.4,
          stagger: 0.02,
          ease: "expo.out",
        },
        0,
      );

      enterTl.to(
        bottomChars,
        {
          yPercent: 0,
          scaleY: 1,
          duration: 0.4,
          stagger: 0.02,
          ease: "expo.out",
        },
        0,
      );

      // 2. Sipario di background
      if (bgCurtain) {
        gsap.set(bgCurtain, { transformOrigin: "bottom center" });
        enterTl.to(
          bgCurtain,
          {
            scaleY: 1,
            opacity: 0.14,
            duration: 0.55,
            ease: "expo.out",
          },
          0,
        );
      }

      // 3. Animazione testo centrale
      if (centerMain) {
        enterTl.to(
          centerMain,
          {
            opacity: 1,
            color: "var(--accent)",
            scale: 1.05,
            duration: 0.45,
            ease: "expo.out",
          },
          0,
        );
      }

      enterTl.fromTo(
        centerChars,
        { yPercent: 25 },
        {
          yPercent: 0,
          duration: 0.45,
          stagger: 0.02,
          ease: "back.out(2)",
        },
        0,
      );

      enterTl.to(
        echoTop,
        {
          yPercent: -85,
          opacity: 0.35,
          scale: 1,
          duration: 0.5,
          ease: "expo.out",
        },
        0.05,
      );

      enterTl.to(
        echoBottom,
        {
          yPercent: 85,
          opacity: 0.35,
          scale: 1,
          duration: 0.5,
          ease: "expo.out",
        },
        0.05,
      );
    });

    // ─── HOVER LEAVE ───
    card.addEventListener("mouseleave", () => {
      isHovered = false;

      enterTl?.kill();
      headerLoopTween?.kill();
      centerLoopTl?.kill();
      patternLoopTween?.kill();
      gsap.killTweensOf([
        topChars,
        bottomChars,
        bgCurtain,
        pattern,
        centerMain,
        centerChars,
        echoTop,
        echoBottom,
      ]);

      if (pattern) {
        gsap.to(pattern, {
          opacity: 0.05,
          scale: 1,
          duration: 0.4,
          ease: "power2.out",
          overwrite: true,
        });
      }

      gsap.to(topChars, {
        yPercent: 0,
        scaleY: 1,
        duration: 0.4,
        stagger: { each: 0.015, from: "end" },
        ease: "expo.out",
        overwrite: true,
      });

      gsap.to(bottomChars, {
        yPercent: 115,
        scaleY: 1,
        duration: 0.4,
        stagger: { each: 0.015, from: "end" },
        ease: "expo.out",
        overwrite: true,
      });

      if (bgCurtain) {
        gsap.set(bgCurtain, { transformOrigin: "top center" });
        gsap.to(bgCurtain, {
          scaleY: 0,
          opacity: 0,
          duration: 0.45,
          ease: "expo.out",
          overwrite: true,
        });
      }

      if (centerMain) {
        gsap.to(centerMain, {
          opacity: 0.15,
          color: "var(--fg)",
          scale: 1,
          duration: 0.4,
          ease: "expo.out",
          overwrite: true,
        });
      }

      gsap.to(centerChars, {
        yPercent: 0,
        duration: 0.35,
        ease: "expo.out",
        overwrite: true,
      });

      gsap.to([echoTop, echoBottom], {
        yPercent: 0,
        opacity: 0,
        scale: 0.95,
        duration: 0.35,
        ease: "expo.out",
        overwrite: true,
      });
    });
    cleanups.push(() => {
      isHovered = false;
      enterTl?.kill();
      headerLoopTween?.kill();
      centerLoopTl?.kill();
      patternLoopTween?.kill();
      gsap.killTweensOf([
        topChars,
        bottomChars,
        bgCurtain,
        pattern,
        centerMain,
        centerChars,
        echoTop,
        echoBottom,
      ]);
    })
  });

  return () => cleanups.forEach((fn) => fn());
}