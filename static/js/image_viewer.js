/* PersonalCloud — Image Viewer */

(function () {
  const modal    = document.getElementById('imageModal');
  const backdrop = document.getElementById('imageBackdrop');
  const img      = document.getElementById('mainImage');
  const titleEl  = document.getElementById('imageTitle');
  const closeBtn = document.getElementById('imageClose');
  const zoomIn   = document.getElementById('imageZoomIn');
  const zoomOut  = document.getElementById('imageZoomOut');
  const resetBtn = document.getElementById('imageReset');
  const wrap     = document.getElementById('imageViewerWrap');

  let scale = 1;
  let isDragging = false;
  let startX, startY, translateX = 0, translateY = 0;

  function openModal(url, title) {
    img.src = url;
    titleEl.textContent = title;
    scale = 1; translateX = 0; translateY = 0;
    applyTransform();
    modal.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
  }

  function closeModal() {
    img.src = '';
    modal.classList.add('hidden');
    document.body.style.overflow = '';
  }

  function applyTransform() {
    img.style.transform = `translate(${translateX}px, ${translateY}px) scale(${scale})`;
  }

  zoomIn.addEventListener('click',  () => { scale = Math.min(5, scale + 0.25); applyTransform(); });
  zoomOut.addEventListener('click', () => { scale = Math.max(0.2, scale - 0.25); applyTransform(); });
  resetBtn.addEventListener('click', () => { scale = 1; translateX = 0; translateY = 0; applyTransform(); });

  // Scroll to zoom
  wrap.addEventListener('wheel', (e) => {
    e.preventDefault();
    scale = e.deltaY < 0
      ? Math.min(5, scale + 0.1)
      : Math.max(0.2, scale - 0.1);
    applyTransform();
  }, { passive: false });

  // Drag to pan
  wrap.addEventListener('mousedown', (e) => {
    isDragging = true;
    startX = e.clientX - translateX;
    startY = e.clientY - translateY;
    wrap.style.cursor = 'grabbing';
  });

  document.addEventListener('mousemove', (e) => {
    if (!isDragging) return;
    translateX = e.clientX - startX;
    translateY = e.clientY - startY;
    applyTransform();
  });

  document.addEventListener('mouseup', () => {
    isDragging = false;
    wrap.style.cursor = 'grab';
  });

  closeBtn.addEventListener('click', closeModal);
  backdrop.addEventListener('click', closeModal);

  document.addEventListener('keydown', (e) => {
    if (modal.classList.contains('hidden')) return;
    if (e.key === 'Escape') closeModal();
    if (e.key === '+' || e.key === '=') { scale = Math.min(5, scale + 0.25); applyTransform(); }
    if (e.key === '-') { scale = Math.max(0.2, scale - 0.25); applyTransform(); }
    if (e.key === '0') { scale = 1; translateX = 0; translateY = 0; applyTransform(); }
  });

  window.openImageViewer = openModal;
})();