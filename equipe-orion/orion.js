'use strict';

(() => {
  const assets = Object.create(null);
  document.querySelectorAll('img[data-embedded-key]').forEach(img => {
    const key = img.dataset.embeddedKey;
    if (assets[key]) return;
    const value = img.getAttribute('src');
    assets[key] = value;
    try {
      const match = /^data:([^;]+);base64,(.+)$/.exec(value);
      if (!match) return;
      const raw = atob(match[2]);
      const bytes = Uint8Array.from(raw, c => c.charCodeAt(0));
      assets[key] = URL.createObjectURL(new Blob([bytes], {type:match[1]}));
    } catch (_) { /* Data URI remains a usable offline fallback. */ }
  });
  const node = document.getElementById('orionMedia');
  const media = JSON.parse(node.textContent);
  Object.values(media).forEach(items => items.forEach(item => {
    ['src','contextSrc'].forEach(prop => {
      if (item[prop]?.startsWith('embedded:')) item[prop] = assets[item[prop].slice(9)];
    });
  }));
  node.textContent = JSON.stringify(media);
  document.querySelectorAll('a[data-embedded-href]').forEach(a => {
    if (assets[a.dataset.embeddedHref]) a.href = assets[a.dataset.embeddedHref];
  });
})();

/* Equipe Órion — vanilla JavaScript. Works locally and on static hosting. */
(() => {
  'use strict';
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));
  const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const root = document.documentElement;
  const reduced = () => motion.matches || root.dataset.motion === 'off';
  const effects = $('#motionToggle');
  let effectsOff = false;
  try { effectsOff = localStorage.getItem('orion-effects-off') === '1'; } catch (_) { /* local files may restrict storage */ }
  const applyEffects = () => {
    root.dataset.motion = effectsOff || motion.matches ? 'off' : 'auto';
    if (effects) {
      const off = reduced();
      effects.setAttribute('aria-pressed', String(off));
      effects.setAttribute('aria-label', motion.matches ? 'Movimento reduzido nas configurações do dispositivo' : off ? 'Ativar efeitos visuais' : 'Pausar efeitos visuais');
      effects.title = motion.matches ? 'Movimento reduzido pelo dispositivo' : off ? 'Ativar efeitos visuais' : 'Pausar efeitos visuais';
    }
    document.dispatchEvent(new CustomEvent('orion:effects', {detail: {reduced: reduced()}}));
  };
  applyEffects();
  effects?.addEventListener('click', () => {
    if (motion.matches) return;
    effectsOff = !effectsOff;
    try { localStorage.setItem('orion-effects-off', effectsOff ? '1' : '0'); } catch (_) {}
    applyEffects();
  });
  motion.addEventListener('change', applyEffects);
  let dialogOpen = false;
  const visibilityListeners = [];
  const notify = () => visibilityListeners.forEach(fn => fn());

  // The approved intro remains CSS-driven. A failure here never hides site content.
  const intro = $('#intro');
  const revealStart = () => document.body.classList.add('site-ready');
  window.setTimeout(revealStart, reduced() ? 0 : 1180);
  if (intro) {
    intro.addEventListener('animationend', event => {
      if (event.target === intro && event.animationName === 'introExit') intro.remove();
    });
    window.setTimeout(() => { intro.remove(); revealStart(); }, 2200);
  }

  // Responsive navigation with escape, outside click and focus-out handling.
  const menu = $('#navLinks');
  const toggle = $('#menuToggle');
  const setMenu = (open, returnFocus = false) => {
    if (!menu || !toggle) return;
    menu.classList.toggle('open', open);
    toggle.setAttribute('aria-expanded', String(open));
    toggle.setAttribute('aria-label', open ? 'Fechar menu' : 'Abrir menu');
    if (returnFocus) toggle.focus();
  };
  toggle?.addEventListener('click', () => setMenu(toggle.getAttribute('aria-expanded') !== 'true'));
  menu?.addEventListener('click', event => { if (event.target.closest('a')) setMenu(false); });
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && toggle?.getAttribute('aria-expanded') === 'true') setMenu(false, true);
  });
  document.addEventListener('click', event => { if (!event.target.closest('.nav')) setMenu(false); });
  $('.nav')?.addEventListener('focusout', event => {
    if (event.relatedTarget && !event.currentTarget.contains(event.relatedTarget)) setMenu(false);
  });
  const header = $('.site-header');
  const updateHeader = () => header?.classList.toggle('scrolled', window.scrollY > 24);
  window.addEventListener('scroll', updateHeader, { passive: true }); updateHeader();
  window.matchMedia('(min-width:1025px)').addEventListener('change', e => { if (e.matches) setMenu(false); });

  // Progressive enhancement: reveal items are hidden only when an observer exists.
  if ('IntersectionObserver' in window && !reduced()) {
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) { entry.target.classList.add('is-visible'); observer.unobserve(entry.target); }
      });
    }, { threshold: .06, rootMargin: '0px 0px -18px 0px' });
    $$('[data-reveal]').forEach(el => { el.classList.add('will-reveal'); observer.observe(el); });
  }
  document.addEventListener('orion:effects', event => {
    if (event.detail.reduced) {
      $$('.will-reveal').forEach(el => el.classList.add('is-visible'));
      intro?.remove();
      revealStart();
    }
  });
  // Decorative animations only run while visible. Pointer glow never moves the card itself.
  const finePointer = window.matchMedia('(hover:hover) and (pointer:fine)');
  $$('[data-spotlight]').forEach(card => {
    let queued = false, x = 0, y = 0;
    card.addEventListener('pointermove', event => {
      if (reduced() || !finePointer.matches) return;
      const rect = card.getBoundingClientRect();
      x = event.clientX - rect.left; y = event.clientY - rect.top;
      if (!queued) {
        queued = true;
        requestAnimationFrame(() => {
          queued = false;
          card.style.setProperty('--light-x', `${x}px`);
          card.style.setProperty('--light-y', `${y}px`);
        });
      }
    }, {passive:true});
  });
  const decor = $$('.decor-motion');
  if ('IntersectionObserver' in window) {
    const decorObserver = new IntersectionObserver(entries => {
      entries.forEach(entry => entry.target.classList.toggle('in-view', entry.isIntersecting));
    });
    decor.forEach(el => decorObserver.observe(el));
  } else decor.forEach(el => el.classList.add('in-view'));
  const checkVisibility = () => { root.dataset.pageHidden = String(document.hidden); };
  document.addEventListener('visibilitychange', checkVisibility); checkVisibility();

  if ('IntersectionObserver' in window) {
    const sectionObserver = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        $$('.nav-links a[href^="#"]').forEach(a => {
          if (a.getAttribute('href') === `#${entry.target.id}`) a.setAttribute('aria-current', 'location');
          else a.removeAttribute('aria-current');
        });
      });
    }, { rootMargin: '-18% 0px -55% 0px', threshold: 0 });
    const navTargets = new Set($$('.nav-links a[href^="#"]').map(a => a.hash.slice(1)));
    $$('section[id],header.hero[id]').filter(el => navTargets.has(el.id)).forEach(el => sectionObserver.observe(el));
  }

  // Hero carousel: no arrows; dots, swipe, keyboard and explicit rotation control.
  const moments = $('#moments');
  if (moments) {
    const stage = $('#momentStage');
    const cards = $$('.moment-card', moments);
    const dots = $$('.moment-dot', moments);
    const rotation = null;
    const status = $('#momentsStatus');
    let current = 0, timer = 0, hovered = false, visible = true;
    let userPaused = false;
    let pointer = null, suppressClick = false;
    const paintControl = () => {
      if (!rotation) return;
      rotation.dataset.playing = String(!userPaused);
      rotation.setAttribute('aria-label', userPaused ? 'Reproduzir troca automática das fotos' : 'Pausar troca automática das fotos');
      const label = $('.control-label', rotation);
      if (label) label.textContent = userPaused ? 'Reproduzir' : 'Pausar';
    };
    let progressAnimation = null;
    const sync = () => {
      clearTimeout(timer);
      paintControl();
      // Native compositor animation mirrors the actual three-second timer.
      // Pausing, focusing or leaving the screen cancels both together.
      if (progressAnimation) { progressAnimation.cancel(); progressAnimation = null; }
      const progress = $('.dot-bar i', dots[current]);
      const playing = !userPaused && !hovered && visible && !document.hidden && !dialogOpen;
      moments.dataset.rotating = String(playing);
      if (playing) {
        if (progress && typeof progress.animate === 'function' && !reduced()) {
          progressAnimation = progress.animate([
            {transform:'scaleX(0)'}, {transform:'scaleX(1)'}
          ], {duration:2500, easing:'linear', fill:'forwards'});
        }
        timer = window.setTimeout(() => { go(current + 1, false); }, 2500);
      }
    };
    const go = (index, manual = true) => {
      current = (index + cards.length) % cards.length;
      cards.forEach((card, i) => {
        const offset = (i - current + cards.length) % cards.length;
        card.dataset.pos = offset === 0 ? 'center' : offset === 1 ? 'right' : 'left';
        card.setAttribute('aria-hidden', String(offset !== 0));
        card.inert = offset !== 0;
        $$('a', card).forEach(a => { a.tabIndex = offset === 0 ? 0 : -1; });
      });
      dots.forEach((dot, i) => dot.setAttribute('aria-pressed', String(i === current)));
      const pageNumber = $('#momentPage');
      if (pageNumber) pageNumber.textContent = String(current + 1).padStart(2, '0');
      if (manual) {
        userPaused = true;
        status.textContent = `Foto ${current + 1} de ${cards.length}. ${cards[current].dataset.caption}`;
      }
      sync();
    };
    dots.forEach((dot, i) => dot.addEventListener('click', () => go(i)));
    stage.addEventListener('mouseenter', () => { hovered = true; sync(); });
    stage.addEventListener('mouseleave', () => { hovered = false; sync(); });
    moments.addEventListener('focusin', event => {
      // Leaving the control focused is allowed while the user explicitly presses Play.
      if (!rotation.contains(event.target)) { userPaused = true; sync(); }
    });
    stage.addEventListener('keydown', event => {
      if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') {
        event.preventDefault(); go(current + (event.key === 'ArrowRight' ? 1 : -1));
        $('.moment-photo', cards[current]).focus({ preventScroll: true });
      }
    });
    stage.addEventListener('pointerdown', event => {
      if (!event.isPrimary || (event.pointerType === 'mouse' && event.button !== 0)) return;
      pointer = { x: event.clientX, y: event.clientY }; suppressClick = false;
    });
    stage.addEventListener('pointerup', event => {
      if (!pointer) return;
      const dx = event.clientX - pointer.x, dy = event.clientY - pointer.y;
      pointer = null;
      if (Math.abs(dx) > 42 && Math.abs(dx) > Math.abs(dy)) {
        suppressClick = true; go(current + (dx < 0 ? 1 : -1));
        setTimeout(() => { suppressClick = false; }, 0);
      }
    });
    stage.addEventListener('pointercancel', () => { pointer = null; });
    stage.addEventListener('click', event => {
      if (suppressClick) { event.preventDefault(); event.stopPropagation(); }
    }, true);
    stage.addEventListener('dragstart', event => event.preventDefault());
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(entries => { visible = entries[0].isIntersecting; sync(); }, { threshold: .1 }).observe(moments);
    }
    motion.addEventListener('change', event => { if (event.matches) userPaused = true; sync(); });
    document.addEventListener('orion:effects', event => { if (event.detail.reduced) userPaused = true; sync(); });
    visibilityListeners.push(sync);
    go(0, false);
  }

  // Continuous Copa gallery. Native scroll provides touch and no-JS navigation.
  const viewport = $('#copaViewport');
  const track = $('#copaTrack');
  if (viewport && track) {
    const originals = $$('.copa-card', track);
    originals.forEach(card => {
      const copy = card.cloneNode(true);
      copy.removeAttribute('id');
      $$('[id]', copy).forEach(el => el.removeAttribute('id'));
      copy.dataset.copy = 'true'; copy.setAttribute('aria-hidden', 'true');
      $$('a,button', copy).forEach(el => { el.tabIndex = -1; });
      track.appendChild(copy);
    });
    const control = $('#copaPause');
    const viewControl = $('#copaView');
    let gridMode = false, savedScroll = 0, savedPaused = reduced();
    let userPaused = reduced(), hovered = false, visible = false;
    let frame = 0, last = 0, span = 0, position = 0, drag = null, suppressClick = false;
    const measure = () => {
      if (gridMode) return;
      const firstCopy = track.children[originals.length];
      if (firstCopy && originals.length) {
        const old = span;
        span = firstCopy.offsetLeft - originals[0].offsetLeft;
        if (old && span) viewport.scrollLeft = (viewport.scrollLeft % old) * span / old;
        position = viewport.scrollLeft;
      }
    };
    const paintControl = () => {
      if (!control) return;
      control.dataset.playing = String(!userPaused);
      control.setAttribute('aria-label', userPaused ? 'Reproduzir movimento automático da Copa' : 'Pausar movimento automático da Copa');
      const label = $('.control-label', control);
      if (label) label.textContent = userPaused ? 'Reproduzir galeria' : 'Pausar galeria';
    };
    const running = () => !gridMode && !userPaused && !hovered && visible && !document.hidden && !dialogOpen && !drag;
    const tick = time => {
      if (!running()) { frame = 0; last = 0; return; }
      if (last && span > 0) {
        const delta = Math.min(time - last, 60);
        position += delta * .060;
        if (position >= span) position -= span;
        viewport.scrollLeft = position;
      }
      last = time; frame = requestAnimationFrame(tick);
    };
    const sync = () => {
      paintControl();
      if (!running()) { cancelAnimationFrame(frame); frame = 0; last = 0; }
      else if (!frame) { last = 0; position = viewport.scrollLeft; frame = requestAnimationFrame(tick); }
    };
    viewControl?.addEventListener('click', () => {
      if (!gridMode) {
        savedScroll = viewport.scrollLeft;
        savedPaused = userPaused;
        gridMode = true;
        userPaused = true;
        sync();
        viewport.classList.add('is-grid');
        viewport.scrollLeft = 0;
      } else {
        gridMode = false;
        viewport.classList.remove('is-grid');
        measure();
        viewport.scrollLeft = savedScroll;
        position = savedScroll;
        userPaused = savedPaused || reduced();
      }
      control.hidden = gridMode;
      viewControl.setAttribute('aria-pressed', String(gridMode));
      $('span', viewControl).textContent = gridMode ? 'Ver em movimento' : 'Ver em grade';
      const hint = $('#galleryHint');
      if (hint) hint.textContent = gridMode
        ? 'Todas as 17 fotografias. Selecione uma imagem para ver de perto.'
        : 'Arraste para explorar. Toque ou clique em uma foto para ampliar.';
      sync();
    });
    control.addEventListener('click', () => { userPaused = !userPaused; sync(); });
    viewport.addEventListener('mouseenter', () => { hovered = true; sync(); });
    viewport.addEventListener('mouseleave', () => { hovered = false; sync(); });
    viewport.addEventListener('focusin', () => { userPaused = true; sync(); });
    viewport.addEventListener('keydown', event => {
      if (gridMode) return;
      if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') {
        event.preventDefault(); userPaused = true; sync();
        viewport.scrollBy({ left: (event.key === 'ArrowRight' ? 1 : -1) * (originals[0]?.offsetWidth + 20 || 270), behavior: reduced() ? 'auto' : 'smooth' });
      }
    });
    viewport.addEventListener('pointerdown', event => {
      if (gridMode) return;
      if (!event.isPrimary || (event.pointerType === 'mouse' && event.button !== 0)) return;
      suppressClick = false; userPaused = true;
      drag = { x: event.clientX, y: event.clientY, left: viewport.scrollLeft, mouse: event.pointerType === 'mouse', id: event.pointerId, moved: false };
      sync();
    });
    viewport.addEventListener('pointermove', event => {
      if (!drag) return;
      const dx = event.clientX - drag.x, dy = event.clientY - drag.y;
      if (Math.abs(dx) > 8 && Math.abs(dx) > Math.abs(dy)) {
        drag.moved = true; suppressClick = true;
        if (drag.mouse) {
          if (!viewport.hasPointerCapture(event.pointerId)) viewport.setPointerCapture(event.pointerId);
          viewport.classList.add('dragging'); viewport.scrollLeft = drag.left - dx;
        }
      }
    });
    const endDrag = event => {
      if (!drag) return;
      if (viewport.hasPointerCapture(event.pointerId)) viewport.releasePointerCapture(event.pointerId);
      drag = null; viewport.classList.remove('dragging'); sync();
      setTimeout(() => { suppressClick = false; }, 0);
    };
    viewport.addEventListener('pointerup', endDrag);
    viewport.addEventListener('pointercancel', endDrag);
    viewport.addEventListener('click', event => {
      if (suppressClick) { event.preventDefault(); event.stopPropagation(); }
    }, true);
    viewport.addEventListener('dragstart', event => event.preventDefault());
    viewport.addEventListener('wheel', () => { userPaused = true; sync(); }, { passive: true });
    viewport.addEventListener('scroll', () => {
      if (!gridMode && span && !drag && viewport.scrollLeft >= span) viewport.scrollLeft -= span;
    }, { passive: true });
    if ('ResizeObserver' in window) new ResizeObserver(measure).observe(viewport);
    else window.addEventListener('resize', measure);
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(entries => { visible = entries[0].isIntersecting; sync(); }, { threshold: .1 }).observe(viewport);
    } else visible = true;
    motion.addEventListener('change', event => { if (event.matches) userPaused = true; sync(); });
    document.addEventListener('orion:effects', event => { if (event.detail.reduced) userPaused = true; sync(); });
    visibilityListeners.push(sync);
    measure(); sync();
  }

  // Shared native dialog: full-size photographs and project details, keyboard and swipe.
  const dialog = $('#mediaDialog');
  let media = {};
  try { media = JSON.parse($('#orionMedia')?.textContent || '{}'); }
  catch (error) { console.warn('Não foi possível ler a galeria.', error); }
  if (dialog && typeof dialog.showModal === 'function') {
    const image = $('#dialogImage'), title = $('#dialogTitle'), description = $('#dialogDescription');
    const category = $('#dialogCategory'), counter = $('#dialogCounter');
    const contextToggle = $('#dialogContext'), openSource = $('#dialogSource');
    const previous = $('#dialogPrev'), next = $('#dialogNext'), loading = $('#dialogLoading'), error = $('#dialogError');
    let group = 'moments', index = 0, showContext = false, invoker = null, touch = null;
    const thumbnailStrip = $('#dialogThumbs');
    let thumbnailGroup = '';
    const syncThumbnails = () => {
      if (!thumbnailStrip) return;
      const list = media[group] || [];
      thumbnailStrip.hidden = list.length < 2;
      if (thumbnailGroup !== group) {
        thumbnailStrip.replaceChildren();
        list.forEach((item, i) => {
          const button = document.createElement('button');
          button.type = 'button'; button.className = 'dialog-thumb';
          button.setAttribute('aria-label', `Ver fotografia ${i + 1}: ${item.title}`);
          const img = document.createElement('img');
          const preview = $(`a[data-gallery="${group}"][data-photo="${i}"] img`);
          img.src = preview?.getAttribute('src') || item.src;
          img.alt = ''; img.loading = 'lazy'; img.decoding = 'async';
          button.appendChild(img);
          button.addEventListener('click', () => { index = i; showContext = false; render(); });
          thumbnailStrip.appendChild(button);
        });
        thumbnailGroup = group;
      }
      const focusInStrip = thumbnailStrip.contains(document.activeElement);
      const buttons = $$('.dialog-thumb', thumbnailStrip);
      buttons.forEach((button, i) => {
        button.setAttribute('aria-pressed', String(i === index));
        button.tabIndex = i === index ? 0 : -1;
      });
      const active = buttons[index];
      if (focusInStrip) active?.focus({preventScroll:true});
      requestAnimationFrame(() => {
        if (!active || !dialog.open) return;
        const bounds = thumbnailStrip.getBoundingClientRect();
        const rect = active.getBoundingClientRect();
        if (rect.left < bounds.left || rect.right > bounds.right) {
          thumbnailStrip.scrollLeft += rect.left - bounds.left - bounds.width / 2 + rect.width / 2;
        }
      });
    };
    const render = () => {
      const list = media[group] || [], item = list[index]; if (!item) return;
      title.textContent = item.title;
      category.textContent = item.category;
      description.textContent = item.description;
      counter.textContent = `${String(index + 1).padStart(2,'0')} / ${String(list.length).padStart(2,'0')}`;
      contextToggle.hidden = !item.contextSrc;
      contextToggle.textContent = showContext ? 'Ver detalhe do protótipo' : 'Ver registro completo';
      previous.hidden = next.hidden = list.length < 2;
      image.hidden = false; error.hidden = true; loading.hidden = false;
      dialog.dataset.loading = 'true';
      const source = showContext && item.contextSrc ? item.contextSrc : item.src;
      image.alt = showContext ? item.contextAlt || item.alt : item.alt;
      openSource.href = source;
      image.onload = () => { loading.hidden = true; dialog.dataset.loading = 'false'; };
      image.onerror = () => { loading.hidden = true; error.hidden = false; image.hidden = true; dialog.dataset.loading = 'false'; };
      image.src = source;
      if (image.complete && image.naturalWidth) { loading.hidden = true; dialog.dataset.loading = 'false'; }
      syncThumbnails();
    };
    const move = offset => {
      const list = media[group] || []; if (!list.length) return;
      index = (index + offset + list.length) % list.length; showContext = false; render();
    };
    document.addEventListener('click', event => {
      const link = event.target.closest('a[data-gallery]');
      if (!link || event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const targetGroup = link.dataset.gallery, targetIndex = Number(link.dataset.photo);
      if (!media[targetGroup]?.[targetIndex]) return;
      event.preventDefault(); group = targetGroup; index = targetIndex; showContext = false; invoker = link;
      dialogOpen = true; notify(); document.documentElement.classList.add('modal-open'); render();
      dialog.showModal(); $('#dialogClose').focus({ preventScroll: true });
    });
    $('#dialogClose').addEventListener('click', () => dialog.close());
    dialog.addEventListener('click', event => {
      if (event.target !== dialog) return;
      const box = dialog.getBoundingClientRect();
      if (event.clientX < box.left || event.clientX > box.right || event.clientY < box.top || event.clientY > box.bottom) dialog.close();
    });
    dialog.addEventListener('close', () => {
      document.documentElement.classList.remove('modal-open'); dialogOpen = false; notify();
      if (invoker?.closest('[data-copy]')) invoker = $('#copaPause');
      invoker?.focus({ preventScroll: true });
    });
    dialog.addEventListener('keydown', event => {
      if (event.key === 'Tab') {
        const focusable = $$('button:not([disabled]),a[href],[tabindex="0"]', dialog)
          .filter(el => !el.hidden && el.getClientRects().length && el.tabIndex >= 0);
        const first = focusable[0], last = focusable[focusable.length - 1];
        if (!first) { event.preventDefault(); return; }
        if (event.shiftKey && (document.activeElement === first || !dialog.contains(document.activeElement))) {
          event.preventDefault(); last.focus();
        } else if (!event.shiftKey && (document.activeElement === last || !dialog.contains(document.activeElement))) {
          event.preventDefault(); first.focus();
        }
      }
      if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') { event.preventDefault(); move(event.key === 'ArrowRight' ? 1 : -1); }
    });
    previous.addEventListener('click', () => move(-1)); next.addEventListener('click', () => move(1));
    contextToggle.addEventListener('click', () => { showContext = !showContext; render(); });
    const visual = $('.dialog-visual', dialog);
    visual.addEventListener('pointerdown', event => { if (event.isPrimary) touch = {x:event.clientX,y:event.clientY}; });
    visual.addEventListener('pointerup', event => {
      if (!touch) return;
      const dx = event.clientX-touch.x, dy = event.clientY-touch.y; touch = null;
      if (Math.abs(dx) > 55 && Math.abs(dx) > Math.abs(dy)) move(dx < 0 ? 1 : -1);
    });
    visual.addEventListener('pointercancel', () => { touch = null; });
  }
  document.addEventListener('visibilitychange', notify);
  motion.addEventListener('change', event => {
    if (event.matches) { $$('.will-reveal').forEach(el => el.classList.add('is-visible')); intro?.remove(); }
  });
})();

