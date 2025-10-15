console.log("✅ camera.js loaded");
// ============================
// Scanner — Native first, ZXing fallback
// ============================
let started = false;
let activeScanner = 'none'; // 'native' | 'zxing' | 'none'
let videoElem = null;
let nativeDetector = null;
let nativeRAF = 0;
let nativeStream = null;
let codeReader = null;
let zxingControls = null;
let currentDeviceId = null;

// --- Safe element lookups ---
// These IDs must match your HTML and ui.js

const httpsWarnEl = document.getElementById('httpsWarn');
const previewEl   = document.getElementById('preview');
const camSelect   = document.getElementById('cameras');
const startButton = document.getElementById('start');
const stopButton  = document.getElementById('stop');


// --- Guard helpers ---
function safeHide(el) { if (el) el.hidden = true; }
function safeShow(el) { if (el) el.hidden = false; }
function safeClassRemove(el, cls) { if (el?.classList) el.classList.remove(cls); }
function safeSetStatus(txt, cls) {
  if (typeof setStatus === 'function') setStatus(txt, cls);
  else console.log(txt);
}

// --- Main functions ---
function ensureVideoContainer() {
  if (!previewEl) return console.error('Missing #preview element');
  if (!videoElem) {
    videoElem = document.createElement('video');
    videoElem.setAttribute('playsinline', 'true');
    videoElem.autoplay = true;
    videoElem.muted = true;
    videoElem.style.width = '100%';
    videoElem.style.maxHeight = '320px';
    videoElem.style.objectFit = 'cover';
  }
  previewEl.innerHTML = '';
  previewEl.appendChild(videoElem);
  safeShow(previewEl);
}

async function enumerateCameras() {
  const all = await navigator.mediaDevices.enumerateDevices();
  return all.filter((d) => d.kind === 'videoinput');
}

async function listCameras() {
  if (!camSelect) return console.error('Missing #cameras element');
  const vids = await enumerateCameras();
  camSelect.innerHTML = '';
  vids.forEach((d, i) => {
    const opt = document.createElement('option');
    opt.value = d.deviceId;
    opt.textContent = d.label || `Camera ${i + 1}`;
    camSelect.appendChild(opt);
  });
  camSelect.disabled = vids.length <= 1;
  if (!currentDeviceId && vids[0]) {
    const rear = vids.find((v) => /back|rear|environment/i.test(v.label));
    currentDeviceId = (rear || vids[0]).deviceId;
  }
  if (currentDeviceId) camSelect.value = currentDeviceId;
}

function stopScan() {
  try { cancelAnimationFrame(nativeRAF); } catch {}
  nativeRAF = 0;

  try { nativeStream?.getTracks().forEach((t) => t.stop()); } catch {}
  nativeStream = null;
  nativeDetector = null;

  try { zxingControls?.stop?.(); } catch {}
  try { codeReader?.reset?.(); } catch {}
  zxingControls = null;

  try { videoElem?.pause?.(); } catch {}
  if (videoElem) {
    try { videoElem.srcObject?.getTracks().forEach((t) => t.stop()); } catch {}
    videoElem.srcObject = null;
    try { videoElem.load?.(); } catch {}
  }

  activeScanner = 'none';
  started = false;
  safeSetStatus('stopped');
  if (startButton) startButton.disabled = false;
  if (stopButton) stopButton.disabled = true;
  safeHide(previewEl);
}

async function startCameraPreview(deviceId) {
  ensureVideoContainer();

  const constraints = {
    audio: false,
    video: {
      deviceId: deviceId ? { exact: deviceId } : undefined,
      facingMode: deviceId ? undefined : { ideal: 'environment' },
      width: { ideal: 1280 },
      height: { ideal: 720 },
      frameRate: { ideal: 30 },
    },
  };

  const stream = await navigator.mediaDevices.getUserMedia(constraints);
  videoElem.srcObject = stream;
  await videoElem.play().catch(() => {});
  await new Promise((r) => {
    if (videoElem.videoWidth > 0) return r();
    const t = setInterval(() => {
      if (videoElem.videoWidth > 0) {
        clearInterval(t);
        r();
      }
    }, 50);
  });
  return stream;
}

