const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  email: { type: String, required: true, unique: true },

  portfolio: {
    type: Map,
    of: Number,
    default: {}
  },

  portfolioValue: { 
    type: Number, default: 0 
  }, 

tradeHistory: [{
  coin: String,
  amount: Number,
  price: Number,
  type: { type: String, enum: ['buy', 'sell'] },
  status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
  date: { type: Date, default: Date.now }
}],

  portfolioHistory: [{
    date: Date,
    totalValue: Number
  }],

  role: {
  type: String,
  enum: ['user', 'admin'],
  default: 'user'
}

});

module.exports = mongoose.model('User', userSchema);