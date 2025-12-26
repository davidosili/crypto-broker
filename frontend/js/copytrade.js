// copytrade.js - Optimized & Secure
const API_URL = location.hostname.includes('localhost') || location.hostname.includes('127.')
  ? 'http://localhost:3000/api'
  : 'https://krypt-broker.onrender.com/api';

// --- STATE ---
const STATE = {
  code: new URLSearchParams(window.location.search).get('code'),
  requiredUSDT: 0,
  userUSDT: 0,
  allocations: [],
  isSufficient: false
};

// --- DOM CACHE ---
const DOM = {
  loader: document.getElementById('loadingStrategy'),
  content: document.getElementById('strategyContent'),
  code: document.getElementById('stratCode'),
  total: document.getElementById('stratTotal'),
  list: document.getElementById('allocationList'),
  userBal: document.getElementById('userBalance'),
  balIcon: document.getElementById('balIcon'),
  executeBtn: document.getElementById('executeBtn'),
  depositBtn: document.getElementById('depositBtn')
};

// --- INIT ---
document.addEventListener('DOMContentLoaded', async () => {
  if (!STATE.code) {
    showToast("Invalid strategy link", "error");
    DOM.executeBtn.textContent = "Invalid Code";
    return;
  }

  // Initial Fetch
  await Promise.all([loadStrategy(), loadUserBalance()]);
  updateUIState();
});

// --- HELPER: Central Fetch Wrapper ---
async function fetchAPI(endpoint, options = {}) {
  const res = await fetch(`${API_URL}${endpoint}`, { credentials: 'include', ...options });
  
  // 🛡️ UX: Smooth Auth Redirect
  if (res.status === 401) {
    showToast("Session expired. Redirecting...", "error");
    setTimeout(() => window.location.href = 'login.html', 1500);
    return null;
  }

  const data = await res.json();
  if (!res.ok) throw new Error(data.message || data.error || 'Request failed');
  return data;
}

// --- LOGIC ---

async function loadStrategy() {
  try {
    const data = await fetchAPI(`/copy/strategy?code=${STATE.code}`);
    if (!data) return; // Auth redirect handling

    STATE.allocations = data.allocations || [];
    // Recalculate total requirement for accuracy
    STATE.requiredUSDT = STATE.allocations.reduce((sum, item) => sum + item.amount, 0);

    // Update UI
    DOM.loader.style.display = 'none';
    DOM.content.style.display = 'block';
    DOM.code.textContent = `CODE: ${data.code}`;
    DOM.total.textContent = formatUSD(STATE.requiredUSDT);

    renderAllocations();

  } catch (err) {
    console.error(err);
    DOM.loader.innerHTML = `<span style="color:var(--danger-red)">Failed to load strategy</span>`;
    DOM.executeBtn.textContent = "Error Loading";
    showToast(err.message, 'error');
  }
}

async function loadUserBalance() {
  try {
    const data = await fetchAPI('/trade/portfolio');
    if (!data) return;

    STATE.userUSDT = data.portfolio?.USDT || 0;
  } catch (err) {
    console.error("Balance load error", err);
    STATE.userUSDT = 0;
  }
}

function renderAllocations() {
  DOM.list.innerHTML = '';
  
  if (STATE.allocations.length === 0) {
    DOM.list.innerHTML = '<div style="padding:15px;text-align:center;">Empty Strategy</div>';
    return;
  }

  STATE.allocations.forEach(item => {
    const div = document.createElement('div');
    div.className = 'alloc-item';
    
    // 🛡️ Accessibility: Added title attribute for hover/readers
    div.innerHTML = `
      <div class="coin-info">
        <div class="coin-icon" title="${item.symbol} icon" aria-hidden="true">
            ${item.symbol.substring(0,1)}
        </div>
        <div class="coin-symbol">${item.symbol}</div>
      </div>
      <div class="coin-amount">${formatUSD(item.amount)}</div>
    `;
    DOM.list.appendChild(div);
  });
}

function updateUIState() {
  DOM.userBal.textContent = formatUSD(STATE.userUSDT);

  STATE.isSufficient = STATE.userUSDT >= STATE.requiredUSDT;

  if (STATE.isSufficient) {
    DOM.balIcon.className = "fas fa-check-circle status-icon status-ok";
    DOM.executeBtn.textContent = "Execute Strategy";
    DOM.executeBtn.disabled = false;
    DOM.executeBtn.onclick = executeStrategy;
    DOM.depositBtn.style.display = 'none';
  } else {
    DOM.balIcon.className = "fas fa-times-circle status-icon status-bad";
    // 🛡️ UX: Clean number formatting for shortfall
    const shortfall = formatUSD(STATE.requiredUSDT - STATE.userUSDT);
    DOM.executeBtn.textContent = `Insufficient USDT (Need ${shortfall})`;
    DOM.executeBtn.disabled = true;
    DOM.depositBtn.style.display = 'block';
  }
}

async function executeStrategy() {
  if (STATE.userUSDT < STATE.requiredUSDT) {
    showToast("Insufficient USDT Balance", "error");
    return;
  }

  DOM.executeBtn.disabled = true;
  DOM.executeBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...';

  try {
    const data = await fetchAPI('/copy/execute', {
      method: 'POST',
      body: JSON.stringify({ code: STATE.code })
    });

    if (data) {
      showToast("Strategy Executed Successfully!", "success");
      
      // 🛡️ UX: Success State Lock (Remove spinner, turn green, lock button)
      DOM.executeBtn.innerHTML = '<i class="fas fa-check"></i> Executed';
      DOM.executeBtn.className = "action-btn status-ok"; // CSS handles style
      DOM.executeBtn.disabled = true; // Permanent disable to prevent double-buy
      
      // Redirect
      setTimeout(() => window.location.href = 'dashboard.html', 1500);
    }

  } catch (err) {
    showToast(err.message, "error");
    DOM.executeBtn.disabled = false;
    DOM.executeBtn.textContent = "Try Again";
  }
}

// --- UTILS ---

function formatUSD(num) {
  return num.toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2
  });
}

let toastTimeout;
function showToast(msg, type = 'info') {
  const x = document.getElementById("toast");
  const icon = type === 'success' ? '✅ ' : type === 'error' ? '❌ ' : 'ℹ️ ';
  
  // 🛡️ UX: Clear previous timeout to prevent overlay glitches
  clearTimeout(toastTimeout);

  x.textContent = icon + msg;
  x.style.backgroundColor = type === 'error' ? 'var(--danger-red)' : 
                            type === 'success' ? 'var(--success-green)' : '#333';
  x.className = "show";
  
  toastTimeout = setTimeout(() => { 
      x.className = x.className.replace("show", ""); 
  }, 3000);
}
