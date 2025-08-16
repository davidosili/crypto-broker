const User = require('../models/User');

exports.requireLogin = (req, res, next) => {
  if (!req.session.user) {
    return res.status(401).json({ message: 'Please log in.' });
  }
  req.user = req.session.user; // ✅ Add this
  next();
};


exports.getPortfolio = async (req, res) => {
  const user = await User.findById(req.user.id);
  res.json({ portfolio: user.portfolio || {} });

};

exports.getTradeHistory = async (req, res) => {
  const user = await User.findById(req.user.id);
  res.json({ trades: user.tradeHistory || {} });

};

exports.placeTrade = async (req, res) => {
  const { coin, amount, price, type } = req.body;
  const user = await User.findById(req.user.id);

  // ❌ Don't update the portfolio here
  // ✅ Just create a pending trade request

  user.tradeHistory = user.tradeHistory || [];


  user.tradeHistory.push({
    coin,
    amount,
    price,
    type,
    status: 'pending',
    date: new Date()
  });

  await user.save();

  res.json({ message: 'Trade request submitted.' });
};



exports.getPortfolioHistory = async (req, res) => {
  const user = await User.findById(req.user.id);
  res.json({ history: user.portfolioHistory || [] });
};