/* Reading progress and return-to-top, independent from galleries. */
(() => {
  const header = document.querySelector('.site-header');
  const topLink = document.querySelector('.back-top');
  let pending = false;
  const update = () => {
    pending = false;
    const max = document.documentElement.scrollHeight - window.innerHeight;
    const progress = max > 0 ? Math.max(0, Math.min(1, window.scrollY / max)) : 0;
    header?.style.setProperty('--reading', progress.toFixed(4));
    if (topLink) topLink.hidden = window.scrollY < 1000;
  };
  const schedule = () => { if (!pending) { pending = true; requestAnimationFrame(update); } };
  window.addEventListener('scroll', schedule, {passive:true});
  window.addEventListener('resize', schedule);
  update();
})();

(() => {
  const links = document.querySelectorAll('.nav-links a[href^="#"]');
  const header = document.querySelector('.site-header');

  const goToSection = (target) => {
    if (!target) return;
    const headerHeight = header ? header.getBoundingClientRect().height : 72;
    const sectionTop = window.scrollY + target.getBoundingClientRect().top;
    // Put the section's own top just below the fixed navigation.
    const top = Math.max(0, sectionTop - headerHeight - 16);
    window.scrollTo(0, top);
  };

  links.forEach(link => {
    link.addEventListener('click', event => {
      const id = link.getAttribute('href');
      const target = id && document.querySelector(id);
      if (!target) return;

      event.preventDefault();
      goToSection(target);

      if (history.replaceState) history.replaceState(null, '', id);

      const menu = document.querySelector('#navLinks');
      const toggle = document.querySelector('#menuToggle');
      if (menu && toggle) {
        menu.classList.remove('open');
        toggle.setAttribute('aria-expanded','false');
        toggle.setAttribute('aria-label','Abrir menu');
      }
    });
  });

  // Also correct direct hash loads without smooth scrolling.
  window.addEventListener('load', () => {
    if (location.hash) {
      const target = document.querySelector(location.hash);
      if (target) requestAnimationFrame(() => goToSection(target));
    }
  });
})();

