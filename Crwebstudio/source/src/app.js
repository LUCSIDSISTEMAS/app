/** Navegação, abas acessíveis e movimento progressivo, sem dependências externas. */
(() => {
  'use strict';
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)');
  const desktop = window.matchMedia('(min-width: 1024px)');
  const motionButton = document.querySelector('[data-motion-toggle]');
  const motionStatus = document.querySelector('[data-motion-status]');
  const motionStorageKey = 'crwebstudio:reduce-motion';
  let userReducedMotion = false;
  let resetMotion = () => {};
  try { userReducedMotion = window.localStorage.getItem(motionStorageKey) === 'true'; } catch {}
  const motionIsReduced = () => reducedMotion.matches || userReducedMotion;
  const syncMotion = () => {
    const reduced = motionIsReduced();
    document.documentElement.classList.toggle('reduce-motion', reduced);
    if (motionButton) {
      motionButton.hidden = false;
      motionButton.setAttribute('aria-pressed', String(reduced));
      motionButton.disabled = reducedMotion.matches;
    }
    if (motionStatus) {
      motionStatus.hidden = false;
      motionStatus.textContent = reducedMotion.matches
        ? 'Movimento reduzido conforme a preferência do dispositivo.'
        : reduced ? 'Movimentos decorativos reduzidos.'
          : 'Você pode reduzir os movimentos da página.';
    }
    resetMotion();
  };
  motionButton?.addEventListener('click', () => {
    if (reducedMotion.matches) return;
    userReducedMotion = !userReducedMotion;
    try { window.localStorage.setItem(motionStorageKey, String(userReducedMotion)); } catch {}
    syncMotion();
  });
  reducedMotion.addEventListener('change', syncMotion);
  syncMotion();

  const menu = document.querySelector('.mobile-menu');
  const summary = menu.querySelector('summary');
  const header = document.querySelector('.site-header');
  const navLinks = [...document.querySelectorAll('.desktop-nav a, .mobile-nav a[href^="#"]')];
  const sections = ['inicio', 'sobre', 'solucoes', 'exemplos', 'entrega', 'processo', 'planos', 'duvidas', 'contato'].map(id => document.getElementById(id)).filter(Boolean);

  const syncMenuState = () => {
    summary.setAttribute('aria-label', 'Menu de navegação');
    summary.setAttribute('aria-expanded', String(menu.open));
  };
  const closeMenu = () => { menu.open = false; syncMenuState(); };
  menu.addEventListener('toggle', syncMenuState);
  syncMenuState();
  menu.querySelectorAll('a').forEach(link => link.addEventListener('click', closeMenu));
  document.addEventListener('click', event => {
    if (menu.open && !menu.contains(event.target)) closeMenu();
  });
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && menu.open) {
      event.preventDefault();
      closeMenu();
      summary.focus({ preventScroll: true });
    }
  });

  // Os links das soluções continuam sendo âncoras utilizáveis sem JavaScript.
  const tablist = document.querySelector('.solution-tabs');
  const tabs = [...tablist.querySelectorAll('.solution-tab')];
  const panels = tabs.map(tab => document.querySelector(tab.hash));
  let selectedTab = Math.max(0, panels.findIndex(panel => `#${panel.id}` === window.location.hash));
  let traversalHash = null;
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
  const tabState = index => ({ ...(window.history.state || {}), crwebstudioTab: index });
  const updateTabAddress = (index, previousIndex) => {
    const hash = `#${panels[index].id}`;
    if (window.location.hash === hash) return;
    traversalHash = null;
    try {
      // Guarda também a seleção de entradas genéricas, como #solucoes.
      window.history.replaceState(tabState(previousIndex), '');
      // pushState altera o endereço sem deslocar a página para o painel.
      window.history.pushState(tabState(index), '', hash);
    } catch {
      // O painel já está visível antes da navegação nativa de contingência.
      window.location.hash = hash;
    }
  };
  const syncTabFromAddress = () => {
    const addressIndex = panels.findIndex(panel => `#${panel.id}` === window.location.hash);
    const savedIndex = window.history.state?.crwebstudioTab;
    const index = addressIndex >= 0 ? addressIndex
      : Number.isInteger(savedIndex) && savedIndex >= 0 && savedIndex < tabs.length ? savedIndex : -1;
    if (index >= 0) {
      const focusWasInPanel = panels[selectedTab].contains(document.activeElement);
      const focusWasInTabs = tablist.contains(document.activeElement);
      selectTab(index, index !== selectedTab && (focusWasInPanel || focusWasInTabs));
    }
    return addressIndex;
  };
  tabs.forEach((tab, index) => {
    tab.setAttribute('role', 'tab');
    tab.setAttribute('aria-controls', panels[index].id);
    panels[index].setAttribute('role', 'tabpanel');
    tab.addEventListener('click', event => {
      if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      event.preventDefault();
      const previousIndex = selectedTab;
      selectTab(index);
      updateTabAddress(selectedTab, previousIndex);
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
        const previousIndex = selectedTab;
        selectTab(next, true);
        updateTabAddress(selectedTab, previousIndex);
        tabs[selectedTab].scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: 'instant' });
      }
    });
  });
  selectTab(selectedTab);
  try { window.history.replaceState(tabState(selectedTab), ''); } catch {}
  document.querySelector('.workspace').classList.add('tabs-ready');
  // A seleção acontece antes da restauração de posição do histórico.
  window.addEventListener('popstate', () => {
    traversalHash = window.location.hash;
    syncTabFromAddress();
  });
  window.addEventListener('hashchange', () => {
    const fromHistory = traversalHash === window.location.hash;
    traversalHash = null;
    const index = syncTabFromAddress();
    if (index >= 0 && !fromHistory) requestAnimationFrame(() => {
      if (window.location.hash === `#${panels[index].id}`) {
        panels[index].scrollIntoView({ block: 'start', behavior: 'instant' });
      }
    });
  });
  desktop.addEventListener('change', () => {
    if (desktop.matches) closeMenu();
    setTabOrientation();
  });

  // Links profundos chegam a um painel visível, inclusive na primeira abertura.
  const initialPanelIndex = panels.findIndex(panel => `#${panel.id}` === window.location.hash);
  if (initialPanelIndex >= 0) requestAnimationFrame(() => {
    if (window.location.hash === `#${panels[initialPanelIndex].id}`) {
      panels[initialPanelIndex].scrollIntoView({ block: 'start', behavior: 'instant' });
    }
  });

  // Os controles seguem as posições reais dos cartões, em qualquer breakpoint.
  const gallery = document.querySelector('.device-gallery');
  const galleryItems = [...gallery.querySelectorAll('.device-example')];
  const galleryControls = document.querySelector('[data-gallery-controls]');
  const galleryPrevious = document.querySelector('[data-gallery-prev]');
  const galleryNext = document.querySelector('[data-gallery-next]');
  const galleryStatus = document.querySelector('[data-gallery-status]');
  let galleryFrame = 0;
  let galleryTarget = null;
  const galleryPositions = () => {
    const bounds = gallery.getBoundingClientRect();
    const left = bounds.left + gallery.clientLeft;
    const maximum = Math.max(0, gallery.scrollWidth - gallery.clientWidth);
    const items = galleryItems.map(item => item.getBoundingClientRect());
    return {
      left, maximum, items,
      targets: items.map(item => Math.max(0, Math.min(maximum,
        gallery.scrollLeft + item.left - left - (gallery.clientWidth - item.width) / 2)))
    };
  };
  const updateGallery = () => {
    galleryFrame = 0;
    const { left, maximum, items } = galleryPositions();
    const canScroll = maximum > 2;
    if (galleryControls) {
      if (!canScroll && galleryControls.contains(document.activeElement)) gallery.focus({ preventScroll: true });
      galleryControls.hidden = !canScroll;
    }
    if (galleryPrevious) {
      galleryPrevious.hidden = !canScroll;
      galleryPrevious.disabled = !canScroll || gallery.scrollLeft <= 2;
    }
    if (galleryNext) {
      galleryNext.hidden = !canScroll;
      galleryNext.disabled = !canScroll || gallery.scrollLeft >= maximum - 2;
    }
    if (galleryTarget !== null && Math.abs(gallery.scrollLeft - galleryTarget) <= 2) galleryTarget = null;
    if (galleryStatus && items.length) {
      const right = left + gallery.clientWidth;
      let visible = items.flatMap((item, index) => item.left >= left - 2 && item.right <= right + 2 ? [index] : []);
      if (!visible.length) {
        const center = (left + right) / 2;
        const nearest = items.reduce((best, item, index) =>
          Math.abs((item.left + item.right) / 2 - center) < Math.abs((items[best].left + items[best].right) / 2 - center) ? index : best, 0);
        visible = [nearest];
      }
      const first = visible[0] + 1;
      const last = visible[visible.length - 1] + 1;
      const label = first === last ? `${first} de ${items.length}` : `${first}–${last} de ${items.length}`;
      if (galleryStatus.textContent !== label) galleryStatus.textContent = label;
    }
  };
  const scheduleGallery = () => {
    if (!galleryFrame) galleryFrame = requestAnimationFrame(updateGallery);
  };
  const moveGallery = direction => {
    const { maximum, targets } = galleryPositions();
    if (maximum <= 2) return;
    const current = galleryTarget === null ? gallery.scrollLeft : galleryTarget;
    const target = direction > 0
      ? targets.find(position => position > current + 2) ?? maximum
      : [...targets].reverse().find(position => position < current - 2) ?? 0;
    galleryTarget = target;
    gallery.scrollTo({ left: target, behavior: motionIsReduced() ? 'instant' : 'smooth' });
    scheduleGallery();
  };
  galleryPrevious?.addEventListener('click', () => moveGallery(-1));
  galleryNext?.addEventListener('click', () => moveGallery(1));
  gallery.addEventListener('keydown', event => {
    if (event.target !== gallery || gallery.scrollWidth <= gallery.clientWidth + 1) return;
    if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
    event.preventDefault();
    moveGallery(event.key === 'ArrowRight' ? 1 : -1);
  });
  gallery.addEventListener('scroll', scheduleGallery, { passive: true });
  gallery.addEventListener('pointerdown', () => { galleryTarget = null; }, { passive: true });
  gallery.addEventListener('wheel', () => { galleryTarget = null; }, { passive: true });
  window.addEventListener('resize', () => { galleryTarget = null; scheduleGallery(); }, { passive: true });
  window.addEventListener('load', scheduleGallery, { once: true });
  if (document.fonts) document.fonts.ready.then(scheduleGallery).catch(() => {});
  if ('ResizeObserver' in window) new ResizeObserver(scheduleGallery).observe(gallery);
  updateGallery();

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
        if (!motionIsReduced()) entry.target.classList.add('is-visible');
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
  const canMove = () => finePointer.matches && !motionIsReduced() && !document.hidden && !art.contains(document.activeElement);
  const holdArt = () => {
    if (pointerFrame) cancelAnimationFrame(pointerFrame);
    pointerFrame = 0;
  };
  const resetArt = () => {
    holdArt();
    stage.style.setProperty('--tilt-x', '0deg');
    stage.style.setProperty('--tilt-y', '0deg');
  };
  resetMotion = resetArt;
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
  finePointer.addEventListener('change', resetArt);
  const syncVisibility = () => {
    document.body.classList.toggle('page-inactive', document.hidden);
    if (document.hidden) resetArt();
  };
  document.addEventListener('visibilitychange', syncVisibility);
  syncVisibility();
})();

