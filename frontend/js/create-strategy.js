const API_URL = location.hostname.includes('localhost') || location.hostname.includes('127.')
  ? 'http://localhost:3000/api'
  : 'https://krypt-broker.onrender.com/api';

function addRow() {
  const div = document.createElement('div');
  div.className = 'allocation-row';
  div.innerHTML = `
    <input type="text" placeholder="Coin Symbol (e.g. BTC)" class="symbol" />
    <input type="number" placeholder="Amount in USDT" class="amount" />
    <button onclick="this.parentElement.remove()">❌</button>
  `;
  document.getElementById('allocations').appendChild(div);
}

async function submitStrategy() {
  const rows = document.querySelectorAll('.allocation-row');
  const allocations = [];
  let hasError = false;

  rows.forEach(row => {
    const symbolInput = row.querySelector('.symbol');
    const amountInput = row.querySelector('.amount');

    const symbol = symbolInput.value.trim().toUpperCase();
    const amount = parseFloat(amountInput.value);

    // Reset styles
    symbolInput.style.border = '';
    amountInput.style.border = '';

    if (!symbol || isNaN(amount) || amount <= 0) {
      symbolInput.style.border = '2px solid red';
      amountInput.style.border = '2px solid red';
      hasError = true;
      return;
    }

    allocations.push({ symbol, amount });
  });

  if (hasError || allocations.length === 0) {
    return alert(`❌ Please fix errors in your strategy`);
  }

  try {
    const res = await fetch(`${API_URL}/copy/create`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ allocations })
    });

    const data = await res.json();

    if (res.ok) {
      document.getElementById('result').innerHTML = `
        ✅ Strategy Created!<br>Your Code: <strong>${data.code}</strong><br>
        <a href="copytrade.html?code=${data.code}">Test Copy Link</a>
      `;
    } else {
      alert(`❌ ${data.error}`);
    }
  } catch (err) {
    console.error('❌ Submit error:', err);
    alert('❌ Network or server error.');
  }
}


document.getElementById('addRowBtn').onclick = addRow;
document.getElementById('submitStrategy').onclick = submitStrategy;
addRow(); // Add one default row