/** Navegação, abas acessíveis e movimento progressivo, sem dependências externas. */
(() => {
  'use strict';
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const desktop = window.matchMedia('(min-width: 1024px)');
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

  // Rolagem nativa, sem carrossel automático ou captura global do mouse.
  const gallery = document.querySelector('.device-gallery');
  gallery.addEventListener('keydown', event => {
    if (event.target !== gallery) return;
    const maximum = gallery.scrollWidth - gallery.clientWidth;
    if (maximum <= 2 || !['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
    event.preventDefault();
    const step = gallery.querySelector('.device-example').getBoundingClientRect().width + 24;
    const left = event.key === 'Home' ? 0 : event.key === 'End' ? maximum
      : gallery.scrollLeft + (event.key === 'ArrowRight' ? step : -step);
    gallery.scrollTo({ left, behavior: reducedMotion.matches ? 'auto' : 'smooth' });
  });

  let navigationFrame = 0;
  let activeSection = '';
  let scrolled = false;
  const updateNavigation = () => {
    navigationFrame = 0;
    const nextScrolled = window.scrollY > 16;
    if (nextScrolled !== scrolled) { scrolled = nextScrolled; header.classList.toggle('is-scrolled', scrolled); }
    let active = 'inicio';
    const line = Math.min(230, window.innerHeight * 0.35);
    sections.forEach(section => { if (section.getBoundingClientRect().top <= line) active = section.id; });
    const end = document.documentElement.scrollHeight - window.innerHeight;
    if (end > 0 && window.scrollY >= end - 32) active = 'contato';
    if (active === activeSection) return;
    activeSection = active;
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

})();
