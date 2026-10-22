(() => {
  const videos = [...document.querySelectorAll('.video-frame video')];
  videos.forEach(video => {
    const button = video.parentElement.querySelector('.video-start');
    if (!button) return;
    button.hidden = false;
    button.addEventListener('click', () => {
      video.play().catch(() => { button.hidden = true; video.focus(); });
    });
    video.addEventListener('play', () => {
      button.hidden = true;
      videos.forEach(other => { if (other !== video) other.pause(); });
    });
    video.addEventListener('ended', () => { button.hidden = false; });
  });

  const viewer = document.querySelector('#printViewer');
  if (!viewer || typeof viewer.showModal !== 'function') return;
  const image = viewer.querySelector('img');
  const caption = viewer.querySelector('.viewer-caption');
  const original = viewer.querySelector('.viewer-original');
  document.querySelectorAll('[data-print]').forEach(link => {
    link.addEventListener('click', event => {
      if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
      event.preventDefault();
      image.src = link.href;
      image.alt = link.querySelector('img').alt;
      caption.textContent = link.dataset.caption || image.alt;
      original.href = link.href;
      viewer.showModal();
    });
  });
  viewer.querySelector('.viewer-close').addEventListener('click', () => viewer.close());
  viewer.addEventListener('click', event => { if (event.target === viewer) viewer.close(); });
})();