(()=>{
  'use strict';
  const BLUE='#0cb7f2';
  document.documentElement.style.setProperty('--blue',BLUE);
  document.documentElement.style.setProperty('--cyan',BLUE);

  const reduced=()=>matchMedia('(prefers-reduced-motion: reduce)').matches;
  const pad=n=>String(n+1).padStart(2,'0');

  function openLightbox(img){
    if(!img)return;
    const old=document.querySelector('.v15-lightbox');
    if(old)old.remove();
    const box=document.createElement('div');
    box.className='v15-lightbox';
    box.setAttribute('role','dialog');
    box.setAttribute('aria-modal','true');
    box.setAttribute('aria-label','Imagem ampliada');
    box.style.cssText='position:fixed;inset:0;z-index:60000;display:grid;place-items:center;padding:28px;background:rgba(0,0,0,.97);cursor:zoom-out';
    const clone=img.cloneNode();
    clone.removeAttribute('id');
    clone.style.cssText='display:block;max-width:94vw;max-height:90vh;width:auto;height:auto;object-fit:contain;filter:none';
    box.appendChild(clone);
    const close=()=>{box.remove();document.body.style.overflow='';};
    box.addEventListener('click',close);
    document.addEventListener('keydown',function esc(e){if(e.key==='Escape'){close();document.removeEventListener('keydown',esc)}});
    document.body.style.overflow='hidden';
    document.body.appendChild(box);
  }

  function createCarousel(cfg){
    const root=document.querySelector(cfg.root); if(!root)return null;
    const track=root.querySelector(cfg.track),viewport=root.querySelector(cfg.viewport);
    if(!track||!viewport)return null;
    const slides=[...root.querySelectorAll(cfg.slide)];
    const goBtns=cfg.go?[...root.querySelectorAll(cfg.go)]:[];
    const prev=cfg.prev?root.querySelector(cfg.prev):null;
    const next=cfg.next?root.querySelector(cfg.next):null;
    const current=cfg.current?root.querySelector(cfg.current):null;
    const progress=cfg.progress?root.querySelector(cfg.progress):null;
    let index=0,timer=0,pointer=null,dragged=false;
    const delay=cfg.delay||3200;

    const schedule=()=>{
      clearTimeout(timer);
      if(document.hidden||slides.length<2)return;
      timer=window.setTimeout(()=>render(index+1,false),delay);
    };
    const render=(n,manual=false)=>{
      index=(n+slides.length)%slides.length;
      track.style.transform=`translate3d(${-index*100}%,0,0)`;
      slides.forEach((s,i)=>s.setAttribute('aria-hidden',i===index?'false':'true'));
      goBtns.forEach((b,i)=>{
        const on=i===index;
        b.classList.toggle('is-active',on);
        b.setAttribute('aria-current',on?'true':'false');
      });
      if(current)current.textContent=pad(index);
      if(progress)progress.style.transform=`translateX(${index*100}%)`;
      cfg.onRender?.(index,goBtns[index],manual);
      schedule();
    };
    prev?.addEventListener('click',()=>render(index-1,true));
    next?.addEventListener('click',()=>render(index+1,true));
    goBtns.forEach((b,i)=>b.addEventListener('click',()=>render(i,true)));
    viewport.addEventListener('pointerdown',e=>{if(e.isPrimary){pointer={x:e.clientX,y:e.clientY};dragged=false;}});
    viewport.addEventListener('pointermove',e=>{if(pointer&&Math.abs(e.clientX-pointer.x)>12)dragged=true;},{passive:true});
    viewport.addEventListener('pointerup',e=>{
      if(!pointer)return;
      const dx=e.clientX-pointer.x,dy=e.clientY-pointer.y;pointer=null;
      if(Math.abs(dx)>45&&Math.abs(dx)>Math.abs(dy))render(index+(dx<0?1:-1),true);
    });
    viewport.addEventListener('pointercancel',()=>{pointer=null;dragged=false;});
    document.addEventListener('visibilitychange',()=>document.hidden?clearTimeout(timer):schedule());
    render(0,false);
    return {render,get index(){return index},get dragged(){return dragged}};
  }

  // Hero carousel: always rotates while the page is visible.
  createCarousel({
    root:'#moments-v13',track:'#v13HeroTrack',viewport:'#v13HeroViewport',
    slide:'[data-v13-hero-slide]',go:'[data-v13-hero-go]',
    prev:'#v13HeroPrev',next:'#v13HeroNext',current:'#v13HeroCurrent',delay:3000
  });
  document.querySelectorAll('[data-v13-zoom]').forEach(btn=>btn.addEventListener('click',e=>{
    if(e.detail===0||Math.abs(e.clientX||0)>=0)openLightbox(btn.querySelector('img'));
  }));

  // First season: separate controller, no competing legacy timer.
  (()=>{
    const root=document.querySelector('.first-season-carousel'); if(!root)return;
    const slides=[...root.querySelectorAll('.first-season-slide')];
    const dots=[...root.querySelectorAll('.first-season-dot')];
    const prev=root.querySelector('#firstPrev'),next=root.querySelector('#firstNext');
    let index=0,timer=0,pointer=null;
    const delay=3400;
    const schedule=()=>{clearTimeout(timer);if(!document.hidden&&slides.length>1)timer=setTimeout(()=>go(index+1),delay)};
    const go=n=>{index=(n+slides.length)%slides.length;slides.forEach((s,i)=>s.classList.toggle('is-active',i===index));dots.forEach((d,i)=>{d.classList.toggle('active',i===index);d.setAttribute('aria-current',i===index?'true':'false')});schedule()};
    prev?.addEventListener('click',()=>go(index-1));next?.addEventListener('click',()=>go(index+1));dots.forEach((d,i)=>d.addEventListener('click',()=>go(i)));
    root.addEventListener('pointerdown',e=>{if(e.isPrimary)pointer={x:e.clientX,y:e.clientY}});
    root.addEventListener('pointerup',e=>{if(!pointer)return;const dx=e.clientX-pointer.x,dy=e.clientY-pointer.y;pointer=null;if(Math.abs(dx)>45&&Math.abs(dx)>Math.abs(dy))go(index+(dx<0?1:-1))});
    document.addEventListener('visibilitychange',()=>document.hidden?clearTimeout(timer):schedule());
    go(0);
  })();

  // Awards: photo + title change together, quickly; only horizontal tab strip moves.
  const awardTabs=document.querySelector('#copa .v13-award-tabs');
  createCarousel({
    root:'#copa',track:'#v13AwardTrack',viewport:'#v13AwardViewport',
    slide:'[data-v13-award-slide]',go:'[data-v13-award-go]',
    prev:'#v13AwardPrev',next:'#v13AwardNext',current:'#v13AwardCurrent',progress:'#v13AwardProgress',delay:2300,
    onRender:(i,btn)=>{
      if(!btn||!awardTabs)return;
      const left=btn.offsetLeft-(awardTabs.clientWidth-btn.offsetWidth)/2;
      awardTabs.scrollTo({left:Math.max(0,left),behavior:reduced()?'auto':'smooth'});
    }
  });
  document.querySelectorAll('[data-v13-award-zoom]').forEach(btn=>btn.addEventListener('click',()=>openLightbox(btn.querySelector('img'))));

  // Safe reveal animations: elements stay visible even if IntersectionObserver fails.
  if(!reduced()&&'IntersectionObserver'in window){
    const targets=[...document.querySelectorAll('.season-header,.v13-season-head,.v13-season-storyline,.v13-season-photo,.v13-awards-head,.v13-awards-shell,#processo .timeline-heading,#processo .timeline-item,#contato .contact-copy,#contato .contact-right')];
    const seen=new WeakSet();
    const io=new IntersectionObserver(entries=>entries.forEach(entry=>{
      if(entry.isIntersecting&&!seen.has(entry.target)){
        seen.add(entry.target);
        entry.target.animate([
          {opacity:.28,transform:'translateY(18px)'},
          {opacity:1,transform:'translateY(0)'}
        ],{duration:620,easing:'cubic-bezier(.22,.72,.18,1)',fill:'none'});
        io.unobserve(entry.target);
      }
    }),{threshold:.08,rootMargin:'0px 0px -4% 0px'});
    targets.forEach(el=>io.observe(el));
  }
})();