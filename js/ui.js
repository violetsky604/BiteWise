console.log("✅ ui.js loaded");
let currentDate = new Date();

// ============================
// Config
// ============================
const API_BASE = "";
const BACKEND_BASE = "/bitewise/php";

// ============================
// DOM
// ============================

const outEl     = document.getElementById('out');
const statusEl  = document.getElementById('status');
const codeInput = document.getElementById('codeInput');
const searchBtn = document.getElementById('search');

// ============================
// Helpers
// ============================
const fmt = v => (v==null || v==='') ? '—' : Number(v).toFixed(1).replace(/\.0$/,'');
const setStatus = (t, cls='pill') => {
  if (statusEl) {
    statusEl.className = 'tiny ' + cls;
    statusEl.textContent = t;
  }
};
function showMessage(msg, cls='muted'){
  if (outEl) {
    outEl.className = 'card ' + cls;
    outEl.textContent = msg;
  }
}
function logErr(e){
  console.error(e);
  setStatus('error', 'pill err');
  const msg = e?.message || (typeof e === 'string' ? e : JSON.stringify(e));
  showMessage(`Camera/API error: ${msg}`, 'err');
}

// ============================
// Beep
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
// Barcode Lookup
// ============================
async function fetchOFF(code){
  const r = await fetch(`https://world.openfoodfacts.org/api/v0/product/${encodeURIComponent(code)}.json`, {
    cache: 'no-store', headers: { 'Accept': 'application/json' }
  });
  return r.json();
}

async function lookupBarcode(code) {
  if (!code) return logErr('Please enter or scan a barcode.');
  setStatus('looking up…');
  try {
    const res = await fetch(`https://world.openfoodfacts.org/api/v0/product/${code}.json`);
    const data = await res.json();
    if (!data || !data.product) {
      outEl.textContent = 'Not found.';
      setStatus('not found');
      return;
    }
    const p = data.product;
    const food = {
      name: p.product_name || '(no name)',
      brand: p.brands,
      barcode: code,
      serving_size: p.serving_size,
      serving_unit: p.serving_size_unit,
      calories: p.nutriments['energy-kcal_100g'],
      protein: p.nutriments.proteins_100g,
      carbs: p.nutriments.carbohydrates_100g,
      fat: p.nutriments.fat_100g
    };
    showFoodResult(food);
  } catch (e) {
    logErr(e);
  }
}

// ============================
// Scanner + Buttons
// ============================
if (startButton) startButton.addEventListener('click', async () => {
  try {
    if (location.protocol !== 'https:' && location.hostname !== 'localhost') {
      httpsWarnEl?.classList.remove('hidden');
      throw new Error('HTTPS required for camera access.');
    } else {
      httpsWarnEl?.classList.add('hidden');
    }
    ensureAudio();
    console.log("🎥 Starting scan...");
    await startScan(); // from camera.js
  } catch (e) { logErr(e); }
});

if (stopButton) stopButton.addEventListener('click', () => {
  console.log('[Stop] clicked');
  stopScan(); // from camera.js
});

if (camSelect) camSelect.addEventListener('change', () => {
  currentDeviceId = camSelect.value;
  if (started) { stopScan(); startScan(); }
});

if (searchBtn) searchBtn.addEventListener('click', () => lookupBarcode(codeInput.value.trim()));
if (codeInput) codeInput.addEventListener('keydown', e => {
  if (e.key === 'Enter') lookupBarcode(codeInput.value.trim());
});

// ============================
// Food saving + rendering
// ============================
function saveFoodToLocal(food) {
  const key = 'bw_myfoods';
  const foods = JSON.parse(localStorage.getItem(key) || '[]');
  const day = currentDate.toISOString().slice(0,10);
  foods.push({ ...food, date: day });
  localStorage.setItem(key, JSON.stringify(foods));
  renderTodayFoods();
}

function showFoodResult(food) {
  outEl.classList.remove('muted');
  outEl.innerHTML = `
    <div style="border:1px solid #eee;border-radius:8px;padding:10px;">
      <strong>${food.name}</strong>${food.brand ? ' — ' + food.brand : ''}<br>
      ${food.barcode ? 'Barcode: '+food.barcode+' • ' : ''}Serving: ${food.serving_size ?? '—'} ${food.serving_unit ?? ''}<br>
      kcal: ${food.calories ?? '—'} • P: ${food.protein ?? '—'}g • C: ${food.carbs ?? '—'}g • F: ${food.fat ?? '—'}g
      <div style="margin-top:8px;">
        <button id="saveFoodBtn" class="btn">💾 Save</button>
      </div>
    </div>
  `;
  document.getElementById('saveFoodBtn').onclick = () => saveFoodToLocal(food);
}

function renderTodayFoods() {
  const box = document.getElementById('todayBox');
  const label = document.getElementById('dateLabel');
  const totalBox = document.getElementById('totalBox');
  if (!box || !label || !totalBox) return;

  box.innerHTML = '';
  const key = 'bw_myfoods';
  const foods = JSON.parse(localStorage.getItem(key) || '[]');
  const day = currentDate.toISOString().slice(0,10);

  const todays = foods.filter(f => f.date === day);
  const todayStr = new Date().toISOString().slice(0,10);
  label.textContent = (day === todayStr) ? 'Foods for Today' : `Foods for ${day}`;

  if (!todays.length) {
    box.innerHTML = '<em>No foods logged for this day.</em>';
    totalBox.textContent = '';
    return;
  }

  box.innerHTML = todays.map((f, i) => `
    <div style="border:1px solid #eee;border-radius:8px;padding:8px;margin:4px 0;">
      <strong>${f.name}</strong>${f.brand ? ' – ' + f.brand : ''}
      <br><small>${f.calories ?? '–'} kcal, P:${f.protein ?? '–'} C:${f.carbs ?? '–'} F:${f.fat ?? '–'}</small>
      <br><button class="tiny" onclick="deleteFood(${i})">🗑️ Delete</button>
    </div>
  `).join('');

  const total = todays.reduce((sum, f) => sum + (parseFloat(f.calories) || 0), 0);
  totalBox.textContent = `Total: ${Math.round(total)} kcal`;
}

document.getElementById('prevDay')?.addEventListener('click', () => {
  currentDate.setDate(currentDate.getDate() - 1);
  renderTodayFoods();
});
document.getElementById('nextDay')?.addEventListener('click', () => {
  currentDate.setDate(currentDate.getDate() + 1);
  renderTodayFoods();
});

renderTodayFoods();

function deleteFood(index) {
  const key = 'bw_myfoods';
  let foods = JSON.parse(localStorage.getItem(key) || '[]');
  const today = new Date().toISOString().slice(0,10);
  const todays = foods.filter(f => f.date === today);
  const item = todays[index];
  foods = foods.filter(f => !(f.date === today && f.name === item.name && f.barcode === item.barcode));
  localStorage.setItem(key, JSON.stringify(foods));
  renderTodayFoods();
}
