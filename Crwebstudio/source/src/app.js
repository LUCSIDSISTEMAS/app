/** Navegação, abas acessíveis e movimento progressivo, sem dependências externas. */
(() => {
  'use strict';
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)');
  const desktop = window.matchMedia('(min-width: 1024px)');
  const menu = document.querySelector('.mobile-menu');
  const summary = menu.querySelector('summary');
  const header = document.querySelector('.site-header');
  const navLinks = [...document.querySelectorAll('.desktop-nav a, .mobile-nav a[href^="#"]')];
  const sections = ['inicio', 'sobre', 'solucoes', 'planos', 'contato'].map(id => document.getElementById(id));

  const closeMenu = () => { menu.open = false; };
  menu.querySelectorAll('a').forEach(link => link.addEventListener('click', closeMenu));
  document.addEventListener('click', event => {
    if (menu.open && !menu.contains(event.target)) closeMenu();
  });
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && menu.open) {
      closeMenu();
      summary.focus();
    }
  });

  // Os links das soluções continuam sendo âncoras utilizáveis sem JavaScript.
  const tablist = document.querySelector('.solution-tabs');
  const tabs = [...tablist.querySelectorAll('.solution-tab')];
  const panels = tabs.map(tab => document.querySelector(tab.hash));
  let selectedTab = Math.max(0, panels.findIndex(panel => `#${panel.id}` === window.location.hash));
  tablist.setAttribute('role', 'tablist');
  const setTabOrientation = () => tablist.setAttribute('aria-orientation', desktop.matches ? 'vertical' : 'horizontal');
  setTabOrientation();
  const selectTab = (index, moveFocus = false) => {
    selectedTab = (index + tabs.length) % tabs.length;
    tabs.forEach((tab, item) => {
      const active = item === selectedTab;
      tab.setAttribute('aria-selected', String(active));
      tab.tabIndex = active ? 0 : -1;
      tab.classList.toggle('is-active', active);
      panels[item].hidden = !active;
    });
    if (moveFocus) tabs[selectedTab].focus({ preventScroll: true });
  };
  tabs.forEach((tab, index) => {
    tab.setAttribute('role', 'tab');
    tab.setAttribute('aria-controls', panels[index].id);
    panels[index].setAttribute('role', 'tabpanel');
    tab.addEventListener('click', event => {
      event.preventDefault();
      selectTab(index);
    });
    tab.addEventListener('keydown', event => {
      const nextKey = desktop.matches ? 'ArrowDown' : 'ArrowRight';
      const previousKey = desktop.matches ? 'ArrowUp' : 'ArrowLeft';
      let next;
      if (event.key === nextKey) next = index + 1;
      else if (event.key === previousKey) next = index - 1;
      else if (event.key === 'Home') next = 0;
      else if (event.key === 'End') next = tabs.length - 1;
      else if (event.key === ' ') next = index;
      if (next !== undefined) {
        event.preventDefault();
        selectTab(next, true);
        tabs[selectedTab].scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: 'instant' });
      }
    });
  });
  selectTab(selectedTab);
  document.querySelector('.workspace').classList.add('tabs-ready');
  window.addEventListener('hashchange', () => {
    const index = panels.findIndex(panel => `#${panel.id}` === window.location.hash);
    if (index >= 0) selectTab(index);
  });
  desktop.addEventListener('change', () => {
    if (desktop.matches) closeMenu();
    setTabOrientation();
  });

  // A galeria responde ao teclado e ao gesto horizontal, sem rolagem automática.
  const gallery = document.querySelector('.device-gallery');
  gallery.addEventListener('keydown', event => {
    if (event.target !== gallery || gallery.scrollWidth <= gallery.clientWidth + 1) return;
    if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
    event.preventDefault();
    const distance = gallery.querySelector('.device-example').getBoundingClientRect().width + 24;
    gallery.scrollBy({ left: event.key === 'ArrowRight' ? distance : -distance, behavior: reducedMotion.matches ? 'auto' : 'smooth' });
  });

  let navigationFrame = 0;
  const updateNavigation = () => {
    navigationFrame = 0;
    header.classList.toggle('is-scrolled', window.scrollY > 16);
    let active = 'inicio';
    const line = Math.min(230, window.innerHeight * 0.35);
    sections.forEach(section => { if (section.getBoundingClientRect().top <= line) active = section.id; });
    const end = document.documentElement.scrollHeight - window.innerHeight;
    if (end > 0 && window.scrollY >= end - 32) active = 'contato';
    navLinks.forEach(link => {
      if (link.hash === `#${active}`) link.setAttribute('aria-current', 'location');
      else link.removeAttribute('aria-current');
    });
  };
  const scheduleNavigation = () => {
    if (!navigationFrame) navigationFrame = requestAnimationFrame(updateNavigation);
  };
  window.addEventListener('scroll', scheduleNavigation, { passive: true });
  window.addEventListener('resize', scheduleNavigation, { passive: true });
  window.addEventListener('load', scheduleNavigation, { once: true });
  if (document.fonts) document.fonts.ready.then(scheduleNavigation).catch(() => {});
  updateNavigation();

  const art = document.querySelector('.hero-art');
  const stage = document.querySelector('.art-stage');
  if ('IntersectionObserver' in window) {
    const reveal = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        if (!reducedMotion.matches) entry.target.classList.add('is-visible');
        reveal.unobserve(entry.target);
      });
    }, { threshold: 0.09 });
    document.querySelectorAll('.reveal').forEach(element => reveal.observe(element));
    const motionVisibility = new IntersectionObserver(entries => {
      entries.forEach(entry => entry.target.classList.toggle('is-offscreen', !entry.isIntersecting));
    }, { rootMargin: '80px 0px' });
    document.querySelectorAll('.hero-art, .device-example').forEach(element => motionVisibility.observe(element));
  }

  // A composição responde ao mouse; o conteúdo textual da página fica estável.
  let pointerFrame = 0;
  let pointerX = 0;
  let pointerY = 0;
  const canMove = () => finePointer.matches && !reducedMotion.matches && !document.hidden && !art.contains(document.activeElement);
  const holdArt = () => {
    if (pointerFrame) cancelAnimationFrame(pointerFrame);
    pointerFrame = 0;
  };
  const resetArt = () => {
    holdArt();
    stage.style.setProperty('--tilt-x', '0deg');
    stage.style.setProperty('--tilt-y', '0deg');
  };
  art.addEventListener('pointermove', event => {
    if (!canMove() || event.pointerType === 'touch') return;
    if (event.target instanceof Element && event.target.closest('a, button')) {
      holdArt();
      return;
    }
    pointerX = event.clientX;
    pointerY = event.clientY;
    if (!pointerFrame) pointerFrame = requestAnimationFrame(() => {
      pointerFrame = 0;
      if (!canMove()) return;
      const bounds = art.getBoundingClientRect();
      const x = Math.max(-0.5, Math.min(0.5, (pointerX - bounds.left) / bounds.width - 0.5));
      const y = Math.max(-0.5, Math.min(0.5, (pointerY - bounds.top) / bounds.height - 0.5));
      stage.style.setProperty('--tilt-x', `${(-y * 5).toFixed(2)}deg`);
      stage.style.setProperty('--tilt-y', `${(x * 5).toFixed(2)}deg`);
    });
  });
  art.addEventListener('pointerleave', resetArt);
  art.addEventListener('pointercancel', resetArt);
  art.addEventListener('focusin', resetArt);
  reducedMotion.addEventListener('change', resetArt);
  finePointer.addEventListener('change', resetArt);
  const syncVisibility = () => {
    document.body.classList.toggle('page-inactive', document.hidden);
    if (document.hidden) resetArt();
  };
  document.addEventListener('visibilitychange', syncVisibility);
  syncVisibility();
})();
