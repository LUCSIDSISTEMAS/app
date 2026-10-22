'use strict';
(() => {
  const preference = matchMedia('(prefers-reduced-motion: reduce)');
  const playing = new Set();
  let observer;

  // Content stays visible without JavaScript, observers or animation support.
  const reveal = (element, delay = 0) => {
    if (preference.matches || typeof element.animate !== 'function') return;
    const animation = element.animate([
      { opacity: 0.25, transform: 'translateY(18px)' },
      { opacity: 1, transform: 'translateY(0)' }
    ], { duration: 560, delay, easing: 'cubic-bezier(.2,.65,.3,1)', fill: 'backwards' });
    playing.add(animation);
    animation.finished.then(() => playing.delete(animation), () => playing.delete(animation));
  };

  if (!preference.matches && 'IntersectionObserver' in window) {
    observer = new IntersectionObserver(entries => {
      const visible = entries.filter(entry => entry.isIntersecting);
      visible.forEach((entry, index) => {
        observer.unobserve(entry.target);
        reveal(entry.target, Math.min(index, 3) * 60);
      });
    }, { threshold: 0.08 });
    document.querySelectorAll([
      '.hero-copy', '.hero-photo', '.hero > h1', '.hero > p', '.hero-bottom',
      '.section-heading', '.team-photos > figure', '.team-story',
      '.project-copy', '.project-photo', '.award-card', '.contact-intro',
      '.social-links > a', '.photo-card', '.video-card', '.testimonial-card', '.publication-card'
    ].join(',')).forEach(element => observer.observe(element));
  }
  preference.addEventListener('change', () => {
    if (!preference.matches) return;
    observer?.disconnect();
    playing.forEach(animation => animation.cancel());
    playing.clear();
  });

  const header = document.querySelector('.site-header');
  if (header) {
    let scheduled = false;
    const updateHeader = () => {
      header.classList.toggle('is-scrolled', window.scrollY > 12);
      scheduled = false;
    };
    window.addEventListener('scroll', () => {
      if (!scheduled) { scheduled = true; requestAnimationFrame(updateHeader); }
    }, { passive: true });
    updateHeader();
  }
})();
