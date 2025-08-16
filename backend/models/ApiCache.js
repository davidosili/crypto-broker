const mongoose = require('mongoose');

const apiCacheSchema = new mongoose.Schema({
  key: { type: String, unique: true, required: true }, // e.g. markets-BTC
  data: { type: mongoose.Schema.Types.Mixed, required: true },
  createdAt: { type: Date, default: Date.now, expires: 0 } // TTL set dynamically
});

module.exports = mongoose.model('ApiCache', apiCacheSchema);
