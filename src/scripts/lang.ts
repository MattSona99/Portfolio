const root = document.documentElement;

document.addEventListener('click', (e) => {
  if (!(e.target as Element).closest('[data-lang-toggle]')) return;

  const next = root.lang === 'it' ? 'en' : 'it';
  root.lang = next;
  localStorage.setItem('lang', next);
});