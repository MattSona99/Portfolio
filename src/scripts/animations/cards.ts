import { gsap } from "gsap";

export function initCards() {
  const cleanups: Array<() => void> = [];
  const cards = document.querySelectorAll<HTMLElement>("[data-card]");

  cards.forEach((card) => {
    const topChars = card.querySelectorAll<HTMLElement>("[data-char-top]");
    const bottomChars = card.querySelectorAll<HTMLElement>("[data-char-bottom]");
    const bgCurtain = card.querySelector<HTMLElement>("[data-card-bg]");
    const image = card.querySelector<HTMLElement>("[data-card-pattern]");

    const centerMain = card.querySelector<HTMLElement>("[data-center-main]");
    const centerChars = card.querySelectorAll<HTMLElement>("[data-center-char]");
    const echoTop = card.querySelector<HTMLElement>("[data-center-echo-top]");
    const echoBottom = card.querySelector<HTMLElement>("[data-center-echo-bottom]");

    let enterTl: gsap.core.Timeline | null = null;
    let headerLoopTween: gsap.core.Tween | null = null;
    let centerLoopTl: gsap.core.Timeline | null = null;

    const animatedElements = [
      topChars,
      bottomChars,
      bgCurtain,
      image,
      centerMain,
      centerChars,
      echoTop,
      echoBottom,
    ];

    // Stato iniziale
    gsap.set(topChars, { yPercent: 0, scaleY: 1 });
    gsap.set(bottomChars, { yPercent: 115, scaleY: 1 });
    gsap.set([echoTop, echoBottom], {
      yPercent: 0,
      opacity: 0,
      scale: 0.95,
    });

    if (image) {
      gsap.set(image, {
        scale: 1,
        x: 0,
        y: 0,
        transformOrigin: "50% 50%",
        willChange: "transform",
      });
    }

    if (bgCurtain) {
      gsap.set(bgCurtain, {
        scaleY: 0,
        opacity: 0,
        transformOrigin: "bottom center",
      });
    }

    if (centerMain) {
      gsap.set(centerMain, { opacity: 0.15, scale: 1 });
    }

    const stopAnimations = () => {
      enterTl?.kill();
      headerLoopTween?.kill();
      centerLoopTl?.kill();
      gsap.killTweensOf(animatedElements);
    };

    // Hover enter
    const onEnter = () => {
      stopAnimations();

      const tl = gsap.timeline({
        onComplete: () => {
          headerLoopTween = gsap.to(bottomChars, {
            yPercent: -12,
            scaleY: 1.12,
            duration: 0.55,
            stagger: {
              each: 0.045,
              repeat: -1,
              yoyo: true,
            },
            ease: "sine.inOut",
          });

          centerLoopTl = gsap.timeline({ repeat: -1, yoyo: true });
          centerLoopTl
            .to(
              echoTop,
              {
                yPercent: -105,
                scale: 1.04,
                opacity: 0.4,
                duration: 1.1,
                ease: "sine.inOut",
              },
              0,
            )
            .to(
              echoBottom,
              {
                yPercent: 105,
                scale: 1.04,
                opacity: 0.4,
                duration: 1.1,
                ease: "sine.inOut",
              },
              0,
            )
            .to(
              centerChars,
              {
                yPercent: -6,
                duration: 0.65,
                stagger: { each: 0.04, repeat: 1, yoyo: true },
                ease: "sine.inOut",
              },
              0,
            );
        },
      });

      enterTl = tl;

      // PNG: zoom e movimento morbido, senza loop di pattern
      if (image) {
        tl.to(
          image,
          {
            scale: 1.07,
            x: "-1.2%",
            y: "-1%",
            duration: 1.1,
            ease: "power2.out",
          },
          0,
        );
      }

      // Overlay
      if (bgCurtain) {
        tl.to(
          bgCurtain,
          {
            scaleY: 1,
            opacity: 0.16,
            duration: 0.75,
            ease: "power3.out",
          },
          0,
        );
      }

      // Titolo superiore e inferiore
      tl.to(
        topChars,
        {
          yPercent: -115,
          duration: 0.55,
          stagger: 0.025,
          ease: "expo.out",
        },
        0,
      );

      tl.to(
        bottomChars,
        {
          yPercent: 0,
          duration: 0.55,
          stagger: 0.025,
          ease: "expo.out",
        },
        0,
      );

      // Testo centrale
      if (centerMain) {
        tl.to(
          centerMain,
          {
            opacity: 1,
            color: "var(--accent)",
            scale: 1.04,
            duration: 0.65,
            ease: "power3.out",
          },
          0.08,
        );
      }

      tl.fromTo(
        centerChars,
        { yPercent: 22 },
        {
          yPercent: 0,
          duration: 0.6,
          stagger: 0.025,
          ease: "back.out(1.6)",
        },
        0.08,
      );

      tl.to(
        echoTop,
        {
          yPercent: -85,
          opacity: 0.32,
          scale: 1,
          duration: 0.7,
          ease: "expo.out",
        },
        0.1,
      );

      tl.to(
        echoBottom,
        {
          yPercent: 85,
          opacity: 0.32,
          scale: 1,
          duration: 0.7,
          ease: "expo.out",
        },
        0.1,
      );
    };

    // Hover leave
    const onLeave = () => {
      stopAnimations();

      const tl = gsap.timeline();

      if (image) {
        tl.to(
          image,
          {
            scale: 1,
            x: 0,
            y: 0,
            duration: 0.65,
            ease: "power3.out",
          },
          0,
        );
      }

      if (bgCurtain) {
        tl.to(
          bgCurtain,
          {
            scaleY: 0,
            opacity: 0,
            duration: 0.5,
            ease: "power3.inOut",
          },
          0,
        );
      }

      tl.to(
        topChars,
        {
          yPercent: 0,
          scaleY: 1,
          duration: 0.45,
          stagger: { each: 0.015, from: "end" },
          ease: "expo.out",
        },
        0,
      );

      tl.to(
        bottomChars,
        {
          yPercent: 115,
          scaleY: 1,
          duration: 0.45,
          stagger: { each: 0.015, from: "end" },
          ease: "expo.out",
        },
        0,
      );

      if (centerMain) {
        tl.to(
          centerMain,
          {
            opacity: 0.15,
            color: "var(--fg)",
            scale: 1,
            duration: 0.45,
            ease: "expo.out",
          },
          0,
        );
      }

      tl.to(
        centerChars,
        {
          yPercent: 0,
          duration: 0.4,
          ease: "expo.out",
        },
        0,
      );

      tl.to(
        [echoTop, echoBottom],
        {
          yPercent: 0,
          opacity: 0,
          scale: 0.95,
          duration: 0.4,
          ease: "expo.out",
        },
        0,
      );
    };

    card.addEventListener("mouseenter", onEnter);
    card.addEventListener("mouseleave", onLeave);

    cleanups.push(() => {
      stopAnimations();
      card.removeEventListener("mouseenter", onEnter);
      card.removeEventListener("mouseleave", onLeave);
    });
  });

  return () => cleanups.forEach((fn) => fn());
}