async function startScanNative() {
  if (!('BarcodeDetector' in window))
    throw new Error('BarcodeDetector API not available');

  const supported = await window.BarcodeDetector.getSupportedFormats();
  const wants = ['ean_13', 'upc_a', 'upc_e', 'ean_8'];
  const usable = wants.filter((f) => supported.includes(f));
  if (!usable.length) throw new Error('BarcodeDetector formats not supported');

  const deviceId = camSelect?.value || currentDeviceId || undefined;
  currentDeviceId = deviceId;

  nativeStream = await startCameraPreview(deviceId);
  nativeDetector = new window.BarcodeDetector({ formats: usable });

  const tick = async () => {
    nativeRAF = requestAnimationFrame(tick);
    try {
      const codes = await nativeDetector.detect(videoElem);
      if (codes && codes.length) {
        const code = codes[0].rawValue;
        if (typeof beep === 'function') beep(1000, 140);
        safeSetStatus(`found ${code}`, 'pill ok');
        if (codeInput) codeInput.value = code;
        stopScan();
        if (typeof lookupBarcode === 'function') lookupBarcode(code);
      }
    } catch (err) {
      if (err && (err.name ?? '') !== 'NotFoundError')
        console.warn('Native error:', err);
    }
  };
  tick();
  activeScanner = 'native';
}

async function startScanZXing() {
  if (!codeReader) codeReader = new ZXingBrowser.BrowserMultiFormatReader();
  const deviceId = camSelect?.value || currentDeviceId || undefined;
  currentDeviceId = deviceId;
  ensureVideoContainer();

  const decodeCallback = (result, err, controls) => {
    if (controls && !zxingControls) zxingControls = controls;
    if (result && result.getText) {
      const code = result.getText();
      if (typeof beep === 'function') beep(1000, 140);
      safeSetStatus(`found ${code}`, 'pill ok');
      if (codeInput) codeInput.value = code;
      stopScan();
      if (typeof lookupBarcode === 'function') lookupBarcode(code);
      return;
    }
    if (err && (err.name ?? '') !== 'NotFoundException') {
      console.warn('ZXing error:', err);
    }
  };

  const constraints = {
    audio: false,
    video: {
      deviceId: deviceId ? { exact: deviceId } : undefined,
      facingMode: deviceId ? undefined : { ideal: 'environment' },
      width: { ideal: 1280 },
      height: { ideal: 720 },
      frameRate: { ideal: 30 },
    },
  };

  zxingControls = await codeReader.decodeFromConstraints(
    constraints,
    videoElem,
    decodeCallback
  );
  try { await videoElem.play(); } catch {}
  activeScanner = 'zxing';
}

async function startScan() {
  if (started) return;
  started = true;
  safeSetStatus('starting…');
  if (startButton) startButton.disabled = true;
  if (stopButton) stopButton.disabled = false;

  try {
    const devId = camSelect?.value || currentDeviceId || undefined;
    const smoke = await startCameraPreview(devId);
    smoke.getTracks().forEach((t) => t.stop());
  } catch (e) {
    started = false;
    if (startButton) startButton.disabled = false;
    if (stopButton) stopButton.disabled = true;
    return console.error(e);
  }

  console.log('Starting scan — native support:', 'BarcodeDetector' in window);
  try {
    await startScanNative();
    safeSetStatus('scanning…', 'pill');
  } catch (e1) {
    console.warn('Native unavailable:', e1?.message || e1);
    try {
      await startScanZXing();
      safeSetStatus('scanning… (ZXing)', 'pill warn');
    } catch (e2) {
      started = false;
      safeHide(previewEl);
      if (startButton) startButton.disabled = false;
      if (stopButton) stopButton.disabled = true;
      console.error(e2);
    }
  }
}

async function warmupPermissions() {
  const s = await navigator.mediaDevices.getUserMedia({
    video: {
      facingMode: { ideal: 'environment' },
      width: { ideal: 640 },
      height: { ideal: 360 },
    },
    audio: false,
  });
  s.getTracks().forEach((t) => t.stop());
}

async function init() {
  try {
    if (location.protocol !== 'https:' && location.hostname !== 'localhost') {
      safeClassRemove(httpsWarnEl, 'hidden');
      return; // need HTTPS for camera access
    }
    await warmupPermissions();
    await new Promise((r) => setTimeout(r, 100));
    await listCameras();
    safeSetStatus('cameras ready', 'pill ok');
  } catch (e) {
    safeSetStatus('allow camera to list devices', 'pill warn');
  }
}

document.addEventListener('DOMContentLoaded', init);
