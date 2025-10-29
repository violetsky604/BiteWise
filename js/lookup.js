// BiteWise Scanner v30 — Native first, ZXing fallback (no Quagga)

// ============================
// Config
// ============================
const API_BASE = ""; // leave empty to query Open Food Facts directly

// ============================
// DOM
// ============================
const preview   = document.getElementById('preview');
const out       = document.getElementById('out');
const startBtn  = document.getElementById('start');
const stopBtn   = document.getElementById('stop');
const camSel    = document.getElementById('cameras');
const codeIn    = document.getElementById('codeInput');
const searchBtn = document.getElementById('search');
const statusEl  = document.getElementById('status');
const httpsWarn = document.getElementById('httpsWarn');

// ============================
// Helpers
// ============================
const fmt = v => (v==null || v==='') ? '—' : Number(v).toFixed(1).replace(/\.0$/,'');
const setStatus = (t, cls='pill') => { statusEl.className = 'tiny ' + cls; statusEl.textContent = t; };
function showMessage(msg, cls='muted'){ out.className = 'card ' + cls; out.textContent = msg; }
function logErr(e){
  console.error(e);
  setStatus('error', 'pill err');
  const msg = e?.message || (typeof e === 'string' ? e : JSON.stringify(e));
  showMessage(`Camera/API error: ${msg}`, 'err');
}

function showFood(food) {
  const { name, brand, serving_size, serving_unit, calories, protein, carbs, fat, barcode } = food;
  out.className = 'card';
  out.innerHTML = `
    <div><strong>${name || 'Unknown'}</strong>${brand ? ' — ' + brand : ''}</div>
    <div class="muted" style="margin-top:4px;">
      ${barcode ? `Barcode: ${barcode} • ` : ''}Serving: ${fmt(serving_size)} ${serving_unit || ''}
    </div>
    <div class="grid">
      <div>Calories: <strong>${fmt(calories)}</strong></div>
      <div>Protein: <strong>${fmt(protein)} g</strong></div>
      <div>Carbs:   <strong>${fmt(carbs)} g</strong></div>
      <div>Fat:     <strong>${fmt(fat)} g</strong></div>
    </div>
  `;
}

// ============================
// Beep (plays on detection)
// ============================
let audioCtx = null;
function ensureAudio(){ if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)(); }
function beep(freq=1000, ms=140){
  try {
    ensureAudio();
    const o = audioCtx.createOscillator();
    const g = audioCtx.createGain();
    o.type = 'square';
    o.frequency.value = freq;
    g.gain.value = 0.05;
    o.connect(g).connect(audioCtx.destination);
    o.start();
    setTimeout(()=>o.stop(), ms);
  } catch {}
}

// ============================
// Open Food Facts lookup
// ============================
async function fetchOFF(code){
  const r = await fetch(`https://world.openfoodfacts.org/api/v0/product/${encodeURIComponent(code)}.json`, {
    cache: 'no-store', headers: { 'Accept': 'application/json' }
  });
  return r.json();
}

async function lookupBarcodeVariants(raw){
  const c = (raw || '').replace(/\D/g,'');
  if (!c) throw new Error('Please enter or scan a barcode.');
  const candidates = Array.from(new Set([
    c,
    (c.length === 12) ? ('0' + c) : null,
    (c.length === 13 && c.startsWith('0')) ? c.slice(1) : null
  ].filter(Boolean)));
  showMessage('Looking up ' + candidates.join(' / ') + ' …');

  for (const code of candidates) {
    try {
      if (API_BASE) {
        const r = await fetch(`${API_BASE}/search/barcode?code=${encodeURIComponent(code)}`);
        const j = await r.json();
        if (!r.ok) throw new Error(j.error || 'Lookup failed');
        return { code, product: j, api: true };
      } else {
        const j = await fetchOFF(code);
        if (j.status === 1) return { code, product: j.product, api: false };
      }
    } catch (e) { /* try next */ }
  }
  throw new Error('Not found on Open Food Facts for: ' + candidates.join(' / '));
}

function mapProductToFood(code, p){
  const n = p?.nutriments || {};
  const servingQty  = Number(p?.serving_quantity) || 100;
  const servingUnit = (p?.serving_size || 'g').replace(/[0-9.\s]/g,'') || 'g';
  return {
    barcode: code,
    name: p?.product_name || p?.generic_name || 'Unknown',
    brand: p?.brands || null,
    serving_size: servingQty,
    serving_unit: servingUnit,
    calories: n['energy-kcal_serving'] ?? n['energy-kcal_100g'] ?? null,
    protein:  n['proteins_serving'] ?? n['proteins_100g'] ?? null,
    carbs:    n['carbohydrates_serving'] ?? n['carbohydrates_100g'] ?? null,
    fat:      n['fat_serving'] ?? n['fat_100g'] ?? null
  };
}

