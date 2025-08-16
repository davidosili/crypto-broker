const ApiCache = require('../models/ApiCache');

async function getCache(key) {
  const doc = await ApiCache.findOne({ key });
  return doc ? doc.data : null;
}

async function setCache(key, data, ttlSeconds) {
  const expiresAt = new Date(Date.now() + ttlSeconds * 1000);
  await ApiCache.findOneAndUpdate(
    { key },
    { data, createdAt: new Date() },
    { upsert: true, new: true }
  );
  // TTL index is handled at schema level, but for flexibility we can run:
  ApiCache.collection.createIndex({ createdAt: 1 }, { expireAfterSeconds: ttlSeconds });
}

module.exports = { getCache, setCache };
