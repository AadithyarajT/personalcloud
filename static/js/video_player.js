/* PersonalCloud — Video Player */

(function () {
  const modal      = document.getElementById('videoModal');
  const backdrop   = document.getElementById('videoBackdrop');
  const video      = document.getElementById('mainVideo');
  const titleEl    = document.getElementById('videoTitle');
  const closeBtn   = document.getElementById('videoClose');
  const pipBtn     = document.getElementById('videoPiP');

  // Controls
  const playBtn    = document.getElementById('vPlayBtn');
  const prevBtn    = document.getElementById('vPrevBtn');
  const nextBtn    = document.getElementById('vNextBtn');
  const muteBtn    = document.getElementById('vMuteBtn');
  const fullBtn    = document.getElementById('vFullBtn');
  const loopBtn    = document.getElementById('vLoopBtn');
  const shuffleBtn = document.getElementById('vShuffleBtn');
  const speedSel   = document.getElementById('vSpeed');
  const volumeEl   = document.getElementById('vVolume');

  // Progress
  const progressBar  = document.getElementById('vProgressBar');
  const playedEl     = document.getElementById('vPlayed');
  const bufferedEl   = document.getElementById('vBuffered');
  const thumbEl      = document.getElementById('vThumb');
  const currentEl    = document.getElementById('vCurrentTime');
  const durationEl   = document.getElementById('vDuration');
  const timeInline   = document.getElementById('vTimeInline');
  const overlay      = document.getElementById('videoOverlay');
  const overlayIcon  = document.getElementById('voPlayIcon');

  // Playlist
  const playlistEl   = document.getElementById('videoPlaylistItems');

  let playlist       = [];
  let currentIndex   = 0;
  let shuffled       = false;
  let looping        = false;
  let isDragging     = false;
  let overlayTimeout = null;

  // Build playlist from DOM
  function buildPlaylist() {
    playlist = [];
    playlistEl.querySelectorAll('.playlist-item').forEach((li, i) => {
      playlist.push({
        id:    li.dataset.id,
        url:   li.dataset.url,
        title: li.dataset.title,
        el:    li,
      });
      li.addEventListener('click', () => loadTrack(i));
    });
  }

  function openModal(url, title, startId) {
    buildPlaylist();
    const idx = playlist.findIndex(t => t.url === url || t.id === startId);
    currentIndex = idx >= 0 ? idx : 0;

    // If file not in playlist, inject it at position 0
    if (idx < 0) {
      playlist.unshift({ id: startId, url, title, el: null });
      currentIndex = 0;
    }

    modal.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
    loadTrack(currentIndex);
  }

  function closeModal() {
    video.pause();
    video.src = '';
    modal.classList.add('hidden');
    document.body.style.overflow = '';
  }

  function loadTrack(index) {
    if (index < 0 || index >= playlist.length) return;
    currentIndex = index;
    const track = playlist[index];

    titleEl.textContent = track.title;
    video.src = track.url;
    video.load();
    video.play().catch(() => {});
    updatePlaylistActive();
  }

  function updatePlaylistActive() {
    playlistEl.querySelectorAll('.playlist-item').forEach((li, i) => {
      li.classList.toggle('active', i === currentIndex);
    });
    // Scroll active into view
    const active = playlistEl.querySelector('.playlist-item.active');
    if (active) active.scrollIntoView({ block: 'nearest' });
  }

  // Play / Pause
  function togglePlay() {
    if (video.paused) video.play();
    else video.pause();
  }

  video.addEventListener('play',  () => {
    playBtn.textContent = '⏸';
    showOverlayIcon('⏵');
  });

  video.addEventListener('pause', () => {
    playBtn.textContent = '▶';
    showOverlayIcon('⏸');
  });

  function showOverlayIcon(icon) {
    overlayIcon.textContent = icon;
    overlayIcon.classList.add('show');
    clearTimeout(overlayTimeout);
    overlayTimeout = setTimeout(() => overlayIcon.classList.remove('show'), 700);
  }

  // Progress
  video.addEventListener('timeupdate', () => {
    if (isDragging) return;
    const pct = video.duration ? (video.currentTime / video.duration) * 100 : 0;
    playedEl.style.width  = pct + '%';
    thumbEl.style.left    = pct + '%';
    currentEl.textContent = fmtTime(video.currentTime);
    timeInline.textContent = `${fmtTime(video.currentTime)} / ${fmtTime(video.duration)}`;
  });

  video.addEventListener('durationchange', () => {
    durationEl.textContent = fmtTime(video.duration);
    timeInline.textContent  = `0:00 / ${fmtTime(video.duration)}`;
  });

  video.addEventListener('progress', () => {
    if (video.buffered.length > 0 && video.duration) {
      const pct = (video.buffered.end(video.buffered.length - 1) / video.duration) * 100;
      bufferedEl.style.width = pct + '%';
    }
  });

  video.addEventListener('ended', () => {
    if (looping) {
      video.currentTime = 0;
      video.play();
    } else {
      playNext();
    }
  });

  // Seek on progress bar click/drag
  function seekTo(e) {
    const rect = progressBar.getBoundingClientRect();
    const pct  = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    if (video.duration) video.currentTime = pct * video.duration;
  }

  progressBar.addEventListener('mousedown', (e) => {
    isDragging = true;
    seekTo(e);
  });

  document.addEventListener('mousemove', (e) => {
    if (isDragging) seekTo(e);
  });

  document.addEventListener('mouseup', () => { isDragging = false; });

  // Volume
  volumeEl.addEventListener('input', () => {
    video.volume = volumeEl.value;
    muteBtn.textContent = video.volume === 0 ? '🔇' : '🔊';
  });

  muteBtn.addEventListener('click', () => {
    video.muted = !video.muted;
    muteBtn.textContent = video.muted ? '🔇' : '🔊';
  });

  // Speed
  speedSel.addEventListener('change', () => {
    video.playbackRate = parseFloat(speedSel.value);
  });

  // Loop
  loopBtn.addEventListener('click', () => {
    looping = !looping;
    loopBtn.classList.toggle('active', looping);
  });

  // Shuffle
  shuffleBtn.addEventListener('click', () => {
    shuffled = !shuffled;
    shuffleBtn.classList.toggle('active', shuffled);
  });

  // Prev / Next
  function playPrev() {
    if (shuffled) {
      currentIndex = Math.floor(Math.random() * playlist.length);
    } else {
      currentIndex = (currentIndex - 1 + playlist.length) % playlist.length;
    }
    loadTrack(currentIndex);
  }

  function playNext() {
    if (shuffled) {
      currentIndex = Math.floor(Math.random() * playlist.length);
    } else {
      currentIndex = (currentIndex + 1) % playlist.length;
    }
    loadTrack(currentIndex);
  }

  prevBtn.addEventListener('click', playPrev);
  nextBtn.addEventListener('click', playNext);

  // Fullscreen
  fullBtn.addEventListener('click', () => {
    const wrap = document.querySelector('.video-screen-wrap');
    if (!document.fullscreenElement) {
      wrap.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen();
    }
  });

  // PiP
  pipBtn.addEventListener('click', () => {
    if (document.pictureInPictureElement) {
      document.exitPictureInPicture();
    } else if (video.readyState >= 2) {
      video.requestPictureInPicture().catch(() => {});
    }
  });

  // Click on video toggles play
  document.querySelector('.video-screen-wrap').addEventListener('click', togglePlay);
  playBtn.addEventListener('click', (e) => { e.stopPropagation(); togglePlay(); });

  // Close
  closeBtn.addEventListener('click', closeModal);
  backdrop.addEventListener('click', closeModal);

  // Keyboard
  document.addEventListener('keydown', (e) => {
    if (modal.classList.contains('hidden')) return;
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT') return;
    switch (e.key) {
      case ' ':
      case 'k':
        e.preventDefault(); togglePlay(); break;
      case 'ArrowRight':
        e.preventDefault(); video.currentTime = Math.min(video.duration, video.currentTime + 5); break;
      case 'ArrowLeft':
        e.preventDefault(); video.currentTime = Math.max(0, video.currentTime - 5); break;
      case 'ArrowUp':
        e.preventDefault(); video.volume = Math.min(1, video.volume + 0.1); volumeEl.value = video.volume; break;
      case 'ArrowDown':
        e.preventDefault(); video.volume = Math.max(0, video.volume - 0.1); volumeEl.value = video.volume; break;
      case 'f':
      case 'F':
        fullBtn.click(); break;
      case 'Escape':
        closeModal(); break;
      case 'n':
        playNext(); break;
      case 'p':
        playPrev(); break;
    }
  });

  // Expose open function globally
  window.openVideoPlayer = openModal;

  // Utility
  function fmtTime(s) {
    if (!s || isNaN(s)) return '0:00';
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec.toString().padStart(2, '0')}`;
  }

})();