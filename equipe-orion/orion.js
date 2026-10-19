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
  addEventListener('click', e => { if (!e.target.closest('.topbar')) setMenu(false); });
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

    $$('.partner-v2-card').forEach(card => {
      card.addEventListener('pointermove', e => {
        const r = card.getBoundingClientRect();
        card.style.setProperty('--px', (e.clientX-r.left)+'px');
        card.style.setProperty('--py', (e.clientY-r.top)+'px');
      }, {passive:true});
    });
  }

  if ('IntersectionObserver' in window && !reduced.matches) {
    const reveal = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-visible');
        reveal.unobserve(entry.target);
      });
    }, {threshold:.09, rootMargin:'0px 0px -6% 0px'});
    $$('[data-reveal]').forEach((el, i) => {
      el.style.animationDelay = ((i % 3) * 55) + 'ms';
      reveal.observe(el);
    });

    const sectionObserver = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) entry.target.classList.add('section-in');
      });
    }, {threshold:.12});
    $$('.manifesto,.seasons,.awards,.partners-v2,.contact').forEach(s => sectionObserver.observe(s));
  } else {
    $$('[data-reveal]').forEach(el => el.classList.add('is-visible'));
    $$('.manifesto,.seasons,.awards,.partners-v2,.contact').forEach(s => s.classList.add('section-in'));
  }

  $$('[data-slider]').forEach(slider => {
    const slides = $$('.season-slide', slider);
    const dots = $$('[data-slide-dot]', slider);
    const current = $('.slider-counter strong', slider);
    let index = 0, timer = 0, hovering = false, interacting = false;

    const schedule = () => {
      clearTimeout(timer);
      if (reduced.matches || hovering || interacting || document.hidden) return;
      timer = setTimeout(() => go(index + 1, false), 4300);
    };
    const go = (n, manual=true) => {
      index = (n + slides.length) % slides.length;
      slides.forEach((slide, i) => slide.classList.toggle('is-active', i === index));
      dots.forEach((dot, i) => {
        dot.classList.toggle('is-active', i === index);
        dot.setAttribute('aria-current', String(i === index));
      });
      if (current) current.textContent = String(index + 1).padStart(2,'0');
      if (manual) interacting = true;
      schedule();
      if (manual) setTimeout(() => { interacting = false; schedule(); }, 5500);
    };
    dots.forEach((dot,i) => dot.addEventListener('click', () => go(i,true)));

    slider.addEventListener('mouseenter', () => { hovering = true; schedule(); });
    slider.addEventListener('mouseleave', () => { hovering = false; schedule(); });

    let startX = 0, startY = 0;
    slider.addEventListener('pointerdown', e => {
      if (!e.isPrimary) return;
      startX = e.clientX; startY = e.clientY;
      interacting = true; schedule();
    }, {passive:true});
    slider.addEventListener('pointerup', e => {
      const dx = e.clientX - startX, dy = e.clientY - startY;
      startX = startY = 0;
      if (Math.abs(dx) > 45 && Math.abs(dx) > Math.abs(dy)) go(index + (dx < 0 ? 1 : -1), true);
      setTimeout(() => { interacting = false; schedule(); }, 4200);
    }, {passive:true});
    document.addEventListener('visibilitychange', schedule);
    go(0,false);
  });

  const awardsTrack = $('#awardsTrack');
  const awardsProgress = $('#awardsProgress');

  if (awardsTrack) {
    const cards = $$('.award-card', awardsTrack);

    const paintProgress = () => {
      const max = Math.max(1, awardsTrack.scrollWidth - awardsTrack.clientWidth);
      const ratio = Math.min(1, Math.max(0, awardsTrack.scrollLeft / max));
      const base = 1 / Math.max(1,cards.length);
      awardsProgress?.style.setProperty('transform', 'scaleX(' + Math.min(1, base + ratio*(1-base)) + ')');

      const center = awardsTrack.scrollLeft + awardsTrack.clientWidth/2;
      cards.forEach(card => {
        const cardCenter = card.offsetLeft + card.offsetWidth/2;
        card.classList.toggle('is-near', Math.abs(cardCenter-center) < card.offsetWidth*.72);
      });
    };
    awardsTrack.addEventListener('scroll', paintProgress, {passive:true});
    addEventListener('resize', paintProgress, {passive:true});
    paintProgress();

    let drag = null;
    awardsTrack.addEventListener('pointerdown', e => {
      if (e.pointerType === 'touch' || e.button !== 0) return;
      drag = {x:e.clientX,left:awardsTrack.scrollLeft,id:e.pointerId};
      awardsTrack.setPointerCapture(e.pointerId);
      awardsTrack.classList.add('is-dragging');
    });
    awardsTrack.addEventListener('pointermove', e => {
      if (!drag) return;
      awardsTrack.scrollLeft = drag.left - (e.clientX - drag.x);
    });
    const endDrag = () => {
      if (!drag) return;
      drag = null;
      awardsTrack.classList.remove('is-dragging');
    };
    awardsTrack.addEventListener('pointerup', endDrag);
    awardsTrack.addEventListener('pointercancel', endDrag);
    awardsTrack.addEventListener('dragstart', e => e.preventDefault());
  }

  if (!reduced.matches) {
    const parallaxItems = $$('.season-main-photo img,.season-side-photo img,.identity-photo img');
    let parallaxFrame = 0;
    const updateParallax = () => {
      parallaxFrame = 0;
      const vh = innerHeight;
      parallaxItems.forEach(img => {
        const host = img.parentElement.getBoundingClientRect();
        if (host.bottom < 0 || host.top > vh) return;
        const center = host.top + host.height/2;
        const delta = (center - vh/2) / vh;
        img.style.setProperty('--photo-shift', (delta * -18).toFixed(2) + 'px');
      });
    };
    addEventListener('scroll', () => {
      if (!parallaxFrame) parallaxFrame=requestAnimationFrame(updateParallax);
    }, {passive:true});
    addEventListener('resize', updateParallax, {passive:true});
    updateParallax();
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