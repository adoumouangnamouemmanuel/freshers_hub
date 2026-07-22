const os = require("os");
const { pool: db } = require("../services/db");
const redisClient = require("../config/redis");
const logger = require("../utils/logger");

const getHealthStatus = async (req, res) => {
  try {
    // 1. System/OS Metrics
    const memoryData = process.memoryUsage();
    const memUsage = (memoryData.heapUsed / memoryData.heapTotal) * 100;
    const cpuLoad = os.loadavg(); // [1 min, 5 min, 15 min]
    const uptime = process.uptime(); // Node.js uptime in seconds
    
    // 2. Postgres DB Status
    let dbStatus = "disconnected";
    let dbLatency = -1;
    let dbConnections = { active: 0, idle: 0 };
    
    try {
      const dbStart = process.hrtime();
      const client = await db.connect();
      const dbDiff = process.hrtime(dbStart);
      dbLatency = (dbDiff[0] * 1e9 + dbDiff[1]) / 1e6; // to ms
      
      const connResult = await client.query(`
        SELECT state, count(*) 
        FROM pg_stat_activity 
        WHERE datname = current_database()
        GROUP BY state;
      `);
      
      connResult.rows.forEach(row => {
        if (row.state === "active") dbConnections.active = parseInt(row.count, 10);
        else if (row.state === "idle") dbConnections.idle = parseInt(row.count, 10);
      });
      
      client.release();
      dbStatus = "connected";
    } catch (dbErr) {
      logger.error("DB Health Check Failed:", dbErr.message);
    }
    
    // 3. Redis Status
    let redisStatus = "disconnected";
    try {
      if (redisClient.status === "ready") {
        redisStatus = "connected";
      }
    } catch (redisErr) {
      logger.error("Redis Health Check Failed:", redisErr.message);
    }

    res.json({
      status: dbStatus === "connected" && redisStatus === "connected" ? "healthy" : "degraded",
      system: {
        memory_usage_percent: memUsage.toFixed(2),
        cpu_load_avg: cpuLoad,
        uptime_seconds: Math.floor(uptime),
      },
      database: {
        status: dbStatus,
        latency_ms: dbLatency.toFixed(2),
        connections: dbConnections
      },
      redis: {
        status: redisStatus
      }
    });

  } catch (err) {
    logger.error("System Health Error: ", err);
    res.status(500).json({ error: "Failed to retrieve health status" });
  }
};

const getTrafficMetrics = async (req, res) => {
  try {
    // 1. Return the historical data from Postgres for the last 7 days
    const result = await db.query(`
      SELECT 
        metric_date, 
        status_code, 
        SUM(request_count) as total_requests
      FROM api_metrics
      WHERE metric_date >= CURRENT_DATE - INTERVAL '7 days'
      GROUP BY metric_date, status_code
      ORDER BY metric_date ASC;
    `);

    // Group DB results by date and status
    const historicalData = result.rows.map(row => ({
      date: row.metric_date.toISOString().split("T")[0],
      status: row.status_code,
      count: parseInt(row.total_requests, 10)
    }));

    // 2. Fetch today's LIVE data from Redis
    const keys = await redisClient.keys("metrics:*");
    let totalLatency = 0;
    let totalRequests = 0;
    const liveCounts = {};

    if (keys && keys.length > 0) {
      const values = await redisClient.mget(keys);
      
      keys.forEach((key, index) => {
        const parts = key.split(":"); // metrics:YYYY-MM-DD:HH:statusCode OR metrics:latency:...
        const val = parseFloat(values[index] || "0");
        
        if (parts[1] === "latency") {
          totalLatency += val;
        } else if (parts[1] === "count") {
          totalRequests += val;
        } else if (parts.length === 4) {
          // This is a status code metric: metrics:YYYY-MM-DD:HH:statusCode
          const dateStr = parts[1];
          const statusCode = parts[3];
          
          if (!liveCounts[dateStr]) liveCounts[dateStr] = {};
          if (!liveCounts[dateStr][statusCode]) liveCounts[dateStr][statusCode] = 0;
          liveCounts[dateStr][statusCode] += val;
        }
      });
    }

    // Merge live data into the historical payload
    for (const [dateStr, statusObj] of Object.entries(liveCounts)) {
      for (const [statusCode, count] of Object.entries(statusObj)) {
        historicalData.push({
          date: dateStr,
          status: statusCode,
          count: count
        });
      }
    }

    // Aggregate into a format easy for Recharts:
    // [ { date: '2026-07-22', '200': 500, '404': 20, '500': 1 }, ... ]
    const chartDataMap = {};
    historicalData.forEach(item => {
      if (!chartDataMap[item.date]) {
        chartDataMap[item.date] = { date: item.date, success: 0, clientError: 0, serverError: 0 };
      }
      
      let group = "success";
      if (item.status.startsWith("4")) group = "clientError";
      else if (item.status.startsWith("5")) group = "serverError";
      
      chartDataMap[item.date][group] += item.count;
    });

    const chartData = Object.values(chartDataMap).sort((a, b) => a.date.localeCompare(b.date));
    const averageLatency = totalRequests > 0 ? (totalLatency / totalRequests).toFixed(2) : 0;

    // Aggregate today's status codes for the live widget
    const todayStr = new Date().toISOString().split("T")[0];
    const todayBreakdown = liveCounts[todayStr] || {};
    let totalSuccess = 0;
    let totalError = 0;
    
    Object.entries(todayBreakdown).forEach(([code, count]) => {
      if (code.startsWith("2") || code.startsWith("3")) totalSuccess += count;
      else totalError += count;
    });

    res.json({
      chartData,
      liveStats: {
        totalRequestsToday: totalRequests,
        averageLatencyMs: averageLatency,
        breakdown: todayBreakdown,
        success: totalSuccess,
        errors: totalError
      }
    });
  } catch (err) {
    logger.error("System Metrics Error: ", err);
    res.status(500).json({ error: "Failed to retrieve traffic metrics" });
  }
};

module.exports = {
  getHealthStatus,
  getTrafficMetrics
};
