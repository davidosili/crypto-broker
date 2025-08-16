const express = require('express');
const router = express.Router();
const { requireLogin } = require('../middleware/auth');
const User = require('../models/User');
const CopyTrade = require('../models/CopyTrade');
const crypto = require('crypto');
const { getPrice } = require('../utils/priceFetcher'); // ✅ to convert USDT to coin

function generateCode() {
  return crypto.randomBytes(3).toString('hex'); // e.g., "5f2a9b"
}

// ✅ POST /api/copy/create - Create a new strategy with fixed amounts
router.post('/create', requireLogin, async (req, res) => {
  const { allocations } = req.body;
  if (!allocations || !Array.isArray(allocations) || allocations.length === 0) {
    return res.status(400).json({ error: 'Invalid strategy' });
  }
  
  const code = generateCode();
  const strategy = new CopyTrade({
    userId: req.session.user.id,
    code,
    allocations
  });
  await strategy.save();

  res.json({ code });
});


// ✅ GET /api/copy/strategy?code=XXXX
router.get('/strategy', async (req, res) => {
  const code = req.query.code;
  const strategy = await CopyTrade.findOne({ code });

  if (!strategy) return res.status(404).json({ error: 'Strategy not found' });

  res.json(strategy);
});
// ✅ POST /api/copy/execute - Execute fixed-amount strategy
router.post('/execute', requireLogin, async (req, res) => {
  const { code } = req.body;
  const user = await User.findById(req.session.user.id);
  const strategy = await CopyTrade.findOne({ code });

  if (!strategy) return res.status(404).json({ error: 'Strategy code invalid or expired' });

  const usdtBalance = user.portfolio.get('USDT') || 0;
  const totalRequired = strategy.allocations.reduce((sum, a) => sum + a.amount, 0);

  if (usdtBalance < totalRequired) {
    return res.status(400).json({ error: 'Insufficient USDT balance to execute this strategy.' });
  }

  const simulatedIncrease = 1.3; // 30% gain

  // Deduct total USDT first
  user.portfolio.set('USDT', usdtBalance - totalRequired);

  for (const { symbol, amount } of strategy.allocations) {
    const price = await getPrice(symbol); // USD price of coin
    const coinQty = (amount / price) * simulatedIncrease;

    const current = user.portfolio.get(symbol) || 0;
    user.portfolio.set(symbol, current + coinQty);
  }

  await user.save();
  res.json({ message: '✅ Strategy executed successfully with USDT deducted and simulated gains applied.' });
});

module.exports = router;

