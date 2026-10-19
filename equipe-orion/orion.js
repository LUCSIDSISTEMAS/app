'use strict';
(() => {
  const $ = (s, r=document) => r.querySelector(s);
  const $$ = (s, r=document) => Array.from(r.querySelectorAll(s));
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const fine = matchMedia('(hover:hover) and (pointer:fine)');

  const topbar = $('#topbar');
  const menuButton = $('#menuButton');
  const mainNav = $('#mainNav');

  const syncHeader = () => topbar?.classList.toggle('is-scrolled', scrollY > 22);
  addEventListener('scroll', syncHeader, {passive:true});
  syncHeader();

  const setMenu = open => {
    if (!menuButton || !mainNav) return;
    menuButton.setAttribute('aria-expanded', String(open));
    menuButton.setAttribute('aria-label', open ? 'Fechar menu' : 'Abrir menu');
    mainNav.classList.toggle('is-open', open);
  };
  menuButton?.addEventListener('click', () => setMenu(menuButton.getAttribute('aria-expanded') !== 'true'));
  mainNav?.addEventListener('click', e => { if (e.target.closest('a')) setMenu(false); });
  addEventListener('keydown', e => { if (e.key === 'Escape') setMenu(false); });
  addEventListener('click', e => {
    if (!e.target.closest('.topbar')) setMenu(false);
  });
  matchMedia('(min-width:901px)').addEventListener('change', e => { if (e.matches) setMenu(false); });

  if (fine.matches && !reduced.matches) {
    let frame = 0, x = innerWidth/2, y = innerHeight/2;
    addEventListener('pointermove', e => {
      x = e.clientX; y = e.clientY;
      if (frame) return;
      frame = requestAnimationFrame(() => {
        frame = 0;
        document.documentElement.style.setProperty('--mx', x + 'px');
        document.documentElement.style.setProperty('--my', y + 'px');
      });
    }, {passive:true});
  }

  if ('IntersectionObserver' in window && !reduced.matches) {
    const reveal = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-visible');
        reveal.unobserve(entry.target);
      });
    }, {threshold:.09, rootMargin:'0px 0px -7% 0px'});
    $$('[data-reveal]').forEach((el, i) => {
      el.style.animationDelay = ((i % 4) * 65) + 'ms';
      reveal.observe(el);
    });
  } else {
    $$('[data-reveal]').forEach(el => el.classList.add('is-visible'));
  }

  $$('[data-slider]').forEach(slider => {
    const slides = $$('.season-slide', slider);
    const prev = $('[data-prev]', slider);
    const next = $('[data-next]', slider);
    const current = $('.slider-counter strong', slider);
    let index = 0;
    const go = n => {
      index = (n + slides.length) % slides.length;
      slides.forEach((slide, i) => slide.classList.toggle('is-active', i === index));
      if (current) current.textContent = String(index + 1).padStart(2,'0');
    };
    prev?.addEventListener('click', () => go(index - 1));
    next?.addEventListener('click', () => go(index + 1));

    let startX = 0, startY = 0;
    slider.addEventListener('pointerdown', e => {
      if (!e.isPrimary) return;
      startX = e.clientX; startY = e.clientY;
    }, {passive:true});
    slider.addEventListener('pointerup', e => {
      if (!startX && !startY) return;
      const dx = e.clientX - startX, dy = e.clientY - startY;
      startX = startY = 0;
      if (Math.abs(dx) > 45 && Math.abs(dx) > Math.abs(dy)) go(index + (dx < 0 ? 1 : -1));
    }, {passive:true});
    go(0);
  });

  const awardsTrack = $('#awardsTrack');
  const awardsPrev = $('#awardsPrev');
  const awardsNext = $('#awardsNext');
  const awardsProgress = $('#awardsProgress');

  if (awardsTrack) {
    const cards = $$('.award-card', awardsTrack);
    const getStep = () => (cards[0]?.getBoundingClientRect().width || 500) + 18;
    const scrollByCard = dir => awardsTrack.scrollBy({left:getStep()*dir,behavior:reduced.matches?'auto':'smooth'});
    awardsPrev?.addEventListener('click', () => scrollByCard(-1));
    awardsNext?.addEventListener('click', () => scrollByCard(1));

    const paintProgress = () => {
      const max = Math.max(1, awardsTrack.scrollWidth - awardsTrack.clientWidth);
      const ratio = Math.min(1, Math.max(0, awardsTrack.scrollLeft / max));
      const base = 1 / Math.max(1,cards.length);
      awardsProgress?.style.setProperty('transform', 'scaleX(' + Math.min(1, base + ratio*(1-base)) + ')');
    };
    awardsTrack.addEventListener('scroll', paintProgress, {passive:true});
    addEventListener('resize', paintProgress, {passive:true});
    paintProgress();

    let drag = null;
    awardsTrack.addEventListener('pointerdown', e => {
      if (e.pointerType === 'touch' || e.button !== 0) return;
      drag = {x:e.clientX,left:awardsTrack.scrollLeft,id:e.pointerId,moved:false};
      awardsTrack.setPointerCapture(e.pointerId);
      awardsTrack.classList.add('is-dragging');
    });
    awardsTrack.addEventListener('pointermove', e => {
      if (!drag) return;
      const dx = e.clientX - drag.x;
      if (Math.abs(dx) > 4) drag.moved = true;
      awardsTrack.scrollLeft = drag.left - dx;
    });
    const endDrag = e => {
      if (!drag) return;
      try { awardsTrack.releasePointerCapture(drag.id); } catch(_) {}
      drag = null;
      awardsTrack.classList.remove('is-dragging');
    };
    awardsTrack.addEventListener('pointerup', endDrag);
    awardsTrack.addEventListener('pointercancel', endDrag);
    awardsTrack.addEventListener('dragstart', e => e.preventDefault());
  }

  if ('IntersectionObserver' in window) {
    const sections = $$('main section[id]');
    const navLinks = $$('#mainNav a[href^="#"]');
    const spy = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        navLinks.forEach(a => a.setAttribute('aria-current', a.hash === '#' + entry.target.id ? 'true' : 'false'));
      });
    }, {rootMargin:'-35% 0px -55% 0px',threshold:0});
    sections.forEach(s => spy.observe(s));
  }

  $$('a[href^="#"]').forEach(a => {
    a.addEventListener('click', e => {
      const target = $(a.getAttribute('href'));
      if (!target) return;
      e.preventDefault();
      const offset = topbar?.offsetHeight || 70;
      const top = target.getBoundingClientRect().top + scrollY - offset + 2;
      scrollTo({top,behavior:reduced.matches?'auto':'smooth'});
    });
  });
})();