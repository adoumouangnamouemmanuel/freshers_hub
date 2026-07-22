const redisClient = require("../config/redis");

const metricsMiddleware = (req, res, next) => {
  // Capture the start time for response time calculation
  const start = process.hrtime();

  // Listen for the 'finish' event to intercept the status code
  res.on("finish", () => {
    const statusCode = res.statusCode;
    
    // Calculate response duration in milliseconds
    const diff = process.hrtime(start);
    const durationMs = (diff[0] * 1e9 + diff[1]) / 1e6;
    
    const date = new Date();
    const dateStr = date.toISOString().split("T")[0]; // YYYY-MM-DD
    const hour = date.getHours(); // 0-23
    
    const redisKey = `metrics:${dateStr}:${hour}:${statusCode}`;
    const latencyKey = `metrics:latency:${dateStr}:${hour}`;
    const countKey = `metrics:count:${dateStr}:${hour}`;
    
    // Increment the counters
    Promise.all([
      redisClient.incr(redisKey),
      redisClient.incrbyfloat(latencyKey, durationMs),
      redisClient.incr(countKey)
    ]).catch(err => {
      console.error("Failed to increment metrics in Redis:", err);
    });
  });

  next();
};

module.exports = metricsMiddleware;