async function lookupBarcode(code){
  try {
    const res = await lookupBarcodeVariants(code);
    const food = res.api ? res.product : mapProductToFood(res.code, res.product);
    showFood(food);
  } catch (e) { logErr(e); }
}

// ============================
// Scanner — Native first, ZXing fallback
// ============================
let started = false;
let activeScanner = 'none';   // 'native' | 'zxing' | 'none'
let videoElem = null;
let nativeDetector = null;
let nativeRAF = 0;
let nativeStream = null;
let codeReader = null;        // ZXing controls
let zxingControls = null;
let currentDeviceId = null;

function ensureVideoContainer(){
  if (!videoElem) {
    videoElem = document.createElement('video');
    videoElem.setAttribute('playsinline', 'true');
    videoElem.playsInline = true;
    videoElem.autoplay = true;
    videoElem.muted = true;
    videoElem.style.width = '100%';
    videoElem.style.maxHeight = '320px';
    videoElem.style.objectFit = 'cover';
  }
  preview.innerHTML = '';
  preview.appendChild(videoElem);
  preview.hidden = false;
}

async function enumerateCameras(){
  const all = await navigator.mediaDevices.enumerateDevices();
  return all.filter(d => d.kind === 'videoinput');
}

async function listCameras(){
  const vids = await enumerateCameras();
  camSel.innerHTML = '';
  vids.forEach((d,i) => {
    const opt = document.createElement('option');
    opt.value = d.deviceId; opt.textContent = d.label || `Camera ${i+1}`;
    camSel.appendChild(opt);
  });
  camSel.disabled = vids.length <= 1;
  if (!currentDeviceId && vids[0]) {
    // Prefer rear cameras if labels are visible
    const rear = vids.find(v => /back|rear|environment/i.test(v.label));
    currentDeviceId = (rear || vids[0]).deviceId;
  }
  if (currentDeviceId) camSel.value = currentDeviceId;
}

function stopNative(){
  try { cancelAnimationFrame(nativeRAF); } catch {}
  nativeRAF = 0;
  try { nativeStream?.getTracks().forEach(t => t.stop()); } catch {}
  nativeStream = null;
  nativeDetector = null;
}

function stopZXing(){
  try { zxingControls?.stop(); } catch {}
  try { videoElem?.srcObject && videoElem.srcObject.getTracks().forEach(t=>t.stop()); } catch {}
  zxingControls = null;
}

function stopScan(){
  if (activeScanner === 'native') stopNative();
  if (activeScanner === 'zxing')  stopZXing();
  activeScanner = 'none';
  started = false;
  setStatus('stopped');
  startBtn.disabled = false;
  stopBtn.disabled  = true;
  preview.hidden = true;
}

// --- Step A: Camera smoke test (attach stream, no decoding yet) ---
async function startCameraPreview(deviceId){
  ensureVideoContainer();

  const constraints = {
    audio: false,
    video: {
      deviceId: deviceId ? { exact: deviceId } : undefined,
      facingMode: deviceId ? undefined : { ideal: 'environment' },
      width:  { ideal: 1280 },
      height: { ideal: 720 },
      frameRate: { ideal: 30 }
    }
  };

  const stream = await navigator.mediaDevices.getUserMedia(constraints);
  videoElem.srcObject = stream;
  await videoElem.play().catch(()=>{});
  // Wait until video has dimensions
  await new Promise(r => {
    if (videoElem.videoWidth > 0) return r();
    const t = setInterval(() => {
      if (videoElem.videoWidth > 0) { clearInterval(t); r(); }
    }, 50);
  });
  return stream;
}

// --- Step B: Native detector (Android Chrome) ---
async function startScanNative(){
  if (!('BarcodeDetector' in window)) throw new Error('BarcodeDetector API not available');

  const supported = await window.BarcodeDetector.getSupportedFormats();
  const wants = ['ean_13','upc_a','upc_e','ean_8'];
  const usable = wants.filter(f => supported.includes(f));
  if (!usable.length) throw new Error('BarcodeDetector formats not supported');

  const deviceId = camSel.value || currentDeviceId || undefined;
  currentDeviceId = deviceId;

  nativeStream = await startCameraPreview(deviceId);
  nativeDetector = new window.BarcodeDetector({ formats: usable });

  const tick = async () => {
    nativeRAF = requestAnimationFrame(tick);
    try {
      const codes = await nativeDetector.detect(videoElem);
      if (codes && codes.length) {
        const code = codes[0].rawValue;
        beep(1000, 140);
        setStatus(`found ${code}`, 'pill ok');
        codeIn.value = code;
        stopScan();
        lookupBarcode(code);
      }
    } catch (err) {
      if (err && (err.name ?? '') !== 'NotFoundError') console.warn('Native error:', err);
    }
  };
  tick();
  activeScanner = 'native';
}

