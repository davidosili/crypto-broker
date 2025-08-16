// routes/alertRoutes.js
const express = require('express');
const router = express.Router();
const PriceAlert = require('../models/PriceAlert');
const { requireLogin } = require('../middleware/auth');

// POST /api/alerts
router.post('/', requireLogin, async (req, res) => {
  const { coinId, targetPrice, direction } = req.body;

  if (!coinId || !targetPrice || !direction) {
    return res.status(400).json({ message: 'Missing required fields' });
  }

  try {
    const alert = await PriceAlert.create({
      userId: req.session.user,
      coinId,
      targetPrice,
      direction,
    });

    res.json({ message: 'Alert created', alert });
  } catch (err) {
    console.error('❌ Failed to create alert:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;

