'use strict';
(() => {
  const menu = document.querySelector('#navLinks');
  const toggle = document.querySelector('#menuToggle');
  const compact = matchMedia('(max-width:1050px)');
  const setMenu = open => {
    menu.classList.toggle('open', open);
    toggle.setAttribute('aria-expanded', String(open));
    toggle.setAttribute('aria-label', open ? 'Fechar menu' : 'Abrir menu');
    document.body.classList.toggle('menu-open', open && compact.matches);
  };
  toggle.addEventListener('click', () => setMenu(toggle.getAttribute('aria-expanded') !== 'true'));
  menu.addEventListener('click', event => { if (event.target.closest('a')) setMenu(false); });
  document.addEventListener('click', event => { if (!event.target.closest('.nav')) setMenu(false); });
  compact.addEventListener('change', () => setMenu(false));

  const viewer = document.querySelector('#photoViewer');
  const picture = viewer.querySelector('.viewer-image');
  const title = viewer.querySelector('#viewerTitle');
  const original = viewer.querySelector('.viewer-original');
  const count = viewer.querySelector('.viewer-count');
  let items = [], current = 0, opener = null;
  const show = index => {
    current = (index + items.length) % items.length;
    const item = items[current];
    picture.src = item.dataset.image;
    picture.alt = item.querySelector('img')?.alt || item.dataset.title;
    title.textContent = item.dataset.title;
    original.href = item.dataset.image;
    count.textContent = `${current + 1} / ${items.length}`;
  };
  document.querySelectorAll('[data-image]').forEach(button => {
    button.addEventListener('click', () => {
      if (typeof viewer.showModal !== 'function') { window.open(button.dataset.image, '_blank', 'noopener'); return; }
      opener = button;
      items = [...document.querySelectorAll('[data-image]')].filter(item => item.dataset.group === button.dataset.group);
      show(items.indexOf(button));
      viewer.showModal();
      document.body.classList.add('dialog-open');
    });
  });
  viewer.querySelector('.viewer-close').addEventListener('click', () => viewer.close());
  viewer.querySelector('.viewer-prev').addEventListener('click', () => show(current - 1));
  viewer.querySelector('.viewer-next').addEventListener('click', () => show(current + 1));
  viewer.addEventListener('click', event => { if (event.target === viewer) viewer.close(); });
  viewer.addEventListener('close', () => { document.body.classList.remove('dialog-open'); opener?.focus({preventScroll:true}); });
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && toggle.getAttribute('aria-expanded') === 'true') { setMenu(false); toggle.focus(); }
    if (!viewer.open) return;
    if (event.key === 'ArrowRight') { event.preventDefault(); show(current + 1); }
    if (event.key === 'ArrowLeft') { event.preventDefault(); show(current - 1); }
  });
})();
