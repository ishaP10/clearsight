const API_URL = 'http://127.0.0.1:5002';
const files = { image: null, video: null, restore: null };
let currentRestoreMode = 'auto';

// Tab switching
document.querySelectorAll('.tab').forEach(tab => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
    
    tab.classList.add('active');
    document.getElementById(`${tab.dataset.tab}-tab`).classList.add('active');
  });
});

// Restore preset selection
document.querySelectorAll('.preset-pill').forEach(pill => {
  pill.addEventListener('click', () => {
    document.querySelectorAll('.preset-pill').forEach(p => p.classList.remove('active'));
    pill.classList.add('active');
    currentRestoreMode = pill.dataset.mode;
  });
});

// Upload area click handlers
document.querySelectorAll('.upload-area').forEach(area => {
  const type = area.dataset.type;
  const input = document.getElementById(`${type}-input`);
  
  area.addEventListener('click', () => input.click());
  
  area.addEventListener('dragover', (e) => {
    e.preventDefault();
    area.classList.add('dragover');
  });
  
  area.addEventListener('dragleave', () => {
    area.classList.remove('dragover');
  });
  
  area.addEventListener('drop', (e) => {
    e.preventDefault();
    area.classList.remove('dragover');
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0], type);
    }
  });
});

// File input handlers
document.querySelectorAll('input[type="file"]').forEach(input => {
  const type = input.id.replace('-input', '');
  input.addEventListener('change', (e) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0], type);
    }
  });
});

function handleFile(file, type) {
  if (!file) return;
  
  files[type] = file;
  document.getElementById(`${type}-filename`).textContent = file.name;
  document.getElementById(`${type}-btn`).disabled = false;
  document.getElementById(`${type}-result`).classList.remove('show');
  
  const preview = document.getElementById(`${type}-preview`);
  preview.innerHTML = '';
  
  const url = URL.createObjectURL(file);
  
  if (type === 'image' || type === 'restore') {
    const img = document.createElement('img');
    img.src = url;
    preview.appendChild(img);
  } else if (type === 'video') {
    const video = document.createElement('video');
    video.src = url;
    video.controls = true;
    preview.appendChild(video);
  }
}

// Action button handlers
document.getElementById('image-btn').addEventListener('click', () => runAnalysis('image'));
document.getElementById('video-btn').addEventListener('click', () => runAnalysis('video'));
document.getElementById('restore-btn').addEventListener('click', () => runRestore());

async function runAnalysis(type) {
  const file = files[type];
  if (!file) return;
  
  const btn = document.getElementById(`${type}-btn`);
  const loading = document.getElementById(`${type}-loading`);
  const result = document.getElementById(`${type}-result`);
  
  btn.style.display = 'none';
  loading.classList.add('show');
  result.classList.remove('show', 'real', 'fake', 'error');
  
  const formData = new FormData();
  formData.append('file', file);
  formData.append('type', type);
  
  try {
    const response = await fetch(`${API_URL}/analyze`, {
      method: 'POST',
      body: formData
    });
    
    const data = await response.json();
    loading.classList.remove('show');
    btn.style.display = 'block';
    
    if (data.error) {
      showResult(type, 'error', 'Analysis Error', data.error);
    } else {
      const isFake = data.is_fake;
      const fakePct = data.fake_probability;
      const realPct = data.real_probability;
      const label = isFake ? 'Manipulated / Deepfake' : 'Authentic Media';
      const msg = isFake
        ? `Fake Confidence: ${fakePct}% (Real: ${realPct}%)`
        : `Authenticity Confidence: ${realPct}% (Fake: ${fakePct}%)`;
      
      showResult(type, isFake ? 'fake' : 'real', label, msg);
    }
  } catch (error) {
    loading.classList.remove('show');
    btn.style.display = 'block';
    showResult(type, 'error', 'Connection Offline', 'Ensure local backend is running: python app.py (port 5002)');
  }
}

async function runRestore() {
  const file = files.restore;
  if (!file) return;

  const btn = document.getElementById('restore-btn');
  const loading = document.getElementById('restore-loading');
  const result = document.getElementById('restore-result');

  btn.style.display = 'none';
  loading.classList.add('show');
  result.classList.remove('show', 'real', 'error');

  const formData = new FormData();
  formData.append('file', file);
  formData.append('mode', currentRestoreMode);

  try {
    const response = await fetch(`${API_URL}/restore`, {
      method: 'POST',
      body: formData
    });

    const data = await response.json();
    loading.classList.remove('show');
    btn.style.display = 'block';

    if (data.error) {
      showResult('restore', 'error', 'Restoration Error', data.error);
    } else {
      result.className = 'result show real';
      result.innerHTML = `
        <div class="result-label" style="color: #06b6d4;">✨ Restoration Complete</div>
        <div class="result-detail" style="margin-bottom: 10px;">
          Resolution: ${data.metrics.resolution} • Noise: -${data.metrics.noise_reduction} • Sharp: ${data.metrics.sharpness_gain}
        </div>
        <div style="margin: 10px 0; border-radius: 8px; overflow: hidden; background: #000;">
          <img src="${data.restored_image}" style="width: 100%; max-height: 180px; object-fit: contain; display: block;" alt="Restored">
        </div>
        <a href="${data.restored_image}" download="${data.filename || 'restored.jpg'}" class="download-link">
          ⬇ Download Restored Image
        </a>
      `;
    }
  } catch (err) {
    loading.classList.remove('show');
    btn.style.display = 'block';
    showResult('restore', 'error', 'Server Offline', 'Ensure backend is running on port 5002.');
  }
}

function showResult(type, status, label, detail) {
  const result = document.getElementById(`${type}-result`);
  result.className = `result show ${status}`;
  result.innerHTML = `
    <div class="result-label">${label}</div>
    <div class="result-detail">${detail}</div>
  `;
}

// Server Health Check
async function checkServer() {
  const statusDot = document.querySelector('.status-dot');
  const statusText = document.querySelector('.status-text');
  
  try {
    const response = await fetch(`${API_URL}/health`, { method: 'GET' });
    if (response.ok) {
      statusDot.className = 'status-dot online';
      statusText.textContent = 'Server connected (5002)';
    } else {
      throw new Error();
    }
  } catch {
    statusDot.className = 'status-dot offline';
    statusText.textContent = 'Server offline (start app.py)';
  }
}

checkServer();
setInterval(checkServer, 10000);