// --- Step C: ZXing fallback (desktop / when native unavailable) ---
async function startScanZXing(){
  if (!codeReader) codeReader = new ZXingBrowser.BrowserMultiFormatReader();

  const deviceId = camSel.value || currentDeviceId || undefined;
  currentDeviceId = deviceId;

  ensureVideoContainer();

  const decodeCallback = (result, err, controls) => {
    if (controls && !zxingControls) zxingControls = controls;
    try {
      if (result && result.getText) {
        const code = result.getText();
        beep(1000, 140);
        setStatus(`found ${code}`, 'pill ok');
        codeIn.value = code;
        stopScan();
        lookupBarcode(code);
        return;
      }
      if (err && (err.name ?? '') !== 'NotFoundException') {
        console.warn('ZXing error:', err);
      }
    } catch (cbErr) {
      console.error('Callback error:', cbErr);
    }
  };

  const constraints = {
    audio: false,
    video: {
      deviceId: deviceId ? { exact: deviceId } : undefined,
      facingMode: deviceId ? undefined : { ideal: 'environment' },
      width:  { ideal: 1280 },
      height: { ideal: 720 },
      frameRate: { ideal: 30 }
    }
  };

  await codeReader.decodeFromConstraints(constraints, videoElem, decodeCallback);
  try { await videoElem.play(); } catch {}
  activeScanner = 'zxing';
}

// --- Orchestrator: prove camera, then scan ---
async function startScan(){
  if (started) return;
  started = true;
  setStatus('starting…');
  startBtn.disabled = true;
  stopBtn.disabled  = false;

  try {
    // First ensure permissions + a working stream (smoke test)
    const devId = camSel.value || currentDeviceId || undefined;
    const smoke = await startCameraPreview(devId);
    // if we got here, stream works. Stop it before decoder takes over.
    smoke.getTracks().forEach(t=>t.stop());
  } catch (e) {
    started = false;
    startBtn.disabled = false;
    stopBtn.disabled  = true;
    return logErr(e);
  }

  // Try Native, then ZXing if Native not available
  try {
    await startScanNative();
    setStatus('scanning…', 'pill');
  } catch (e1) {
    console.warn('Native unavailable:', e1?.message || e1);
    try {
      await startScanZXing();
      setStatus('scanning… (ZXing)', 'pill warn');
    } catch (e2) {
      started = false;
      preview.hidden = true;
      startBtn.disabled = false;
      stopBtn.disabled  = true;
      logErr(e2);
    }
  }
}

// ============================
// Camera permissions + listing (auto on load)
// ============================
async function warmupPermissions(){
  const s = await navigator.mediaDevices.getUserMedia({
    video: { facingMode: { ideal: "environment" }, width: { ideal: 640 }, height: { ideal: 360 } },
    audio: false
  });
  s.getTracks().forEach(t => t.stop());
}

(async function init(){
  try {
    if (location.protocol !== 'https:' && location.hostname !== 'localhost') {
      httpsWarn.classList.remove('hidden');
      return; // need HTTPS for camera access
    }
    await warmupPermissions();
    await new Promise(r => setTimeout(r, 100)); // helps Android enumerate devices
    await listCameras();
    setStatus('cameras ready', 'pill ok');
  } catch (e) {
    setStatus('allow camera to list devices', 'pill warn');
  }
})();

// ============================
// Events
// ============================
startBtn.addEventListener('click', async () => {
  try {
    if (location.protocol !== 'https:' && location.hostname !== 'localhost') {
      httpsWarn.classList.remove('hidden');
      throw new Error('HTTPS required for camera access.');
    } else {
      httpsWarn.classList.add('hidden');
    }
    ensureAudio();
    await startScan();
  } catch (e) { logErr(e); }
});

stopBtn.addEventListener('click', stopScan);
camSel.addEventListener('change', () => { currentDeviceId = camSel.value; if (started) { stopScan(); startScan(); } });

searchBtn.addEventListener('click', () => lookupBarcode(codeIn.value.trim()));
codeIn.addEventListener('keydown', (e) => { if (e.key === 'Enter') lookupBarcode(codeIn.value.trim()); });
