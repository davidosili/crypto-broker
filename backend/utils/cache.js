const mongoose = require('mongoose');

// Schema for cached API responses
const apiCacheSchema = new mongoose.Schema({
  key: { type: String, required: true, unique: true },
  data: { type: mongoose.Schema.Types.Mixed, required: true },
  expireAt: { type: Date, required: true } // Per-document expiry
});

// TTL index — expires docs at expireAt
apiCacheSchema.index({ expireAt: 1 }, { expireAfterSeconds: 0 });

const ApiCache = mongoose.model('ApiCache', apiCacheSchema);

/**
 * Get cached data by key
 */
async function getCache(key) {
  const entry = await ApiCache.findOne({ key });
  return entry ? entry.data : null;
}

/**
 * Set cached data with TTL
 * @param {string} key - Cache key
 * @param {any} data - Data to cache
 * @param {number} ttlSeconds - Time-to-live in seconds
 */
async function setCache(key, data, ttlSeconds = 600) {
  const expireAt = new Date(Date.now() + ttlSeconds * 1000);

  await ApiCache.findOneAndUpdate(
    { key },
    { data, expireAt },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );
}

module.exports = { getCache, setCache };
