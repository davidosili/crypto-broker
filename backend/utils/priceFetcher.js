const axios = require('axios');

const symbolToId = {
  BTC: 'bitcoin',
  ETH: 'ethereum',
  USDT: 'tether',
  BNB: 'binancecoin',
  XRP: 'ripple',
  DOGE: 'dogecoin',
  ADA: 'cardano',
  SOL: 'solana',
  LEO: 'leo-token',
  PI: 'pi-network',
  TKX: 'tokenize-xchange',
};

let priceCache = {};
let lastFetchTime = 0;
const CACHE_TTL = 30 * 1000; // 30 seconds

const fetchAllPrices = async () => {
  try {
    const ids = Object.values(symbolToId).join(',');
    const res = await axios.get(`https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=usd`);
    const data = res.data;

    priceCache = {};
    for (const [symbol, id] of Object.entries(symbolToId)) {
      if (data[id] && data[id].usd) {
        priceCache[symbol] = data[id].usd;
      }
    }

    lastFetchTime = Date.now();
    console.log('✅ [CoinGecko] Price cache updated.');
  } catch (err) {
    console.error('❌ [CoinGecko] Failed to fetch prices:', err.message);
  }
};

const getPrice = async (symbol) => {
  const upper = symbol.toUpperCase();
  const now = Date.now();

  if (now - lastFetchTime > CACHE_TTL) {
    await fetchAllPrices();
  }

  const price = priceCache[upper];
  if (!price) throw new Error(`Price not found for ${upper}`);
  return price;
};

// ❌ No auto-fetch here
// ❌ No setInterval

module.exports = { getPrice };
