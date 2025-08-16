const express = require('express');
const router = express.Router();
const fetch = require('node-fetch');
const { getCache, setCache } = require('../utils/cache');
require('dotenv').config(); // ✅ Ensure .env is loaded

router.get('/', async (req, res) => {
  const cached = getCache('news');
  if (cached) return res.json(cached);

  const token = process.env.CRYPTOPANIC_TOKEN;
  const url = `https://cryptopanic.com/api/developer/v2/posts/?auth_token=${token}&kind=news`;


  // ✅ Use fallback in case CryptoPanic fails
  const fallbackNews = [
    {
      title: '📉 Crypto Market Volatility Surges',
      published_at: new Date().toISOString(),
      url: 'https://www.coindesk.com/',
      source: 'Fallback News',
      sentiment: 'neutral'
    }
  ];

  try {
    if (!token) throw new Error('CRYPTOPANIC_TOKEN missing in .env');

    const resp = await fetch(url);
    if (!resp.ok) throw new Error(`CryptoPanic API responded with ${resp.status}`);

    const json = await resp.json();
    const items = json.results.map(item => ({
      title: item.title,
      published_at: item.published_at,
      url: item.url,
      source: item.source?.title || 'Unknown Source',
      image: item?.metadata?.image || null
    }));

    setCache('news', items, 5 * 60 * 1000); // 5 minutes
    res.json(items);
  } catch (err) {
    console.error('❌ CryptoPanic error:', err.message);
    // Fallback if CryptoPanic fails
    res.status(200).json(fallbackNews);
  }
});

module.exports = router;

