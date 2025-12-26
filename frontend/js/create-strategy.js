// create-strategy.js - Optimized
const API_URL = location.hostname.includes('localhost') || location.hostname.includes('127.')
  ? 'http://localhost:3000/api'
  : 'https://krypt-broker.onrender.com/api';

const DOM = {
  container: document.getElementById('allocations'),
  totalDisplay: document.getElementById('totalDisplay'),
  submitBtn: document.getElementById('submitStrategy'),
  addRowBtn: document.getElementById('addRowBtn'),
  modal: document.getElementById('resultModal'),
  codeDisplay: document.getElementById('strategyCode')
};

// --- INIT ---
document.addEventListener('DOMContentLoaded', () => {
  addRow(); // Add first row by default
});

// --- ROW MANAGEMENT ---
function addRow() {
  const div = document.createElement('div');
  div.className = 'alloc-row';
  div.innerHTML = `
    <div class="input-group">
      <input type="text" placeholder="Symbol (BTC)" class="form-input symbol-input" 
             autocomplete="off" oninput="validateInput(this); updateTotal()">
    </div>
    <div class="input-group">
      <input type="number" inputmode="decimal" placeholder="Amount (USDT)" class="form-input amount-input" 
             autocomplete="off" oninput="updateTotal()">
    </div>
    <button class="remove-btn" onclick="removeRow(this)" title="Remove Asset" aria-label="Remove asset">
      <i class="fas fa-times"></i>
    </button>
  `;
  DOM.container.appendChild(div);
  
  // UX: Auto-focus the new symbol input
  const newSymbolInput = div.querySelector('.symbol-input');
  if (newSymbolInput) newSymbolInput.focus();

  updateRemoveButtons();
}

window.removeRow = function(btn) {
  const row = btn.closest('.alloc-row');
  row.style.opacity = '0';
  row.style.transform = 'translateY(-10px)';
  setTimeout(() => {
    row.remove();
    updateTotal();
    updateRemoveButtons();
  }, 200);
};

function updateRemoveButtons() {
  const rows = document.querySelectorAll('.alloc-row');
  const btns = document.querySelectorAll('.remove-btn');
  // Hide remove button if only 1 row exists
  btns.forEach(btn => btn.style.display = rows.length > 1 ? 'flex' : 'none');
}

// --- VALIDATION & CALCULATIONS ---
window.validateInput = function(input) {
  // Force uppercase, remove non-letters, trim spaces
  input.value = input.value.toUpperCase().replace(/[^A-Z]/g, '').trim();
  input.classList.remove('error');
};

window.updateTotal = function() {
  const amounts = document.querySelectorAll('.amount-input');
  let total = 0;
  
  amounts.forEach(inp => {
    inp.classList.remove('error'); // Clear errors on typing
    const val = parseFloat(inp.value);
    if (!isNaN(val) && val > 0) total += val;
  });

  DOM.totalDisplay.textContent = `$${total.toLocaleString('en-US', {minimumFractionDigits: 2})}`;
  
  // UX: Disable submit if total is 0
  DOM.submitBtn.disabled = total <= 0;
};

// --- SUBMISSION ---
DOM.addRowBtn.onclick = addRow;

DOM.submitBtn.onclick = async () => {
  const rows = document.querySelectorAll('.alloc-row');
  const allocations = [];
  let hasError = false;

  rows.forEach(row => {
    const symbolInput = row.querySelector('.symbol-input');
    const amountInput = row.querySelector('.amount-input');

    const symbol = symbolInput.value.trim();
    const amount = parseFloat(amountInput.value);

    // FIX: Check validity per row, independent of previous errors
    let rowValid = true;

    if (!symbol) {
      symbolInput.classList.add('error');
      rowValid = false;
      hasError = true;
    }
    if (isNaN(amount) || amount <= 0) {
      amountInput.classList.add('error');
      rowValid = false;
      hasError = true;
    }

    // Only add if this specific row is valid (so we don't send garbage)
    if (rowValid) {
        allocations.push({ symbol, amount });
    }
  });

  // If ANY row had an error, block submission
  if (hasError) {
    showToast("Please fix the highlighted errors", "error");
    return;
  }

  if (allocations.length === 0) {
    showToast("Add at least one asset", "error");
    return;
  }

  // Submit
  DOM.submitBtn.disabled = true;
  DOM.submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Creating...';

  try {
    const res = await fetch(`${API_URL}/copy/create`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ allocations })
    });

    const data = await res.json();

    if (res.ok) {
      DOM.codeDisplay.innerText = data.code;
      DOM.modal.showModal();
    } else {
      throw new Error(data.error || "Creation failed");
    }
  } catch (err) {
    console.error('Submit error:', err);
    showToast(err.message, "error");
  } finally {
    DOM.submitBtn.disabled = false;
    DOM.submitBtn.innerHTML = '<i class="fas fa-rocket"></i> Create Strategy';
  }
};

// --- UTILS ---
window.copyCode = function() {
  const code = DOM.codeDisplay.innerText;
  const url = `${window.location.origin}/frontend/copytrade.html?code=${code}`;
  
  if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(url).then(() => {
        showToast("Link copied to clipboard!", "success");
      });
  } else {
      // Fallback
      showToast("Code: " + code, "info");
  }
};

let toastTimeout;
function showToast(msg, type = 'info') {
  const x = document.getElementById("toast");
  const icon = type === 'success' ? '✅ ' : type === 'error' ? '❌ ' : 'ℹ️ ';
  
  clearTimeout(toastTimeout); // Prevent overlapping animations

  x.textContent = icon + msg;
  x.style.backgroundColor = type === 'error' ? 'var(--danger-red)' : 
                            type === 'success' ? 'var(--success-green)' : '#333';
  x.className = "show";
  
  toastTimeout = setTimeout(() => { 
      x.className = x.className.replace("show", ""); 
  }, 3000);
}
