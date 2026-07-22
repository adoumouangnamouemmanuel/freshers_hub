const redisClient = require("../config/redis");
const { pool: db } = require("../services/db");
const logger = require("./logger");

const SYNC_INTERVAL_MS = 60 * 60 * 1000; // 1 hour

const syncMetricsToDb = async () => {
  try {
    // 1. Get all keys matching metrics:*
    const keys = await redisClient.keys("metrics:*");
    if (!keys || keys.length === 0) return;

    // 2. Fetch all values for these keys
    const values = await redisClient.mget(keys);

    // 3. Prepare data for bulk insert
    const metricsData = [];
    keys.forEach((key, index) => {
      // Key format: metrics:YYYY-MM-DD:HH:statusCode
      const parts = key.split(":");
      if (parts.length === 4) {
        const dateStr = parts[1];
        const hourStr = parts[2];
        const statusCodeStr = parts[3];
        const count = parseInt(values[index] || "0", 10);

        if (count > 0) {
          metricsData.push({ dateStr, hourStr, statusCodeStr, count, key });
        }
      }
    });

    if (metricsData.length === 0) return;

    // 4. Upsert into database
    // Note: Since Postgres doesn't have a clean bulk upsert without a bit of mapping,
    // we do it in a transaction or individual parameterized queries.
    const client = await db.connect();
    try {
      await client.query("BEGIN");
      
      for (const data of metricsData) {
        const query = `
          INSERT INTO api_metrics (metric_date, metric_hour, status_code, request_count)
          VALUES ($1, $2, $3, $4)
          ON CONFLICT (metric_date, metric_hour, status_code)
          DO UPDATE SET 
            request_count = api_metrics.request_count + EXCLUDED.request_count,
            updated_at = CURRENT_TIMESTAMP
        `;
        await client.query(query, [data.dateStr, data.hourStr, data.statusCodeStr, data.count]);
        
        // Decrement the Redis counter by the amount we just flushed so we don't double count
        // (If new requests came in while we were processing, this safely subtracts only what we saved)
        await redisClient.decrby(data.key, data.count);
      }
      
      await client.query("COMMIT");
      logger.info(`Successfully synced ${metricsData.length} metric buckets to Postgres.`);
    } catch (err) {
      await client.query("ROLLBACK");
      throw err;
    } finally {
      client.release();
    }
  } catch (err) {
    logger.error(`Error syncing metrics to DB: ${err.message}`);
  }
};

const initMetricsSyncer = () => {
  logger.info("Initializing Metrics Syncer (runs every hour)");
  setInterval(syncMetricsToDb, SYNC_INTERVAL_MS);
};

module.exports = { initMetricsSyncer, syncMetricsToDb };
