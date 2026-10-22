'use strict';
(() => {
  const root = document.querySelector('[data-sponsors-marquee]');
  if (!root) return;
  const track = root.querySelector('.sponsors-track');
  const group = root.querySelector('.sponsors-group');
  const button = root.querySelector('.sponsors-motion-toggle');
  if (!track || !group || !button) return;

  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  let duplicate = null;
  let manuallyPaused = false;
  let visible = true;

  const syncPlayback = () => {
    root.classList.toggle('is-paused', manuallyPaused || !visible || document.hidden);
    button.setAttribute('aria-pressed', String(manuallyPaused));
    const label = manuallyPaused ? 'Retomar movimento dos patrocinadores' : 'Pausar movimento dos patrocinadores';
    button.setAttribute('aria-label', label);
    button.title = label;
  };

  const syncSpeed = () => {
    if (duplicate) track.style.setProperty('--sponsor-duration', `${group.getBoundingClientRect().width / 30}s`);
  };

  const configureMotion = () => {
    if (reducedMotion.matches) {
      duplicate?.remove();
      duplicate = null;
      root.classList.remove('is-animated');
      button.hidden = true;
    } else {
      if (!duplicate) {
        duplicate = group.cloneNode(true);
        duplicate.setAttribute('aria-hidden', 'true');
        duplicate.inert = true;
        track.append(duplicate);
      }
      root.classList.add('is-animated');
      button.hidden = false;
      syncSpeed();
    }
    syncPlayback();
  };

  button.addEventListener('click', () => {
    manuallyPaused = !manuallyPaused;
    syncPlayback();
  });
  document.addEventListener('visibilitychange', syncPlayback);
  reducedMotion.addEventListener('change', configureMotion);
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(entries => {
      visible = entries[0].isIntersecting;
      syncPlayback();
    }).observe(root);
  }
  if ('ResizeObserver' in window) new ResizeObserver(syncSpeed).observe(group);
  else window.addEventListener('resize', syncSpeed, {passive: true});
  configureMotion();
})();
