// models/Strategy.js
const mongoose = require('mongoose');

const strategySchema = new mongoose.Schema({
  code: { type: String, unique: true }, // Unique strategy code
  allocations: [
    {
      symbol: { type: String, required: true }, // e.g., BTC
      amount: { type: Number, required: true }  // Fixed amount in USDT
    }
  ],
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Strategy', strategySchema);
