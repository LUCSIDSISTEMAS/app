'use strict';
(() => {
  const menu = document.querySelector('#navLinks');
  const toggle = document.querySelector('#menuToggle');
  const explore = document.querySelector('.nav-explore');
  const close = () => {
    menu.classList.remove('open');
    toggle.setAttribute('aria-expanded', 'false');
    toggle.setAttribute('aria-label', 'Abrir menu');
    document.body.classList.remove('menu-open');
  };
  toggle.addEventListener('click', () => {
    const open = toggle.getAttribute('aria-expanded') !== 'true';
    menu.classList.toggle('open', open);
    toggle.setAttribute('aria-expanded', String(open));
    toggle.setAttribute('aria-label', open ? 'Fechar menu' : 'Abrir menu');
    document.body.classList.toggle('menu-open', open && matchMedia('(max-width:1050px)').matches);
  });
  menu.addEventListener('click', event => { if (event.target.closest('a')) close(); });
  document.addEventListener('click', event => {
    if (!event.target.closest('.nav')) close();
    if (!event.target.closest('.nav-explore')) explore.open = false;
  });
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape') { close(); explore.open = false; }
  });
})();
