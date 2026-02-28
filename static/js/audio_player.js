/* PersonalCloud — Audio Player */

(function () {
  const modal      = document.getElementById('audioModal');
  const backdrop   = document.getElementById('audioBackdrop');
  const audio      = document.getElementById('mainAudio');
  const titleEl    = document.getElementById('audioTitle');
  const closeBtn   = document.getElementById('audioClose');

  // Track info
  const artEl      = document.getElementById('audioArt');
  const trackName  = document.getElementById('audioTrackName');
  const trackOwner = document.getElementById('audioTrackOwner');

  // Controls
  const playBtn    = document.getElementById('aPlayBtn');
  const prevBtn    = document.getElementById('aPrevBtn');
  const nextBtn    = document.getElementById('aNextBtn');
  const muteBtn    = document.getElementById('aMuteBtn');
  const shuffleBtn = document.getElementById('aShuffleBtn');
  const repeatBtn  = document.getElementById('aRepeatBtn');
  const speedSel   = document.getElementById('aSpeed');
  const volumeEl   = document.getElementById('aVolume');

  // Progress
  const progressBar = document.getElementById('aProgressBar');
  const playedEl    = document.getElementById('aPlayed');
  const thumbEl     = document.getElementById('aThumb');
  const currentEl   = document.getElementById('aCurrentTime');
  const durationEl  = document.getElementById('aDuration');

  // AB Loop
  const abIndicator = document.getElementById('abIndicator');
  const abStartLbl  = document.getElementById('abStartLabel');
  const abEndLbl    = document.getElementById('abEndLabel');
  const abClear     = document.getElementById('abClear');
  const abSetABtn   = document.getElementById('abSetA');
  const abSetBBtn   = document.getElementById('abSetB');
  const abToggleBtn = document.getElementById('abToggle');
  const abRegion    = document.getElementById('abRegion');
  const abAMarker   = document.getElementById('abAMarker');
  const abBMarker   = document.getElementById('abBMarker');

  // Playlist
  const playlistEl  = document.getElementById('audioPlaylistItems');

  // State
  let playlist     = [];
  let currentIndex = 0;
  let shuffled     = false;
  let repeatMode   = 0; // 0=off, 1=all, 2=one
  let isDragging   = false;

  // AB Loop state
  let abEnabled = false;
  let abA       = null;
  let abB       = null;

  // Build playlist
  function buildPlaylist() {
    playlist = [];
    playlistEl.querySelectorAll('.playlist-item').forEach((li, i) => {
      playlist.push({
        id:    li.dataset.id,
        url:   li.dataset.url,
        title: li.dataset.title,
        owner: li.dataset.owner || '',
        el:    li,
      });
      li.addEventListener('click', () => loadTrack(i));
    });
  }

  function openModal(url, title, owner, startId) {
    buildPlaylist();
    const idx = playlist.findIndex(t => t.url === url || t.id === startId);
    currentIndex = idx >= 0 ? idx : 0;

    if (idx < 0) {
      playlist.unshift({ id: startId, url, title, owner: owner || '', el: null });
      currentIndex = 0;
    }

    modal.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
    loadTrack(currentIndex);
  }

  function closeModal() {
    audio.pause();
    audio.src = '';
    artEl.classList.remove('playing');
    modal.classList.add('hidden');
    document.body.style.overflow = '';
  }

  function loadTrack(index) {
    if (index < 0 || index >= playlist.length) return;
    currentIndex = index;
    const track = playlist[index];

    titleEl.textContent      = track.title;
    trackName.textContent    = track.title;
    trackOwner.textContent   = track.owner;
    audio.src = track.url;
    audio.load();
    audio.play().catch(() => {});
    resetAB();
    updatePlaylistActive();
  }

  function updatePlaylistActive() {
    playlistEl.querySelectorAll('.playlist-item').forEach((li, i) => {
      li.classList.toggle('active', i === currentIndex);
    });
    const active = playlistEl.querySelector('.playlist-item.active');
    if (active) active.scrollIntoView({ block: 'nearest' });
  }

  // Play / Pause
  function togglePlay() {
    if (audio.paused) audio.play();
    else audio.pause();
  }

  audio.addEventListener('play', () => {
    playBtn.textContent = '⏸';
    artEl.classList.add('playing');
  });

  audio.addEventListener('pause', () => {
    playBtn.textContent = '▶';
    artEl.classList.remove('playing');
  });

  // Progress
  audio.addEventListener('timeupdate', () => {
    if (isDragging) return;

    // AB loop check
    if (abEnabled && abA !== null && abB !== null) {
      if (audio.currentTime >= abB) {
        audio.currentTime = abA;
      }
    }

    const pct = audio.duration ? (audio.currentTime / audio.duration) * 100 : 0;
    playedEl.style.width  = pct + '%';
    thumbEl.style.left    = pct + '%';
    currentEl.textContent = fmtTime(audio.currentTime);
  });

  audio.addEventListener('durationchange', () => {
    durationEl.textContent = fmtTime(audio.duration);
    updateABMarkers();
  });

  audio.addEventListener('ended', () => {
    if (abEnabled && abA !== null && abB !== null) {
      audio.currentTime = abA;
      audio.play();
      return;
    }
    if (repeatMode === 2) {
      audio.currentTime = 0;
      audio.play();
    } else {
      playNext();
    }
  });

  // Seek
  function seekTo(e) {
    const rect = progressBar.getBoundingClientRect();
    const pct  = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    if (audio.duration) audio.currentTime = pct * audio.duration;
  }

  progressBar.addEventListener('mousedown', (e) => { isDragging = true; seekTo(e); });
  document.addEventListener('mousemove',    (e) => { if (isDragging) seekTo(e); });
  document.addEventListener('mouseup',      ()  => { isDragging = false; });

  // Touch seek
  progressBar.addEventListener('touchstart', (e) => {
    isDragging = true;
    seekTo(e.touches[0]);
    e.preventDefault();
  }, { passive: false });

  document.addEventListener('touchmove', (e) => {
    if (isDragging) seekTo(e.touches[0]);
  });

  document.addEventListener('touchend', () => { isDragging = false; });

  // Volume
  volumeEl.addEventListener('input', () => {
    audio.volume = volumeEl.value;
    muteBtn.textContent = audio.volume === 0 ? '🔇' : '🔊';
  });

  muteBtn.addEventListener('click', () => {
    audio.muted = !audio.muted;
    muteBtn.textContent = audio.muted ? '🔇' : '🔊';
  });

  // Speed
  speedSel.addEventListener('change', () => {
    audio.playbackRate = parseFloat(speedSel.value);
  });

  // Shuffle
  shuffleBtn.addEventListener('click', () => {
    shuffled = !shuffled;
    shuffleBtn.classList.toggle('active', shuffled);
  });

  // Repeat modes: 0 → 1 → 2 → 0
  const repeatIcons = ['🔁', '🔂', '🔄'];
  const repeatTitles = ['Repeat: Off', 'Repeat: All', 'Repeat: One'];

  repeatBtn.addEventListener('click', () => {
    repeatMode = (repeatMode + 1) % 3;
    repeatBtn.textContent = repeatIcons[repeatMode];
    repeatBtn.title       = repeatTitles[repeatMode];
    repeatBtn.classList.toggle('active', repeatMode > 0);
  });

  // Prev / Next
  function playPrev() {
    if (audio.currentTime > 3) {
      audio.currentTime = 0;
      return;
    }
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
    } else if (repeatMode === 1) {
      currentIndex = (currentIndex + 1) % playlist.length;
    } else {
      if (currentIndex < playlist.length - 1) {
        currentIndex++;
      } else {
        return; // Stop at end
      }
    }
    loadTrack(currentIndex);
  }

  prevBtn.addEventListener('click', playPrev);
  nextBtn.addEventListener('click', playNext);

  // ===== AB LOOP =====
  abSetABtn.addEventListener('click', () => {
    abA = audio.currentTime;
    abSetABtn.classList.add('active');
    abStartLbl.textContent = fmtTime(abA);
    abIndicator.style.display = 'flex';
    updateABMarkers();
  });

  abSetBBtn.addEventListener('click', () => {
    if (abA === null) return;
    abB = audio.currentTime;
    if (abB <= abA) {
      abB = null;
      return;
    }
    abSetBBtn.classList.add('active');
    abEndLbl.textContent = fmtTime(abB);
    updateABMarkers();
  });

  abToggleBtn.addEventListener('click', () => {
    if (abA === null || abB === null) return;
    abEnabled = !abEnabled;
    abToggleBtn.textContent = `AB Loop: ${abEnabled ? 'ON' : 'OFF'}`;
    abToggleBtn.classList.toggle('active', abEnabled);
    abRegion.style.display    = abEnabled ? 'block' : 'none';
  });

  abClear.addEventListener('click', resetAB);

  function resetAB() {
    abA = null; abB = null; abEnabled = false;
    abSetABtn.classList.remove('active');
    abSetBBtn.classList.remove('active');
    abToggleBtn.classList.remove('active');
    abToggleBtn.textContent   = 'AB Loop: OFF';
    abIndicator.style.display = 'none';
    abRegion.style.display    = 'none';
    abAMarker.style.display   = 'none';
    abBMarker.style.display   = 'none';
  }

  function updateABMarkers() {
    if (!audio.duration) return;

    if (abA !== null) {
      const pctA = (abA / audio.duration) * 100;
      abAMarker.style.display = 'block';
      abAMarker.style.left    = pctA + '%';
    }

    if (abB !== null) {
      const pctB = (abB / audio.duration) * 100;
      abBMarker.style.display = 'block';
      abBMarker.style.left    = pctB + '%';

      if (abA !== null) {
        const pctA = (abA / audio.duration) * 100;
        abRegion.style.left  = pctA + '%';
        abRegion.style.width = (pctB - pctA) + '%';
      }
    }
  }

  // Close
  closeBtn.addEventListener('click', closeModal);
  backdrop.addEventListener('click', closeModal);

  // Keyboard
  document.addEventListener('keydown', (e) => {
    if (modal.classList.contains('hidden')) return;
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT') return;
    switch (e.key) {
      case ' ':
        e.preventDefault(); togglePlay(); break;
      case 'ArrowRight':
        e.preventDefault(); audio.currentTime = Math.min(audio.duration, audio.currentTime + 5); break;
      case 'ArrowLeft':
        e.preventDefault(); audio.currentTime = Math.max(0, audio.currentTime - 5); break;
      case 'Escape':
        closeModal(); break;
      case 'n':
        playNext(); break;
      case 'p':
        playPrev(); break;
    }
  });

  // Expose globally
  window.openAudioPlayer = openModal;

  function fmtTime(s) {
    if (!s || isNaN(s)) return '0:00';
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec.toString().padStart(2, '0')}`;
  }

})();