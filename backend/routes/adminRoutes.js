const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { requireLogin, requireAdmin } = require('../middleware/auth');
const DepositRequest = require('../models/DepositRequest'); // Add this at the top if missing


// ✅ Get all pending trades
router.get('/trades', requireLogin, requireAdmin, async (req, res) => {
  try {
    const users = await User.find();
    const pendingTrades = [];

    users.forEach(user => {
      user.tradeHistory.forEach(trade => {
        if (trade.status === 'pending') {
          pendingTrades.push({
            userId: user._id,
            username: user.username,
            ...trade.toObject()
          });
        }
      });
    });

    res.json({ trades: pendingTrades });
  } catch (err) {
    console.error('❌ Error fetching trades:', err);
    res.status(500).json({ message: 'Failed to fetch trades' });
  }
});

// ✅ Approve or reject trade
router.post('/trades/action', requireLogin, requireAdmin, async (req, res) => {
  const { userId, tradeId, action } = req.body;

  if (!['approved', 'rejected'].includes(action)) {
    return res.status(400).json({ message: 'Invalid action' });
  }

  const user = await User.findById(userId);
  if (!user) return res.status(404).json({ message: 'User not found' });

  const trade = user.tradeHistory.id(tradeId);
  if (!trade || trade.status !== 'pending') {
    return res.status(404).json({ message: 'Trade not found or already handled' });
  }

  trade.status = action;

  if (action === 'approved') {
    if (trade.type === 'buy') {
      user.portfolio.set(trade.coin, (user.portfolio.get(trade.coin) || 0) + trade.amount);
    } else if (trade.type === 'sell') {
      const current = user.portfolio.get(trade.coin) || 0;
      if (current < trade.amount) {
        return res.status(400).json({ message: 'Insufficient balance to approve sell' });
      }
      user.portfolio.set(trade.coin, current - trade.amount);
    }
  }

  await user.save();
  res.json({ message: `Trade ${action}` });
});

// ✅ Get all users and portfolios
router.get('/users', requireLogin, requireAdmin, async (req, res) => {
  try {
    const users = await User.find().select('username email portfolio');
    const result = users.map(user => ({
      username: user.username,
      email: user.email,
      portfolio: Object.fromEntries(user.portfolio)
    }));
    res.json({ users: result });
  } catch (err) {
    console.error('❌ Error fetching users:', err);
    res.status(500).json({ message: 'Failed to fetch users' });
  }
});

// ✅ Get total coin balances across all users
router.get('/stats/portfolio-totals', requireLogin, requireAdmin, async (req, res) => {
  try {
    const users = await User.find().select('portfolio');
    const totals = { BTC: 0, ETH: 0 };

    users.forEach(user => {
      if (user.portfolio.get('BTC')) totals.BTC += user.portfolio.get('BTC');
      if (user.portfolio.get('ETH')) totals.ETH += user.portfolio.get('ETH');
    });

    res.json({ totals });
  } catch (err) {
    res.status(500).json({ message: 'Failed to calculate portfolio totals', error: err.message });
  }
});

// ✅ Get trade analytics: most traded coin, daily trade activity
router.get('/stats/trades', requireLogin, requireAdmin, async (req, res) => {
  try {
    const users = await User.find().select('tradeHistory');

    const coinCounts = {};     // e.g., { BTC: 3, ETH: 5 }
    const dailyCounts = {};    // e.g., { '2025-06-21': 4, '2025-06-20': 2 }

    users.forEach(user => {
      user.tradeHistory.forEach(trade => {
        // Count coins
        coinCounts[trade.coin] = (coinCounts[trade.coin] || 0) + 1;

        // Count by date
        const dateStr = new Date(trade.date).toISOString().split('T')[0]; // e.g., "2025-06-21"
        dailyCounts[dateStr] = (dailyCounts[dateStr] || 0) + 1;
      });
    });

    // Find most traded coin
    let mostTradedCoin = null;
    let maxCount = 0;
    for (const [coin, count] of Object.entries(coinCounts)) {
      if (count > maxCount) {
        maxCount = count;
        mostTradedCoin = coin;
      }
    }

    res.json({
      mostTradedCoin,
      dailyCounts
    });
  } catch (err) {
    res.status(500).json({ message: 'Failed to load trade stats', error: err.message });
  }
});


router.post('/deposits/action', requireLogin, requireAdmin, async (req, res) => {
  const { depositId, action } = req.body;

  if (!['approved', 'rejected'].includes(action)) {
    return res.status(400).json({ message: 'Invalid action' });
  }

  try {
    const deposit = await DepositRequest.findById(depositId);
    if (!deposit || deposit.status !== 'pending') {
      return res.status(404).json({ message: 'Deposit not found or already handled' });
    }

    deposit.status = action;
    await deposit.save();

    if (action === 'approved') {
      const user = await User.findById(deposit.userId);
      if (!user) return res.status(404).json({ message: 'User not found' });

      // Add the amount to user's USDT balance
      const coin = 'USDT'; // Assuming you're treating deposit as USDT
      user.portfolio.set(coin, (user.portfolio.get(coin) || 0) + deposit.amount);
      await user.save();
    }

    res.json({ message: `Deposit ${action}` });
  } catch (err) {
    console.error('❌ Deposit action error:', err);
    res.status(500).json({ message: 'Failed to process deposit' });
  }
});

module.exports = router;
