import { gsap } from "gsap";

// ─── PRE-CALCOLO UNA TANTUM DELLA MAPPA DEL BUCO NERO (Eseguito 1 sola volta!) ───
let cachedBlackHoleUrl: string | null = null;

function getStaticBlackHoleDataURL(): string {
  if (cachedBlackHoleUrl) return cachedBlackHoleUrl;

  const SIZE = 128;
  const canvas = document.createElement("canvas");
  canvas.width = SIZE;
  canvas.height = SIZE;
  const ctx = canvas.getContext("2d")!;
  const imgData = ctx.createImageData(SIZE, SIZE);
  const data = imgData.data;

  const cx = SIZE * 0.5;
  const cy = SIZE * 0.5;
  // Poiché feImage è grande 200% (width="2", height="2"), raggio 0.28 copre ~56% della card
  const maxRadius = SIZE * 0.28;

  for (let y = 0; y < SIZE; y++) {
    for (let x = 0; x < SIZE; x++) {
      const dx = cx - x;
      const dy = cy - y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const idx = (y * SIZE + x) * 4;

      if (dist < maxRadius && dist > 0.001) {
        const t = 1 - dist / maxRadius;
        const pull = Math.pow(t, 1.85);

        const nx = dx / dist;
        const ny = dy / dist;
        const tx = -ny;
        const ty = nx;

        const swirl = Math.pow(t, 2.4) * 0.85;
        const vx = nx * pull + tx * swirl;
        const vy = ny * pull + ty * swirl;

        data[idx] = Math.max(0, Math.min(255, Math.round(128 + vx * 127)));
        data[idx + 1] = Math.max(0, Math.min(255, Math.round(128 + vy * 127)));
        data[idx + 2] = 128;
        data[idx + 3] = 255;
      } else {
        data[idx] = 128;
        data[idx + 1] = 128;
        data[idx + 2] = 128;
        data[idx + 3] = 255;
      }
    }
  }

  ctx.putImageData(imgData, 0, 0);
  cachedBlackHoleUrl = canvas.toDataURL();
  return cachedBlackHoleUrl;
}

