const NodeCache = require('node-cache');
// Cache instances (duration in seconds)
// Store items for 60 seconds by default
const cache = new NodeCache({ stdTTL: 60, checkperiod: 120 });

const cacheMiddleware = (durationInSeconds = 60) => {
  return (req, res, next) => {
    // Only cache GET requests
    if (req.method !== 'GET') {
      return next();
    }

    const key = req.originalUrl || req.url;
    const cachedResponse = cache.get(key);

    if (cachedResponse) {
      console.log(`[Cache Hit] ${key}`);
      return res.json(cachedResponse);
    } else {
      console.log(`[Cache Miss] ${key}`);
      // Override res.json to intercept the response before sending it
      const originalJson = res.json;
      res.json = (body) => {
        // Cache the response body
        cache.set(key, body, durationInSeconds);
        // Call the original res.json
        originalJson.call(res, body);
      };
      next();
    }
  };
};

const clearCache = (keyPattern) => {
  const keys = cache.keys();
  keys.forEach(k => {
    if (k.includes(keyPattern)) {
      cache.del(k);
    }
  });
};

module.exports = { cacheMiddleware, clearCache };
