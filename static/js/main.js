/* PersonalCloud — Main JavaScript */

document.addEventListener('DOMContentLoaded', () => {

  // ===== Mobile Nav Toggle =====
  const navToggle = document.getElementById('navToggle');
  const navLinks = document.getElementById('navLinks');

  if (navToggle && navLinks) {
    navToggle.addEventListener('click', () => {
      navLinks.classList.toggle('open');
    });

    // Close nav on outside click
    document.addEventListener('click', (e) => {
      if (!navToggle.contains(e.target) && !navLinks.contains(e.target)) {
        navLinks.classList.remove('open');
      }
    });
  }

  // ===== Password Toggle =====
  document.querySelectorAll('.toggle-password').forEach(btn => {
    btn.addEventListener('click', () => {
      const targetId = btn.dataset.target;
      const input = document.getElementById(targetId);
      if (input) {
        if (input.type === 'password') {
          input.type = 'text';
          btn.textContent = '🙈';
        } else {
          input.type = 'password';
          btn.textContent = '👁';
        }
      }
    });
  });

  // ===== Tab System =====
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const tabId = btn.dataset.tab;

      document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
      document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));

      btn.classList.add('active');
      const target = document.getElementById('tab-' + tabId);
      if (target) target.classList.add('active');
    });
  });

  // ===== File Upload / Drag & Drop =====
  const dropArea = document.getElementById('dropArea');
  const fileInput = document.getElementById('fileInput');
  const filePreview = document.getElementById('filePreview');
  const uploadBtn = document.getElementById('uploadBtn');

  if (dropArea && fileInput) {
    // Drag events
    ['dragenter', 'dragover'].forEach(event => {
      dropArea.addEventListener(event, (e) => {
        e.preventDefault();
        dropArea.classList.add('dragover');
      });
    });

    ['dragleave', 'dragend', 'drop'].forEach(event => {
      dropArea.addEventListener(event, () => {
        dropArea.classList.remove('dragover');
      });
    });

    dropArea.addEventListener('drop', (e) => {
      e.preventDefault();
      const files = e.dataTransfer.files;
      if (files.length > 0) {
        fileInput.files = files;
        handleFileSelected(files[0]);
      }
    });

    fileInput.addEventListener('change', () => {
      if (fileInput.files.length > 0) {
        handleFileSelected(fileInput.files[0]);
      }
    });

    function handleFileSelected(file) {
      const sizeFmt = formatBytes(file.size);
      filePreview.innerHTML = `<strong>${escapeHtml(file.name)}</strong><br><small>${sizeFmt} · ${file.type || 'unknown type'}</small>`;
      filePreview.classList.remove('hidden');
      uploadBtn.disabled = false;
    }
  }

  // ===== Alert Auto-dismiss =====
  document.querySelectorAll('.alert').forEach(alert => {
    setTimeout(() => {
      alert.style.opacity = '0';
      alert.style.transform = 'translateX(20px)';
      alert.style.transition = '0.3s ease';
      setTimeout(() => alert.remove(), 300);
    }, 5000);
  });

  // ===== Client-side Register Form Validation =====
  const registerForm = document.getElementById('registerForm');
  if (registerForm) {
    registerForm.addEventListener('submit', (e) => {
      const p1 = document.getElementById('id_password1');
      const p2 = document.getElementById('id_password2');
      if (p1 && p2 && p1.value !== p2.value) {
        e.preventDefault();
        showTempAlert('Passwords do not match.', 'error');
        p2.focus();
      }
    });
  }

  // ===== Utilities =====
  function formatBytes(bytes) {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  }

  function escapeHtml(str) {
    const d = document.createElement('div');
    d.appendChild(document.createTextNode(str));
    return d.innerHTML;
  }

  function showTempAlert(message, type) {
    const container = document.querySelector('.messages-container') || createMessagesContainer();
    const alert = document.createElement('div');
    alert.className = `alert alert-${type}`;
    alert.innerHTML = `<span>${escapeHtml(message)}</span><button class="alert-close" onclick="this.parentElement.remove()">✕</button>`;
    container.appendChild(alert);
    setTimeout(() => {
      alert.style.opacity = '0';
      alert.style.transition = '0.3s ease';
      setTimeout(() => alert.remove(), 300);
    }, 4000);
  }

  function createMessagesContainer() {
    const c = document.createElement('div');
    c.className = 'messages-container';
    document.body.appendChild(c);
    return c;
  }

});

// ===== Media Play Buttons =====
document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.btn-play').forEach(btn => {
    btn.addEventListener('click', () => {
      const type  = btn.dataset.type;
      const url   = btn.dataset.url;
      const title = btn.dataset.title;
      const id    = btn.dataset.id;
      const owner = btn.dataset.owner || '';

      if (type === 'video' && window.openVideoPlayer) {
        window.openVideoPlayer(url, title, id);
      } else if (type === 'audio' && window.openAudioPlayer) {
        window.openAudioPlayer(url, title, owner, id);
      } else if (type === 'image' && window.openImageViewer) {
        window.openImageViewer(url, title);
      }
    });
  });
});