export function initCards() {
  const cards = document.querySelectorAll<HTMLElement>("[data-card]");

  cards.forEach((card) => {
    const type = card.dataset.cardType;
    const imgWrap = card.querySelector<HTMLElement>(".card-image-wrap");
    const img = card.querySelector<HTMLImageElement>("img");

    if (!imgWrap || !img) return;

    // ─── 1. ANIMAZIONE DI CARICAMENTO QUANDO LA CARD ENTRA IN VIEWPORT ───
    gsap.set(imgWrap, { clipPath: "inset(100% 0 0 0)" });
    gsap.set(img, { scale: 1.25 });

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const tl = gsap.timeline();
            tl.to(imgWrap, {
              clipPath: "inset(0% 0 0 0)",
              duration: 1.2,
              ease: "expo.out",
            }).to(
              img,
              {
                scale: 1,
                duration: 1.2,
                ease: "expo.out",
              },
              "<0.05",
            );
            observer.disconnect();
          }
        });
      },
      { threshold: 0.15 },
    );
    observer.observe(card);

    // ─── 2. ANIMAZIONI HOVER SUPER-OTTIMIZZATE (rAF Throttled) ───

    // -- 1. GITHUB: Effetto Acquoso --
    if (type === "github") {
      const turbulence = card.querySelector("feTurbulence");
      const displacement = card.querySelector("feDisplacementMap");
      const contentGroup = card.querySelector<HTMLElement>(".image-content-group");

      if (turbulence && displacement && contentGroup) {
        const baseColors = "contrast(1.2) saturate(0.8) brightness(0.9)";
        let hoverTween: gsap.core.Timeline | null = null;
        let isHovered = false;
        let rafPending = false;

        imgWrap.addEventListener("mouseenter", () => {
          isHovered = true;
          if (hoverTween) hoverTween.kill();

          contentGroup.style.willChange = "transform, filter";
          gsap.set(contentGroup, { filter: `url(#waterFilter) ${baseColors}` });
          gsap.set(turbulence, { attr: { baseFrequency: "0.01 0.01" } });

          hoverTween = gsap.timeline();
          hoverTween
            .to(displacement, { attr: { scale: 16 }, duration: 0.6, ease: "power2.out" }, 0)
            .to(contentGroup, { scale: 1.06, duration: 0.6, ease: "power2.out" }, 0);
        });

        imgWrap.addEventListener(
          "mousemove",
          (e) => {
            if (!isHovered || rafPending) return;
            rafPending = true;

            const clientX = e.clientX;
            const clientY = e.clientY;

            requestAnimationFrame(() => {
              rafPending = false;
              if (!isHovered) return;

              const rect = imgWrap.getBoundingClientRect();
              const x = (clientX - rect.left) / rect.width;
              const y = (clientY - rect.top) / rect.height;

              const freqX = (0.012 + x * 0.06).toFixed(4);
              const freqY = (0.012 + y * 0.06).toFixed(4);
              turbulence.setAttribute("baseFrequency", `${freqX} ${freqY}`);
            });
          },
          { passive: true },
        );

        imgWrap.addEventListener("mouseleave", () => {
          isHovered = false;
          if (hoverTween) hoverTween.kill();

          hoverTween = gsap.timeline({
            onComplete: () => {
              if (!isHovered) {
                gsap.set(contentGroup, { filter: baseColors });
                contentGroup.style.willChange = "auto";
              }
            },
          });

          hoverTween
            .to(displacement, { attr: { scale: 0 }, duration: 0.5, ease: "power2.out" }, 0)
            .to(contentGroup, { scale: 1, duration: 0.5, ease: "power2.out" }, 0);
        });
      }
    }

    // -- 2. CURRICULUM: Cyber-Scanner + VHS Glitch Tear + RGB Split --
    if (type === "curriculum") {
      const contentGroup = card.querySelector<HTMLElement>(".curriculum-content-group");
      const scannerBeam = card.querySelector<HTMLElement>(".scanner-beam");
      const turbulence = card.querySelector<SVGFETurbulenceElement>(".scan-turbulence");
      const displacement = card.querySelector<SVGFEDisplacementMapElement>(".scan-displacement");
      const redOffset = card.querySelector<SVGFEOffsetElement>(".rgb-red-offset");
      const blueOffset = card.querySelector<SVGFEOffsetElement>(".rgb-blue-offset");

      if (contentGroup && scannerBeam && turbulence && displacement && redOffset && blueOffset) {
        let isHovered = false;
        let rafPending = false;
        let hoverTween: gsap.core.Timeline | null = null;

        imgWrap.addEventListener("mouseenter", (e) => {
          isHovered = true;
          if (hoverTween) hoverTween.kill();

          contentGroup.style.willChange = "transform, filter";
          const rect = imgWrap.getBoundingClientRect();
          const y = (e.clientY - rect.top) / rect.height;
          contentGroup.style.setProperty("--scan-y", `${y * 100}%`);

          gsap.set(contentGroup, { filter: "url(#cyberScanFilter)" });

          hoverTween = gsap.timeline();
          hoverTween
            .to(displacement, { attr: { scale: 45 }, duration: 0.4, ease: "power3.out" }, 0)
            .to(scannerBeam, { opacity: 1, duration: 0.3, ease: "power2.out" }, 0)
            .to(redOffset, { attr: { dx: 6 }, duration: 0.4, ease: "power2.out" }, 0)
            .to(blueOffset, { attr: { dx: -6 }, duration: 0.4, ease: "power2.out" }, 0)
            .to(contentGroup, { scale: 1.06, duration: 0.5, ease: "power2.out" }, 0);
        });

        imgWrap.addEventListener(
          "mousemove",
          (e) => {
            if (!isHovered || rafPending) return;
            rafPending = true;

            const clientX = e.clientX;
            const clientY = e.clientY;

            requestAnimationFrame(() => {
              rafPending = false;
              if (!isHovered) return;

              const rect = imgWrap.getBoundingClientRect();
              const x = (clientX - rect.left) / rect.width;
              const y = (clientY - rect.top) / rect.height;

              contentGroup.style.setProperty("--scan-y", `${(y * 100).toFixed(1)}%`);

              const freqY = (0.08 + y * 0.25).toFixed(3);
              const freqX = (0.001 + x * 0.006).toFixed(4);
              const rgbShift = ((x - 0.5) * 18).toFixed(1);

              turbulence.setAttribute("baseFrequency", `${freqX} ${freqY}`);
              redOffset.setAttribute("dx", rgbShift);
              blueOffset.setAttribute("dx", `${-Number(rgbShift)}`);
            });
          },
          { passive: true },
        );

        imgWrap.addEventListener("mouseleave", () => {
          isHovered = false;
          if (hoverTween) hoverTween.kill();

          hoverTween = gsap.timeline({
            onComplete: () => {
              if (!isHovered) {
                gsap.set(contentGroup, { filter: "none" });
                contentGroup.style.willChange = "auto";
              }
            },
          });

          hoverTween
            .to(displacement, { attr: { scale: 0 }, duration: 0.45, ease: "expo.out" }, 0)
            .to([redOffset, blueOffset], { attr: { dx: 0 }, duration: 0.35, ease: "power2.out" }, 0)
            .to(scannerBeam, { opacity: 0, duration: 0.25, ease: "power2.out" }, 0)
            .to(contentGroup, { scale: 1, duration: 0.45, ease: "expo.out" }, 0);
        });
      }
    }

    // -- 3. MANIFEST: Buco Nero Super-Ottimizzato (Zero Canvas Re-encoding!) --
    if (type === "manifest") {
      const contentGroup = card.querySelector<HTMLElement>(".bh-content-group");
      const bhCore = card.querySelector<HTMLElement>(".black-hole-core");
      const feImage = card.querySelector<SVGFEImageElement>(".bh-fe-image");
      const displacement = card.querySelector<SVGFEDisplacementMapElement>(".bh-displacement");

      if (contentGroup && feImage && displacement && bhCore) {
        // Assegna la texture del buco nero UNA SOLA VOLTA al caricamento!
        feImage.setAttribute("href", getStaticBlackHoleDataURL());

        let isHovered = false;
        let rafPending = false;
        let hoverTween: gsap.core.Timeline | null = null;

        const moveBlackHole = (normX: number, normY: number) => {
          contentGroup.style.setProperty("--bh-x", `${(normX * 100).toFixed(1)}%`);
          contentGroup.style.setProperty("--bh-y", `${(normY * 100).toFixed(1)}%`);
          // Poiché feImage ha width="2" e height="2" (200%) ed il buco nero è al suo centro (1.0, 1.0),
          // per centrarlo su (normX, normY) basta impostare x = normX - 1, y = normY - 1!
          feImage.setAttribute("x", (normX - 1).toFixed(4));
          feImage.setAttribute("y", (normY - 1).toFixed(4));
        };

        imgWrap.addEventListener("mouseenter", (e) => {
          isHovered = true;
          if (hoverTween) hoverTween.kill();

          contentGroup.style.willChange = "transform, filter";
          const rect = imgWrap.getBoundingClientRect();
          const x = (e.clientX - rect.left) / rect.width;
          const y = (e.clientY - rect.top) / rect.height;

          moveBlackHole(x, y);
          gsap.set(contentGroup, { filter: "url(#blackHoleFilter)" });

          hoverTween = gsap.timeline();
          // Nota: con primitiveUnits="objectBoundingBox", scale=0.32 equivale a ~145px di distorsione
          hoverTween
            .to(displacement, { attr: { scale: 0.32 }, duration: 0.55, ease: "expo.out" }, 0)
            .to(bhCore, { opacity: 1, duration: 0.35, ease: "power2.out" }, 0)
            .to(contentGroup, { scale: 1.12, duration: 0.6, ease: "power2.out" }, 0);
        });

        imgWrap.addEventListener(
          "mousemove",
          (e) => {
            if (!isHovered || rafPending) return;
            rafPending = true;

            const clientX = e.clientX;
            const clientY = e.clientY;

            requestAnimationFrame(() => {
              rafPending = false;
              if (!isHovered) return;

              const rect = imgWrap.getBoundingClientRect();
              const x = (clientX - rect.left) / rect.width;
              const y = (clientY - rect.top) / rect.height;

              moveBlackHole(x, y);
            });
          },
          { passive: true },
        );

        imgWrap.addEventListener("mouseleave", () => {
          isHovered = false;
          if (hoverTween) hoverTween.kill();

          hoverTween = gsap.timeline({
            onComplete: () => {
              if (!isHovered) {
                gsap.set(contentGroup, { filter: "none" });
                contentGroup.style.willChange = "auto";
              }
            },
          });

          hoverTween
            .to(displacement, { attr: { scale: 0 }, duration: 0.55, ease: "expo.out" }, 0)
            .to(bhCore, { opacity: 0, duration: 0.35, ease: "power2.out" }, 0)
            .to(contentGroup, { scale: 1, duration: 0.55, ease: "expo.out" }, 0);
        });
      }
    }
  });
}