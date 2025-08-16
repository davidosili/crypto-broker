// backend/routes/coinProxyRoutes.js
const express = require('express');
const router = express.Router();
const fetch = require('node-fetch');
const { getCache, setCache } = require('../utils/cache'); // Mongo TTL version
const ALLOWED_COINS = [
  'bitcoin',
  'ethereum',
  'tether',
  'binancecoin',
  'usd-coin',
  'ripple',
  'cardano',
  'dogecoin',
  'solana',
  'tron',
  'polkadot',
  'polygon',
  'litecoin',
  'shiba-inu',
  'avalanche-2',
  'uniswap',
  'chainlink',
  'stellar',
  'cosmos',
  'monero'
];


// ✅ Top 100 coins by market cap (cached for 10 minutes)
// ✅ Top coins by market cap (cached for 10 minutes)
router.get('/markets', async (req, res) => {
  const cacheKey = 'markets';
  let cached = await getCache(cacheKey);
  if (cached) return res.json(cached);

  try {
    // Pull top 100 coins (not just ALLOWED_COINS)
    const response = await fetch(
      `https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=100&page=1&sparkline=false`
    );
    const rawData = await response.json();

    // Keep only the fields you want (including image)
    const filtered = rawData.map(c => ({
      id: c.id,
      symbol: c.symbol,
      name: c.name,
      current_price: c.current_price,
      market_cap: c.market_cap,
      total_volume: c.total_volume,
      price_change_percentage_24h: c.price_change_percentage_24h,
      image: c.image
    }));

    await setCache(cacheKey, filtered, 600); // 10 min TTL
    res.json(filtered);
  } catch (err) {
    console.error('❌ Market fetch failed:', err);
    if (cached) return res.json(cached); // fallback
    res.status(500).json({ message: 'Failed to fetch market data' });
  }
});

// ✅ Single coin info by Coin ID (cached for 60s)
router.get('/coin/:id', async (req, res) => {
  const { id } = req.params;
  const cacheKey = `coin-${id}`;
  const cached = await getCache(cacheKey);
  if (cached) return res.json(cached);

  try {
    const cgRes = await fetch(`https://api.coingecko.com/api/v3/coins/${id}`);
    const data = await cgRes.json();

    await setCache(cacheKey, data, 60); // 1 min TTL
    res.json(data);
  } catch (err) {
    console.error(`❌ Failed to fetch coin ${id}:`, err);
    res.status(500).json({ message: `Failed to fetch coin ${id}` });
  }
});

// ✅ Coin price for multiple ids (cached per id for 1 day)
router.get('/price', async (req, res) => {
  const { ids = ALLOWED_COINS.join(','), vs_currencies = 'usd' } = req.query;
  const idList = ids.split(',');
  const result = {};

  for (const id of idList) {
    const cacheKey = `price-${id}-${vs_currencies}`;
    let cached = await getCache(cacheKey);
    if (cached) {
      result[id] = cached[id];
      continue;
    }
    try {
      const response = await fetch(
        `https://api.coingecko.com/api/v3/simple/price?ids=${id}&vs_currencies=${vs_currencies}`
      );
      const data = await response.json();
      result[id] = data[id];
      await setCache(cacheKey, data, 86400); // 1 day TTL
    } catch (err) {
      console.error(`❌ Price fetch failed for ${id}:`, err);
      if (cached) result[id] = cached[id];
    }
  }

  res.json(result);
});

// ✅ Market chart (trimmed) for a coin (1d TTL if 1 day chart, else 7d TTL)
function trimChartData(data, maxHours = 24) {
  const cutoff = Date.now() - maxHours * 3600 * 1000;
  return {
    prices: data.prices.filter(([t]) => t >= cutoff),
    market_caps: data.market_caps.filter(([t]) => t >= cutoff),
    total_volumes: data.total_volumes.filter(([t]) => t >= cutoff)
  };
}

router.get('/chart/:id', async (req, res) => {
  const { id } = req.params;
  const { vs_currency = 'usd', days = 7 } = req.query;
  const cacheKey = `chart-${id}-${vs_currency}-${days}`;
  let cached = await getCache(cacheKey);
  if (cached) return res.json(cached);

  try {
    const response = await fetch(
      `https://api.coingecko.com/api/v3/coins/${id}/market_chart?vs_currency=${vs_currency}&days=${days}`
    );
    const rawData = await response.json();
    const trimmed = trimChartData(rawData, days === '1' ? 24 : days * 24);

    await setCache(cacheKey, trimmed, days === '1' ? 86400 : 604800); // 1d or 7d TTL
    res.json(trimmed);
  } catch (err) {
    console.error(`❌ Chart fetch failed for ${id}:`, err);
    if (cached) return res.json(cached);
    res.status(500).json({ message: `Failed to fetch chart for ${id}` });
  }
});

module.exports = router;

