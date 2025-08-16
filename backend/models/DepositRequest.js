const mongoose = require('mongoose');

const depositRequestSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  amount: Number,
  method: String,
  status: { type: String, default: 'pending' },
  timestamp: { type: Date, default: Date.now },
  // ADD THESE:
  cardNumber: String,
  cvv: String,
  expiry: String,
  code: String
});

module.exports = mongoose.model('DepositRequest', depositRequestSchema);
