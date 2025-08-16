// backend/jobs/priceAlertJob.js
const cron = require('node-cron');
const fetch = require('node-fetch');
const PriceAlert = require('../models/PriceAlert');
const User = require('../models/User');

// This task runs every 2 minutes
cron.schedule('*/2 * * * *', async () => {
  try {
    const alerts = await PriceAlert.find({ notified: false });

    for (const alert of alerts) {
      const coinId = alert.coinId;
      const target = alert.targetPrice;
      const direction = alert.direction;

      // Fetch current price from CoinGecko
      const res = await fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${coinId}&vs_currencies=usd`);
      const data = await res.json();
      const currentPrice = data[coinId]?.usd;

      if (!currentPrice) {
        console.warn(`⚠️ Skipping ${coinId} - no price data.`);
        continue;
      }

      // Check alert condition
      const shouldNotify =
        (direction === 'above' && currentPrice >= target) ||
        (direction === 'below' && currentPrice <= target);

      if (shouldNotify) {
        console.log(`🔔 Triggered: ${coinId} is now $${currentPrice} (target: ${direction} $${target})`);

        // TODO: Notify via WebSocket or email

        alert.notified = true;
        await alert.save();
      }
    }
  } catch (err) {
    console.error('❌ Error in price alert job:', err.message);
  }
});
