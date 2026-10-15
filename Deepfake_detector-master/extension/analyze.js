const API_URL = 'http://127.0.0.1:5002';

let cachedFile = null;
let currentAction = 'analyze';

function showResult(status, label, detail) {
  const result = document.getElementById('analyze-result');
  result.className = `result show ${status}`;
  result.innerHTML = `
    <div class="result-label">${label}</div>
    <div class="result-detail">${detail}</div>
  `;
}

async function checkServer() {
  const statusDot = document.querySelector('.status-dot');
  const statusText = document.querySelector('.status-text');
  try {
    const response = await fetch(`${API_URL}/health`, { method: 'GET' });
    if (response.ok) {
      statusDot.className = 'status-dot online';
      statusText.textContent = 'Server connected';
    } else {
      throw new Error();
    }
  } catch {
    statusDot.className = 'status-dot offline';
    statusText.textContent = 'Server offline (start app.py)';
  }
}

async function switchAction(action) {
  currentAction = action;
  document.getElementById('btn-mode-analyze').classList.toggle('active', action === 'analyze');
  document.getElementById('btn-mode-restore').classList.toggle('active', action === 'restore');
  
  if (!cachedFile) return;

  if (action === 'analyze') {
    document.getElementById('restore-comp-area').style.display = 'none';
    await executeAnalyze();
  } else {
    await executeRestore();
  }
}

async function executeAnalyze() {
  const loading = document.getElementById('analyze-loading');
  const loadingLabel = document.getElementById('loading-label');
  const result = document.getElementById('analyze-result');

  loading.classList.add('show');
  loadingLabel.textContent = 'Evaluating deepfake probability...';
  result.classList.remove('show');

  const formData = new FormData();
  formData.append('file', cachedFile);
  formData.append('type', 'image');

  try {
    const response = await fetch(`${API_URL}/analyze`, {
      method: 'POST',
      body: formData,
    });
    const data = await response.json();
    loading.classList.remove('show');

    if (data.error) {
      showResult('error', 'Error', data.error);
    } else {
      const isFake = data.is_fake;
      const fakePct = data.fake_probability;
      const realPct = data.real_probability;
      const label = isFake ? 'Manipulated / Deepfake' : 'Authentic Photograph';
      const message = isFake
        ? `Synthetic Manipulation Detected (${fakePct}% probability)`
        : `Authenticity Verified (${realPct}% confidence)`;
      showResult(isFake ? 'fake' : 'real', label, message);
    }
  } catch (err) {
    loading.classList.remove('show');
    showResult('error', 'Connection Offline', 'Ensure backend is running: python app.py (port 5002)');
  }
}

async function executeRestore() {
  const loading = document.getElementById('analyze-loading');
  const loadingLabel = document.getElementById('loading-label');
  const result = document.getElementById('analyze-result');
  const compArea = document.getElementById('restore-comp-area');

  loading.classList.add('show');
  loadingLabel.textContent = 'Restoring and enhancing image...';
  result.classList.remove('show');
  compArea.style.display = 'none';

  const formData = new FormData();
  formData.append('file', cachedFile);
  formData.append('mode', 'auto');

  try {
    const response = await fetch(`${API_URL}/restore`, {
      method: 'POST',
      body: formData,
    });
    const data = await response.json();
    loading.classList.remove('show');

    if (data.error) {
      showResult('error', 'Restoration Error', data.error);
    } else {
      showResult('real', '✨ Restoration Complete', `${data.metrics.resolution} • Noise: -${data.metrics.noise_reduction} • Sharp: ${data.metrics.sharpness_gain}`);
      
      document.getElementById('comp-orig-img').src = data.original_image;
      document.getElementById('comp-rest-img').src = data.restored_image;
      
      const dlBtn = document.getElementById('ext-download-btn');
      dlBtn.href = data.restored_image;
      dlBtn.download = data.filename || 'restored_image.jpg';

      compArea.style.display = 'block';
    }
  } catch (err) {
    loading.classList.remove('show');
    showResult('error', 'Connection Offline', 'Ensure backend is running: python app.py (port 5002)');
  }
}

async function run() {
  const params = new URLSearchParams(window.location.search);
  const src = params.get('src');
  const actionParam = params.get('action') || 'analyze';
  currentAction = actionParam;

  document.getElementById('btn-mode-analyze').classList.toggle('active', currentAction === 'analyze');
  document.getElementById('btn-mode-restore').classList.toggle('active', currentAction === 'restore');

  const hint = document.getElementById('source-hint');
  const loading = document.getElementById('analyze-loading');
  const loadingLabel = document.getElementById('loading-label');
  const preview = document.getElementById('analyze-preview');

  if (!src) {
    loading.classList.remove('show');
    showResult('error', 'Missing image', 'No image URL was provided.');
    return;
  }

  hint.textContent = src.length > 100 ? `${src.slice(0, 100)}…` : src;

  if (src.startsWith('file:')) {
    loading.classList.remove('show');
    showResult(
      'error',
      'Cannot load local file directly',
      'Local file URLs cannot be fetched from extension context. Save the image and upload directly in the extension popup.',
    );
    return;
  }

  let blob;
  try {
    loadingLabel.textContent = 'Downloading image from page...';
    const response = await fetch(src);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    blob = await response.blob();
  } catch (e) {
    loading.classList.remove('show');
    showResult(
      'error',
      'Could not download image',
      'The website may block external image fetching or require a session login.',
    );
    return;
  }

  const ext = blob.type === 'image/png' ? 'png' : blob.type === 'image/webp' ? 'webp' : 'jpg';
  cachedFile = new File([blob], `web_image.${ext}`, { type: blob.type || 'image/jpeg' });

  const img = document.createElement('img');
  img.src = URL.createObjectURL(blob);
  img.alt = 'Preview';
  preview.innerHTML = '';
  preview.appendChild(img);

  if (currentAction === 'restore') {
    await executeRestore();
  } else {
    await executeAnalyze();
  }
}

checkServer();
run();
