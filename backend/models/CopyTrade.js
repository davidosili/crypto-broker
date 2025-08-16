const mongoose = require('mongoose');

const copyTradeSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  code: { type: String, unique: true },
  allocations: [
    {
      symbol: String,
      amount: Number // ✅ Now fixed amount in USDT
    }
  ],
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('CopyTrade', copyTradeSchema);
