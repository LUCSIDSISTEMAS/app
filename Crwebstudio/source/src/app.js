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
  let syncGalleryMotion = () => {};
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
    syncGalleryMotion();
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

  // Toque nativo no celular; movimento suave e arraste com mouse no computador.
  const gallery = document.querySelector('.device-gallery');
  const galleryItems = [...gallery.querySelectorAll('.device-example')];
  let galleryTarget = null;
  let galleryMaximum = 0;
  let galleryAnimation = 0;
  let galleryLastTime = 0;
  let galleryPhase = 0;
  let galleryDirection = 1;
  let galleryVisible = !('IntersectionObserver' in window);
  let galleryHovered = false;
  let galleryDrag = null;
  let gallerySuppressClickUntil = 0;

  const galleryPositions = () => {
    const bounds = gallery.getBoundingClientRect();
    const left = bounds.left + gallery.clientLeft;
    const maximum = Math.max(0, gallery.scrollWidth - gallery.clientWidth);
    return {
      maximum,
      targets: galleryItems.map(item => {
        const bounds = item.getBoundingClientRect();
        return Math.max(0, Math.min(maximum,
          gallery.scrollLeft + bounds.left - left - (gallery.clientWidth - bounds.width) / 2));
      })
    };
  };
  const holdGallery = () => {
    if (galleryAnimation) cancelAnimationFrame(galleryAnimation);
    galleryAnimation = 0;
    galleryLastTime = 0;
  };
  const alignGalleryMotion = () => {
    if (galleryMaximum <= 2) return;
    const ratio = Math.max(0, Math.min(1, gallery.scrollLeft / galleryMaximum));
    const angle = Math.acos(1 - 2 * ratio);
    galleryPhase = galleryDirection > 0 ? angle : 2 * Math.PI - angle;
  };
  const canAnimateGallery = () => desktop.matches && finePointer.matches
    && !motionIsReduced() && !document.hidden && galleryVisible
    && !galleryHovered && !galleryDrag && !gallery.contains(document.activeElement)
    && galleryMaximum > 2;
  const animateGallery = time => {
    galleryAnimation = 0;
    if (!canAnimateGallery()) { galleryLastTime = 0; return; }
    const elapsed = galleryLastTime ? Math.min((time - galleryLastTime) / 1000, 0.05) : 0;
    galleryLastTime = time;
    // A curva desacelera nas pontas e volta sem duplicar conteúdo ou saltar de posição.
    galleryPhase = (galleryPhase + elapsed * 64 / galleryMaximum) % (2 * Math.PI);
    galleryDirection = galleryPhase <= Math.PI ? 1 : -1;
    gallery.scrollLeft = galleryMaximum * (1 - Math.cos(galleryPhase)) / 2;
    galleryAnimation = requestAnimationFrame(animateGallery);
  };
  syncGalleryMotion = () => {
    if (!canAnimateGallery()) { holdGallery(); return; }
    if (!galleryAnimation) {
      alignGalleryMotion();
      galleryAnimation = requestAnimationFrame(animateGallery);
    }
  };
  const resizeGallery = () => {
    holdGallery();
    galleryTarget = null;
    galleryMaximum = Math.max(0, gallery.scrollWidth - gallery.clientWidth);
    syncGalleryMotion();
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
  };
  gallery.addEventListener('keydown', event => {
    if (event.target !== gallery || gallery.scrollWidth <= gallery.clientWidth + 1) return;
    if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
    event.preventDefault();
    if (event.key === 'Home' || event.key === 'End') {
      galleryTarget = event.key === 'Home' ? 0 : galleryMaximum;
      gallery.scrollTo({ left: galleryTarget, behavior: motionIsReduced() ? 'instant' : 'smooth' });
    } else moveGallery(event.key === 'ArrowRight' ? 1 : -1);
  });
  gallery.addEventListener('scroll', () => {
    if (galleryTarget !== null && Math.abs(gallery.scrollLeft - galleryTarget) <= 2) galleryTarget = null;
  }, { passive: true });
  gallery.addEventListener('pointerenter', event => {
    if (event.pointerType !== 'mouse') return;
    galleryHovered = true;
    syncGalleryMotion();
  });
  gallery.addEventListener('pointerleave', event => {
    if (event.pointerType !== 'mouse') return;
    galleryHovered = false;
    syncGalleryMotion();
  });
  gallery.addEventListener('focusin', syncGalleryMotion);
  gallery.addEventListener('focusout', () => queueMicrotask(syncGalleryMotion));
  gallery.addEventListener('wheel', () => { galleryTarget = null; }, { passive: true });

  gallery.addEventListener('pointerdown', event => {
    galleryTarget = null;
    gallerySuppressClickUntil = 0;
    // O toque continua sob o controle do navegador, inclusive a rolagem vertical.
    if (event.pointerType !== 'mouse' || event.button !== 0 || galleryMaximum <= 2
      || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    galleryDrag = {
      id: event.pointerId, x: event.clientX, y: event.clientY,
      scroll: gallery.scrollLeft, active: false
    };
    holdGallery();
  });
  const finishGalleryDrag = event => {
    if (!galleryDrag || (event && event.pointerId !== galleryDrag.id)) return;
    const { id, active } = galleryDrag;
    galleryDrag = null;
    gallery.classList.remove('is-dragging');
    if (active) gallerySuppressClickUntil = performance.now() + 250;
    if (gallery.hasPointerCapture(id)) gallery.releasePointerCapture(id);
    syncGalleryMotion();
  };
  window.addEventListener('pointermove', event => {
    if (!galleryDrag || event.pointerId !== galleryDrag.id) return;
    if (!(event.buttons & 1)) { finishGalleryDrag(event); return; }
    const distance = event.clientX - galleryDrag.x;
    if (!galleryDrag.active) {
      const vertical = Math.abs(event.clientY - galleryDrag.y);
      if (vertical > 8 && vertical > Math.abs(distance)) { finishGalleryDrag(event); return; }
      if (Math.abs(distance) < 8) return;
      galleryDrag.active = true;
      gallery.classList.add('is-dragging');
      gallery.setPointerCapture(event.pointerId);
    }
    event.preventDefault();
    gallery.scrollLeft = Math.max(0, Math.min(galleryMaximum, galleryDrag.scroll - distance));
  }, { passive: false });
  window.addEventListener('pointerup', finishGalleryDrag);
  window.addEventListener('pointercancel', finishGalleryDrag);
  gallery.addEventListener('lostpointercapture', finishGalleryDrag);
  gallery.addEventListener('dragstart', event => {
    if (galleryDrag) event.preventDefault();
  });
  gallery.addEventListener('click', event => {
    if (event.detail === 0 || performance.now() >= gallerySuppressClickUntil) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    gallerySuppressClickUntil = 0;
  }, true);

  if ('IntersectionObserver' in window) {
    new IntersectionObserver(entries => {
      galleryVisible = entries[0].isIntersecting;
      syncGalleryMotion();
    }, { threshold: 0.1 }).observe(gallery);
  }
  desktop.addEventListener('change', resizeGallery);
  finePointer.addEventListener('change', syncGalleryMotion);
  document.addEventListener('visibilitychange', syncGalleryMotion);
  window.addEventListener('resize', resizeGallery, { passive: true });
  window.addEventListener('load', resizeGallery, { once: true });
  if (document.fonts) document.fonts.ready.then(resizeGallery).catch(() => {});
  if ('ResizeObserver' in window) new ResizeObserver(resizeGallery).observe(gallery);
  resizeGallery();

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

