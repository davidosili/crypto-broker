const API_URL = location.hostname.includes('localhost') || location.hostname.includes('127.')
  ? 'http://localhost:3000/api'
  : 'https://krypt-broker.onrender.com/api';

    window.alert = msg => console.warn("🔔 ALERT:", msg);
// LocalStorage cache with TTL

const coinSelect = document.getElementById('coinSelect');
const amountInput = document.getElementById('amountInput');
const priceDisplay = document.getElementById('priceDisplay');
const portfolioList = document.getElementById('portfolioList');
const historyList = document.getElementById('historyList');
const userInfo = document.getElementById('userInfo');

// CoinGecko API: get live price
async function updatePrice() {
  const coinMap = { BTC: 'bitcoin', ETH: 'ethereum' };
  const coin = coinSelect.value;
  try {
    const res = await fetch(`${API_URL}/coin/price?ids=${coinMap[coin]}&vs_currencies=usd`, {
      credentials: 'include'
    });
    const data = await res.json();
    priceDisplay.textContent = data[coinMap[coin]].usd;
  } catch (err) {
    priceDisplay.textContent = 'Error';
  }
}

// Checks if user is logged in
async function getCurrentUser() {
  const res = await fetch(`${API_URL}/auth/me`, {
    credentials: 'include'
  });

  if (res.status === 401) {
    alert('You must log in first.');
    window.location.href = 'login.html';
    return;
  }

  const data = await res.json();
  userInfo.textContent = `Logged in as ${data.user.username}`;
}

getCurrentUser(); // Run this first
coinSelect.addEventListener('change', updatePrice);
updatePrice(); // Initial call

// Fetch portfolio
async function loadPortfolio() {
  try {
    const res = await fetch(`${API_URL}/trade/portfolio`, { credentials: 'include' });
    const data = await res.json();
    if (!data.portfolio) throw new Error('No portfolio data');

    portfolioList.innerHTML = '';
    for (let [coin, amt] of Object.entries(data.portfolio)) {
      const li = document.createElement('li');
      li.textContent = `${coin}: ${amt}`;
      portfolioList.appendChild(li); // Light background for better contrast
    }
  } catch (err) {
    portfolioList.innerHTML = '<li>Error loading portfolio</li>';
    console.error(err);
  }
}

// ✅ Updated to show status badges
async function loadHistory() {
  try {
    const res = await fetch(`${API_URL}/trade/history`, { credentials: 'include' });
    const data = await res.json();
    if (!data.trades) throw new Error('No trade history');

    historyList.innerHTML = '';
    data.trades.reverse().forEach(trade => {
      const status = trade.status || 'pending';
      let statusClass = '';

      switch (status) {
        case 'approved': statusClass = 'badge-approved'; break;
        case 'rejected': statusClass = 'badge-rejected'; break;
        default: statusClass = 'badge-pending'; break;
      }

      const li = document.createElement('li');
      li.innerHTML = `
        <strong>${trade.type.toUpperCase()}</strong> 
        ${trade.amount} ${trade.coin} @ $${trade.price} 
        <small>(${new Date(trade.date).toLocaleString()})</small>
        <span class="badge ${statusClass}">${status}</span>
      `;
      historyList.appendChild(li);
    });
  } catch (err) {
    historyList.innerHTML = '<li>Error loading history</li>';
    console.error(err);
  }
}

// Place a trade
async function placeTrade(type) {
  const coin = coinSelect.value;
  const amount = parseFloat(amountInput.value);
  const price = parseFloat(priceDisplay.textContent);

  if (!amount || amount <= 0 || isNaN(price)) {
    return alert('Invalid amount or price');
  }

  const res = await fetch(`${API_URL}/trade/place`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ type, coin, amount, price })
  });

  const data = await res.json();
  alert(data.message);
  loadPortfolio();
  loadHistory();
}

async function logout() {
  await fetch(`${API_URL}/auth/logout`, {
    method: 'POST',
    credentials: 'include'
  });
  window.location.href = 'login.html';
}

loadPortfolio();
loadHistory();
