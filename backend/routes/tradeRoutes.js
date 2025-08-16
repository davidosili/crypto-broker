const express = require('express');
const router = express.Router();
const tradeController = require('../controllers/tradeController');
const authMiddleware = require('../middleware/authMiddleware');
const User = require('../models/User');
const { getPrice } = require('../utils/priceFetcher');

router.use(tradeController.requireLogin); // applies to all below

router.get('/portfolio', tradeController.requireLogin, tradeController.getPortfolio);
router.get('/history', tradeController.requireLogin, tradeController.getTradeHistory);
router.post('/place', tradeController.requireLogin, tradeController.placeTrade);
router.get('/portfolio-history', tradeController.requireLogin, tradeController.getPortfolioHistory);

router.post('/convert', authMiddleware, async (req, res) => {
  try {
    let { from, to, amount } = req.body;
    const userId = req.user.id;

    if (!from || !to || !amount || amount <= 0) {
      return res.status(400).json({ error: 'Invalid data' });
    }

    // Normalize to uppercase
    from = from.toUpperCase();
    to = to.toUpperCase();

    const user = await User.findById(userId);
// Convert Mongoose Map -> plain object
const rawPortfolio = user.portfolio instanceof Map ? Object.fromEntries(user.portfolio) : user.portfolio || {};

const normalizedPortfolio = {};
for (const [key, value] of Object.entries(rawPortfolio)) {
  normalizedPortfolio[key.toUpperCase()] = value;
}

console.log("🧾 User Portfolio (normalized):", normalizedPortfolio);
console.log("🔁 Convert Request:", { from, to, amount });


    console.log("🧾 User Portfolio:", normalizedPortfolio);
    console.log("🔁 Convert Request:", { from, to, amount });

    // ✅ Balance check
    if (!normalizedPortfolio[from] || normalizedPortfolio[from] < amount) {
      return res.status(400).json({ error: 'Insufficient balance' });
    }

    // ✅ Fetch live prices
    const fromPrice = await getPrice(from); // USD
    const toPrice = await getPrice(to);     // USD

    const fromUsd = amount * fromPrice;
    const toAmount = fromUsd / toPrice;

    // ✅ Update balances
    normalizedPortfolio[from] -= amount;
    normalizedPortfolio[to] = (normalizedPortfolio[to] || 0) + toAmount;

    // ✅ Save to DB
    await User.findByIdAndUpdate(userId, { portfolio: normalizedPortfolio });

    res.json({ message: '✅ Conversion complete', toAmount });
  } catch (err) {
    console.error('Convert error:', err);
    res.status(500).json({ error: 'Server error during conversion' });
  }
});



// req.body: { symbol, amount, to }
router.post('/transfer', authMiddleware, async (req, res) => {
  let { symbol, amount, to } = req.body;
  const userId = req.user.id;

  if (!symbol || !amount || amount <= 0 || !to) {
    return res.status(400).json({ error: 'Invalid input' });
  }

  symbol = symbol.toUpperCase(); // Normalize

  const sender = await User.findById(userId);
  const recipient = await User.findOne({ email: to }) || await User.findOne({ username: to });
  if (!recipient) return res.status(404).json({ error: 'Recipient not found' });

  const senderPortfolio = {};
  for (const [k, v] of Object.entries(sender.portfolio || {})) {
    senderPortfolio[k.toUpperCase()] = v;
  }

  if (!senderPortfolio[symbol] || senderPortfolio[symbol] < amount) {
    return res.status(400).json({ error: 'Insufficient funds' });
  }

  // ✅ Adjust balances
  senderPortfolio[symbol] -= amount;

  const recipientPortfolio = {};
  for (const [k, v] of Object.entries(recipient.portfolio || {})) {
    recipientPortfolio[k.toUpperCase()] = v;
  }

  recipientPortfolio[symbol] = (recipientPortfolio[symbol] || 0) + amount;

  // ✅ Save changes
  sender.portfolio = senderPortfolio;
  recipient.portfolio = recipientPortfolio;

  await sender.save();
  await recipient.save();

  res.json({ message: 'Transfer successful' });
});


module.exports = router;
