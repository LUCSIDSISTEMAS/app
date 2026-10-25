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

  const explore = document.querySelector('.nav-explore');
  document.addEventListener('click', event => {
    if (!event.target.closest('.nav-explore') || event.target.closest('.explore-links a')) explore.open = false;
  });
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && explore.open) { explore.open = false; explore.querySelector('summary').focus(); }
  });
  const tabs = [...document.querySelectorAll('.season-tabs [role="tab"]')];
  const seasonSlides = [
    {src:'./assets/temporada/temporada-gestao.webp', label:'GESTÃO', caption:'Acompanhamento do processo e dos recursos do projeto.', alt:'Integrante da equipe acompanha a operação de uma impressora 3D.'},
    {src:'./assets/temporada/temporada-programacao.webp', label:'PROGRAMAÇÃO', caption:'Programação e testes feitos em equipe.', alt:'Dois estudantes trabalham juntos nos computadores.'},
    {src:'./assets/temporada/temporada-robot.webp', label:'ENGENHARIA', caption:'Montagem e testes do robô.', alt:'Estudante trabalha na montagem e nos testes do robô verde.'}
  ];
  const seasonImage = document.querySelector('#seasonPhoto');
  const seasonPhotoLabel = document.querySelector('#seasonPhotoLabel');
  const seasonPhotoCaption = document.querySelector('#seasonPhotoCaption');
  const seasonDots = [...document.querySelectorAll('[data-season-slide]')];
  let activeSeasonSlide = 0;
  const showSeasonSlide = index => {
    activeSeasonSlide = (index + seasonSlides.length) % seasonSlides.length;
    const slide = seasonSlides[activeSeasonSlide];
    seasonImage.src = slide.src;
    seasonImage.alt = slide.alt;
    seasonPhotoLabel.textContent = slide.label;
    seasonPhotoCaption.textContent = slide.caption;
    seasonDots.forEach((dot, dotIndex) => dot.setAttribute('aria-pressed', String(dotIndex === activeSeasonSlide)));
  };
  const activateTab = tab => {
    tabs.forEach(item => {
      const active = item === tab;
      item.setAttribute('aria-selected', String(active));
      item.tabIndex = active ? 0 : -1;
      document.getElementById(item.getAttribute('aria-controls')).hidden = !active;
    });
    const slideIndex = tabs.indexOf(tab);
    if (slideIndex >= 0) showSeasonSlide(slideIndex);
  };
  tabs.forEach((tab, index) => {
    tab.addEventListener('click', () => activateTab(tab));
    tab.addEventListener('keydown', event => {
      const positions = { ArrowRight: (index + 1) % tabs.length, ArrowLeft: (index + tabs.length - 1) % tabs.length, Home: 0, End: tabs.length - 1 };
      if (!(event.key in positions)) return;
      event.preventDefault();
      const next = tabs[positions[event.key]];
      activateTab(next); next.focus();
    });
  });
  const seasonPrev = document.querySelector('[data-season-prev]');
  const seasonNext = document.querySelector('[data-season-next]');
  if (seasonPrev && tabs.length) seasonPrev.addEventListener('click', () => activateTab(tabs[(activeSeasonSlide + tabs.length - 1) % tabs.length]));
  if (seasonNext && tabs.length) seasonNext.addEventListener('click', () => activateTab(tabs[(activeSeasonSlide + 1) % tabs.length]));
  seasonDots.forEach((dot, index) => dot.addEventListener('click', () => activateTab(tabs[index])));
  if (tabs.length) activateTab(tabs.find(tab => tab.getAttribute('aria-selected') === 'true') || tabs[0]);

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
