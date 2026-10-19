'use strict';
(() => {
  const $ = (s, r=document) => r.querySelector(s);
  const $$ = (s, r=document) => Array.from(r.querySelectorAll(s));
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const finePointer = matchMedia('(hover:hover) and (pointer:fine)');

  /* Boot */
  const intro = $('#intro');
  const ready = () => document.body.classList.add('site-ready');
  setTimeout(() => {
    intro?.classList.add('is-leaving');
    ready();
    setTimeout(() => intro?.remove(), 450);
  }, reduced.matches ? 0 : 720);
  setTimeout(ready, 850);

  /* Header, menu and scroll progress */
  const header = $('.site-header');
  const menu = $('#navLinks');
  const toggle = $('#menuToggle');
  const progress = $('.reading-progress span');

  const setMenu = open => {
    if (!menu || !toggle) return;
    menu.classList.toggle('open', open);
    toggle.setAttribute('aria-expanded', String(open));
    toggle.setAttribute('aria-label', open ? 'Fechar menu' : 'Abrir menu');
    document.body.classList.toggle('menu-open', open && innerWidth <= 760);
  };
  toggle?.addEventListener('click', () => setMenu(toggle.getAttribute('aria-expanded') !== 'true'));
  menu?.addEventListener('click', e => { if (e.target.closest('a')) setMenu(false); });
  addEventListener('click', e => { if (!e.target.closest('.nav')) setMenu(false); });
  addEventListener('keydown', e => { if (e.key === 'Escape') setMenu(false); });
  matchMedia('(min-width:761px)').addEventListener('change', e => { if (e.matches) setMenu(false); });

  let scrollFrame = 0;
  const syncScroll = () => {
    scrollFrame = 0;
    const y = scrollY;
    header?.classList.toggle('scrolled', y > 18);
    const max = Math.max(1, document.documentElement.scrollHeight - innerHeight);
    document.documentElement.style.setProperty('--reading', Math.min(1, y / max).toFixed(4));
    const back = $('.back-top');
    if (back) back.hidden = y < 620;
  };
  addEventListener('scroll', () => {
    if (!scrollFrame) scrollFrame = requestAnimationFrame(syncScroll);
  }, {passive:true});
  addEventListener('resize', syncScroll, {passive:true});
  syncScroll();

  /* Section reveal */
  if ('IntersectionObserver' in window && !reduced.matches) {
    const io = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-visible');
        io.unobserve(entry.target);
      });
    }, {threshold:.08, rootMargin:'0px 0px -5% 0px'});
    $$('[data-reveal]').forEach(el => {
      el.classList.add('will-reveal');
      io.observe(el);
    });
  } else {
    $$('[data-reveal]').forEach(el => el.classList.add('is-visible'));
  }

  /* Active navigation */
  if ('IntersectionObserver' in window) {
    const navLinks = $$('.nav-links a[href^="#"]');
    const ids = new Set(navLinks.map(a => a.hash.slice(1)));
    const spy = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        navLinks.forEach(a => {
          if (a.hash === '#' + entry.target.id) a.setAttribute('aria-current','location');
          else a.removeAttribute('aria-current');
        });
      });
    }, {rootMargin:'-28% 0px -60% 0px', threshold:0});
    $$('header[id],section[id]').filter(el => ids.has(el.id)).forEach(el => spy.observe(el));
  }

  /* Generic transform carousel */
  function transformCarousel({
    root, viewport, track, slides, dots, prev, next, current, progress,
    delay=4200, onRender
  }) {
    const rootEl = $(root);
    const viewportEl = $(viewport);
    const trackEl = $(track);
    if (!rootEl || !viewportEl || !trackEl) return;
    const slideEls = $$(slides, rootEl);
    const dotEls = dots ? $$(dots, rootEl) : [];
    const prevEl = prev ? $(prev, rootEl) || $(prev) : null;
    const nextEl = next ? $(next, rootEl) || $(next) : null;
    const currentEl = current ? $(current) : null;
    const progressEl = progress ? $(progress) : null;
    if (!slideEls.length) return;

    let index=0,timer=0,hover=false,focus=false,visible=true,pointer=null;
    const canPlay = () => !reduced.matches && !document.hidden && !hover && !focus && visible && slideEls.length > 1;
    const schedule = () => {
      clearTimeout(timer);
      if (canPlay()) timer = setTimeout(() => go(index+1,false), delay);
    };
    const go = (n, manual=true) => {
      index = (n + slideEls.length) % slideEls.length;
      trackEl.style.transform = 'translate3d(' + (-index*100) + '%,0,0)';
      slideEls.forEach((s,i) => {
        const active = i === index;
        s.setAttribute('aria-hidden', String(!active));
        if ('inert' in s) s.inert = !active;
      });
      dotEls.forEach((d,i) => {
        const active = i === index;
        d.classList.toggle('is-active',active);
        d.setAttribute('aria-current',active?'true':'false');
      });
      if (currentEl) currentEl.textContent = String(index+1).padStart(2,'0');
      if (progressEl) progressEl.style.transform = 'scaleX(' + ((index+1)/slideEls.length) + ')';
      onRender?.(index, dotEls[index], manual);
      schedule();
    };

    prevEl?.addEventListener('click', () => go(index-1,true));
    nextEl?.addEventListener('click', () => go(index+1,true));
    dotEls.forEach((d,i) => d.addEventListener('click', () => go(i,true)));
    viewportEl.addEventListener('mouseenter', () => { hover=true; schedule(); });
    viewportEl.addEventListener('mouseleave', () => { hover=false; schedule(); });
    rootEl.addEventListener('focusin', () => { focus=true; schedule(); });
    rootEl.addEventListener('focusout', e => {
      if (!rootEl.contains(e.relatedTarget)) { focus=false; schedule(); }
    });
    viewportEl.addEventListener('pointerdown', e => {
      if (!e.isPrimary || (e.pointerType==='mouse' && e.button!==0)) return;
      pointer={x:e.clientX,y:e.clientY};
    }, {passive:true});
    viewportEl.addEventListener('pointerup', e => {
      if (!pointer) return;
      const dx=e.clientX-pointer.x,dy=e.clientY-pointer.y;
      pointer=null;
      if (Math.abs(dx)>42 && Math.abs(dx)>Math.abs(dy)) go(index+(dx<0?1:-1),true);
    }, {passive:true});
    viewportEl.addEventListener('pointercancel', () => { pointer=null; });
    viewportEl.addEventListener('dragstart', e => e.preventDefault());

    if ('IntersectionObserver' in window) {
      new IntersectionObserver(entries => {
        visible = entries[0]?.isIntersecting ?? true;
        schedule();
      }, {threshold:.08}).observe(rootEl);
    }
    document.addEventListener('visibilitychange', schedule);
    reduced.addEventListener('change', schedule);
    go(0,false);
    return {go, get index(){return index;}};
  }

  const heroCarousel = transformCarousel({
    root:'#moments-v13',
    viewport:'#v13HeroViewport',
    track:'#v13HeroTrack',
    slides:'[data-v13-hero-slide]',
    dots:'[data-v13-hero-go]',
    prev:'#v13HeroPrev',
    next:'#v13HeroNext',
    current:'#v13HeroCurrent',
    delay:4100
  });

  /* First season carousel */
  (() => {
    const root = $('.first-season-carousel');
    if (!root) return;
    const slides = $$('.first-season-slide',root);
    const dots = $$('.first-season-dot',root);
    const prev = $('#firstPrev',root);
    const next = $('#firstNext',root);
    let index=0,timer=0,hover=false,focus=false,visible=true,pointer=null;

    const canPlay = () => !reduced.matches && !document.hidden && !hover && !focus && visible && slides.length>1;
    const schedule = () => {
      clearTimeout(timer);
      if (canPlay()) timer=setTimeout(() => go(index+1),4400);
    };
    const go = n => {
      index=(n+slides.length)%slides.length;
      slides.forEach((s,i)=>s.classList.toggle('is-active',i===index));
      dots.forEach((d,i)=>{
        const active=i===index;
        d.classList.toggle('active',active);
        d.setAttribute('aria-current',active?'true':'false');
      });
      schedule();
    };
    prev?.addEventListener('click',()=>go(index-1));
    next?.addEventListener('click',()=>go(index+1));
    dots.forEach((d,i)=>d.addEventListener('click',()=>go(i)));
    root.addEventListener('mouseenter',()=>{hover=true;schedule();});
    root.addEventListener('mouseleave',()=>{hover=false;schedule();});
    root.addEventListener('focusin',()=>{focus=true;schedule();});
    root.addEventListener('focusout',e=>{if(!root.contains(e.relatedTarget)){focus=false;schedule();}});
    root.addEventListener('pointerdown',e=>{
      if(!e.isPrimary||(e.pointerType==='mouse'&&e.button!==0))return;
      pointer={x:e.clientX,y:e.clientY};
    },{passive:true});
    root.addEventListener('pointerup',e=>{
      if(!pointer)return;
      const dx=e.clientX-pointer.x,dy=e.clientY-pointer.y;pointer=null;
      if(Math.abs(dx)>42&&Math.abs(dx)>Math.abs(dy))go(index+(dx<0?1:-1));
    },{passive:true});
    root.addEventListener('pointercancel',()=>{pointer=null;});
    if('IntersectionObserver'in window){
      new IntersectionObserver(entries=>{visible=entries[0]?.isIntersecting??true;schedule();},{threshold:.08}).observe(root);
    }
    document.addEventListener('visibilitychange',schedule);
    go(0);
  })();

  const awardTabs = $('#v13AwardTabs');
  const awardsCarousel = transformCarousel({
    root:'#copa',
    viewport:'#v13AwardViewport',
    track:'#v13AwardTrack',
    slides:'[data-v13-award-slide]',
    dots:'[data-v13-award-go]',
    prev:'#v13AwardPrev',
    next:'#v13AwardNext',
    current:'#v13AwardCurrent',
    progress:'#v13AwardProgress',
    delay:5000,
    onRender:(i,btn)=>{
      if(!btn||!awardTabs)return;
      const target=btn.offsetLeft-(awardTabs.clientWidth-btn.offsetWidth)/2;
      awardTabs.scrollTo({left:Math.max(0,target),behavior:reduced.matches?'auto':'smooth'});
    }
  });

  /* Lightbox */
  const dialog = $('#mediaDialog');
  const dialogImg = $('#dialogImage');
  const dialogTitle = $('#dialogTitle');
  const dialogDesc = $('#dialogDescription');
  const dialogCategory = $('#dialogCategory');
  const dialogCounter = $('#dialogCounter');
  const dialogPrev = $('#dialogPrev');
  const dialogNext = $('#dialogNext');
  const dialogClose = $('#dialogClose');
  const dialogLoading = $('#dialogLoading');
  const dialogError = $('#dialogError');
  let lightboxItems=[],lightboxIndex=0,lastFocus=null;

  const buildItem = img => ({
    src:img?.currentSrc||img?.src||'',
    alt:img?.alt||'Fotografia da Equipe Órion',
    title:img?.closest('article,figure')?.querySelector('strong,h3')?.textContent?.trim() || 'Equipe Órion',
    category:img?.closest('#copa') ? 'Conquistas da Órion' : 'Momentos da Órion'
  });
  const openDialog = (images,index) => {
    if(!dialog||!dialogImg||!images.length)return;
    lightboxItems=images.map(buildItem);lightboxIndex=index;lastFocus=document.activeElement;
    renderDialog();
    if(typeof dialog.showModal==='function') dialog.showModal();
    else dialog.setAttribute('open','');
    document.body.classList.add('menu-open');
  };
  const renderDialog = () => {
    const item=lightboxItems[lightboxIndex];if(!item)return;
    dialogLoading.hidden=false;dialogError.hidden=true;
    dialogImg.onload=()=>{dialogLoading.hidden=true;};
    dialogImg.onerror=()=>{dialogLoading.hidden=true;dialogError.hidden=false;};
    dialogImg.src=item.src;dialogImg.alt=item.alt;
    if(dialogTitle)dialogTitle.textContent=item.title;
    if(dialogDesc)dialogDesc.textContent=item.alt;
    if(dialogCategory)dialogCategory.textContent=item.category;
    if(dialogCounter)dialogCounter.textContent=String(lightboxIndex+1).padStart(2,'0')+' / '+String(lightboxItems.length).padStart(2,'0');
    if(dialogPrev)dialogPrev.hidden=lightboxItems.length<2;
    if(dialogNext)dialogNext.hidden=lightboxItems.length<2;
  };
  const closeDialog = () => {
    if(!dialog)return;
    if(typeof dialog.close==='function'&&dialog.open)dialog.close();
    else dialog.removeAttribute('open');
    document.body.classList.remove('menu-open');
    lastFocus?.focus?.({preventScroll:true});
  };
  const stepDialog = dir => {
    if(lightboxItems.length<2)return;
    lightboxIndex=(lightboxIndex+dir+lightboxItems.length)%lightboxItems.length;
    renderDialog();
  };

  const heroZooms = $$('[data-v13-zoom]');
  heroZooms.forEach((btn,i)=>btn.addEventListener('click',()=>openDialog(heroZooms.map(b=>$('img',b)),i)));
  const awardZooms = $$('[data-v13-award-zoom]');
  awardZooms.forEach((btn,i)=>btn.addEventListener('click',()=>openDialog(awardZooms.map(b=>$('img',b)),i)));
  dialogClose?.addEventListener('click',closeDialog);
  dialogPrev?.addEventListener('click',()=>stepDialog(-1));
  dialogNext?.addEventListener('click',()=>stepDialog(1));
  dialog?.addEventListener('click',e=>{if(e.target===dialog)closeDialog();});
  dialog?.addEventListener('cancel',e=>{e.preventDefault();closeDialog();});
  addEventListener('keydown',e=>{
    if(!dialog?.open)return;
    if(e.key==='ArrowLeft')stepDialog(-1);
    if(e.key==='ArrowRight')stepDialog(1);
    if(e.key==='Escape')closeDialog();
  });

  /* Back to top */
  $('.back-top')?.addEventListener('click',e=>{
    e.preventDefault();
    scrollTo({top:0,behavior:reduced.matches?'auto':'smooth'});
  });

  /* Smooth internal navigation with fixed-header offset */
  $$('a[href^="#"]').forEach(a=>{
    a.addEventListener('click',e=>{
      const id=a.getAttribute('href');if(!id||id==='#')return;
      const target=$(id);if(!target)return;
      e.preventDefault();
      setMenu(false);
      const top=target.getBoundingClientRect().top+scrollY-88;
      scrollTo({top,behavior:reduced.matches?'auto':'smooth'});
    });
  });
})();