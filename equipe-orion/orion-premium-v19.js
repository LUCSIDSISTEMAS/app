
/* Equipe Orion — Premium interactions v19 */
(function(){
  'use strict';
  var root=document.documentElement;
  var reduced=window.matchMedia('(prefers-reduced-motion: reduce)');
  var fine=window.matchMedia('(hover:hover) and (pointer:fine)');

  var orb=document.createElement('i');
  orb.className='v19-scroll-orb';orb.setAttribute('aria-hidden','true');document.body.appendChild(orb);

  var raf=0;
  function updateScroll(){
    raf=0;
    var max=Math.max(1,document.documentElement.scrollHeight-innerHeight);
    var p=Math.min(1,Math.max(0,scrollY/max));
    root.style.setProperty('--v19-progress',p.toFixed(4));
  }
  addEventListener('scroll',function(){if(!raf)raf=requestAnimationFrame(updateScroll)},{passive:true});
  addEventListener('resize',updateScroll,{passive:true});updateScroll();

  var selectors=['.v13-hero-carousel','.season-photo-card','.v13-season-photo','.v13-awards-shell','.partners-panel','.partners-cta','.contact-option'];
  document.querySelectorAll(selectors.join(',')).forEach(function(el){
    el.setAttribute('data-v19-spotlight','');
    el.addEventListener('pointermove',function(e){
      if(!fine.matches||reduced.matches)return;
      var r=el.getBoundingClientRect();
      el.style.setProperty('--v19-x',(e.clientX-r.left)+'px');
      el.style.setProperty('--v19-y',(e.clientY-r.top)+'px');
    },{passive:true});
  });

  document.querySelectorAll('.btn').forEach(function(btn){
    btn.addEventListener('pointermove',function(e){
      if(!fine.matches||reduced.matches)return;
      var r=btn.getBoundingClientRect(),x=(e.clientX-r.left-r.width/2)/r.width,y=(e.clientY-r.top-r.height/2)/r.height;
      btn.style.transform='translate3d('+(x*7)+'px,'+(y*6-2)+'px,0)';
    },{passive:true});
    btn.addEventListener('pointerleave',function(){btn.style.transform='';},{passive:true});
  });

  if('IntersectionObserver' in window&&!reduced.matches){
    var targets=document.querySelectorAll('.season-header,.v13-season-head,.v13-awards-head,.timeline-heading,.partners-heading,.season-grid,.v13-season-storyline,.v13-season-gallery,.v13-awards-shell,.v13-award-tabs,.timeline,.partners-grid,.partners-cta');
    var io=new IntersectionObserver(function(entries){
      entries.forEach(function(entry){
        if(!entry.isIntersecting)return;
        entry.target.animate([{opacity:0,transform:'translateY(28px)',filter:'blur(5px)'},{opacity:1,transform:'translateY(0)',filter:'blur(0)'}],{duration:760,easing:'cubic-bezier(.2,.75,.2,1)',fill:'both'});
        io.unobserve(entry.target);
      });
    },{threshold:.08,rootMargin:'0px 0px -8% 0px'});
    targets.forEach(function(el){io.observe(el)});
  }

  var hero=document.querySelector('.hero'),heroCard=document.querySelector('.v13-hero-carousel');
  if(hero&&heroCard){
    hero.addEventListener('pointermove',function(e){
      if(!fine.matches||reduced.matches)return;
      var r=hero.getBoundingClientRect(),x=(e.clientX-r.left)/r.width-.5,y=(e.clientY-r.top)/Math.max(1,r.height)-.5;
      heroCard.style.transform='translate3d('+(x*-8)+'px,'+(y*-6)+'px,0)';
    },{passive:true});
    hero.addEventListener('pointerleave',function(){heroCard.style.transform='';},{passive:true});
  }

  document.querySelectorAll('section[id],header[id]').forEach(function(el){el.style.scrollMarginTop='110px'});
  document.querySelectorAll('a[target="_blank"]').forEach(function(a){
    var rel=new Set((a.getAttribute('rel')||'').split(/\s+/).filter(Boolean));
    rel.add('noopener');rel.add('noreferrer');a.setAttribute('rel',Array.from(rel).join(' '));
  });
})();
