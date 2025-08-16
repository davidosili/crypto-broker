// copytrade.js - Enhanced with USDT balance check
const API_URL = location.hostname.includes('localhost') || location.hostname.includes('127.')
  ? 'http://localhost:3000/api'
  : 'https://krypt-broker.onrender.com/api';

const params = new URLSearchParams(window.location.search);
const code = params.get('code');
const preview = document.getElementById('strategyPreview');
const balanceBox = document.getElementById('balanceBox');
const executeBtn = document.getElementById('executeBtn');
const resultBox = document.getElementById('result');

let requiredUSDT = 0;
let userUSDT = 0;

async function loadUserBalance() {
  try {
    const res = await fetch(`${API_URL}/trade/portfolio`, { credentials: 'include' });
    const data = await res.json();

    if (!res.ok) throw new Error(data.message || 'Failed to fetch portfolio');

    userUSDT = data.portfolio?.USDT || data.portfolio?.get?.('USDT') || 0;
    balanceBox.textContent = `💰 Your USDT Balance: $${userUSDT.toFixed(2)}`;
    checkBalance();
  } catch (err) {
    balanceBox.textContent = `❌ ${err.message}`;
  }
}

async function loadStrategy() {
  if (!code) {
    preview.innerHTML = '❌ No strategy code in URL.';
    return;
  }

  try {
    const res = await fetch(`${API_URL}/copy/strategy?code=${code}`);
    const data = await res.json();

    if (!res.ok) throw new Error(data.error || 'Strategy not found');

    requiredUSDT = data.allocations.reduce((sum, a) => sum + a.amount, 0);

    // ✅ Show allocations with amounts and total required
    preview.innerHTML = `
      <h3>📌 Strategy Code: ${data.code}</h3>
      <table>
        <tr><th>Coin</th><th>Amount (USDT)</th></tr>
        ${data.allocations.map(a => `
          <tr>
            <td>${a.symbol}</td>
            <td>$${a.amount.toFixed(2)}</td>
          </tr>
        `).join('')}
      </table>
      <p>🔹 Total Required USDT: <strong>$${requiredUSDT.toFixed(2)}</strong></p>
    `;

    executeBtn.style.display = 'inline-block';
    checkBalance();
  } catch (err) {
    preview.textContent = `❌ ${err.message}`;
  }
}

function checkBalance() {
  if (userUSDT < requiredUSDT && requiredUSDT > 0) {
    executeBtn.disabled = true;
    executeBtn.textContent = "🚫 Insufficient USDT";
  } else {
    executeBtn.disabled = false;
    executeBtn.textContent = "🚀 Execute Strategy";
  }
}

async function executeStrategy() {
  executeBtn.disabled = true;
  executeBtn.textContent = "Processing...";

  try {
    const res = await fetch(`${API_URL}/copy/execute`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code })
    });

    const data = await res.json();

    if (!res.ok) throw new Error(data.error || 'Execution failed');

    resultBox.style.display = 'block';
    resultBox.innerHTML = `✅ ${data.message}`;
    await loadUserBalance(); // refresh balance after execution
  } catch (err) {
    resultBox.style.display = 'block';
    resultBox.innerHTML = `❌ ${err.message}`;
  } finally {
    checkBalance();
  }
}

executeBtn.onclick = executeStrategy;
loadStrategy();
loadUserBalance();
