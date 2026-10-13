import gsap from 'gsap';

const root = document.documentElement;

document.addEventListener('click', (e) => {
  const btn = (e.target as Element).closest('[data-theme-toggle]');
  if (!btn) return;

  const next = root.dataset.theme === 'dark' ? 'light' : 'dark';
  root.dataset.theme = next;
  localStorage.setItem('theme', next);

  gsap.fromTo(
    btn.querySelector('[data-theme-icon]'),
    { rotate: -90, scale: 0.5 },
    { rotate: 0, scale: 1, duration: 0.5, ease: 'back.out(2)' },
  );
});