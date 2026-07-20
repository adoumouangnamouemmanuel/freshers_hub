const Redis = require("ioredis");
const logger = require("../utils/logger");

// Connect to Redis (defaults to localhost:6379, configurable via env vars)
const redis = new Redis(process.env.REDIS_URL || {
  host: process.env.REDIS_HOST || 'localhost',
  port: process.env.REDIS_PORT || 6379,
});

redis.on("error", (err) => {
  logger.error(`Redis connection error: ${err.message}`);
});
redis.on("connect", () => {
  logger.info("Connected to Redis for rate limiting & sessions");
});

// Rate limit configurations
const RATE_LIMITS = {
  login: { maxAttempts: 5, windowMs: 15 * 60 * 1000 }, // 5 attempts per 15 minutes
  otpRequest: { maxAttempts: 3, windowMs: 60 * 60 * 1000 }, // 3 per hour
  passwordReset: { maxAttempts: 3, windowMs: 60 * 60 * 1000 }, // 3 per hour
};

// Account lockout configurations
const LOCKOUT_CONFIG = {
  maxFailedAttempts: 5,
  lockoutDurationMs: 30 * 60 * 1000, // 30 minutes
};

/**
 * Rate limiting middleware using Redis
 * Uses action-specific identifier to avoid cross-contamination
 */
function rateLimit(action) {
  const config = RATE_LIMITS[action];
  if (!config) return (req, res, next) => next();

  return async (req, res, next) => {
    try {
      // Use action-specific identifier: "action:email" or "action:ip"
      const email = req.body?.email;
      const identifier = email 
        ? `${action}:${email.toLowerCase()}` 
        : `${action}:ip:${req.ip}`;
      const redisKey = `ratelimit:${identifier}`;
  
      // Increment request count
      const requests = await redis.incr(redisKey);
      
      // If this is the first request, set the expiration window
      if (requests === 1) {
        await redis.pexpire(redisKey, config.windowMs);
      }
  
      if (requests > config.maxAttempts) {
        const ttl = await redis.pttl(redisKey);
        logger.warn(`Rate limit exceeded for ${identifier} on ${action}`);
        return res.status(429).json({
          error: "Too many attempts. Please try again later.",
          retryAfter: Math.ceil((ttl > 0 ? ttl : config.windowMs) / 1000),
        });
      }
  
      next();
    } catch (err) {
      // Fail open if Redis is down so users can still log in
      logger.error(`Rate limiter Redis error: ${err.message}`);
      next();
    }
  };
}

/**
 * Account lockout middleware using Redis
 */
function checkAccountLockout() {
  return async (req, res, next) => {
    const { email } = req.body;
    if (!email) return next();

    const identifier = email.toLowerCase();
    const redisKey = `lockout:${identifier}`;

    try {
      const ttl = await redis.pttl(redisKey);
      
      // If ttl > 0, the account is locked
      if (ttl > 0) {
        logger.warn(`Account locked: ${identifier}. Remaining: ${Math.ceil(ttl / 1000)}s`);
        return res.status(423).json({
          error: "Account temporarily locked due to too many failed attempts.",
          retryAfter: Math.ceil(ttl / 1000),
        });
      }

      next();
    } catch (err) {
      logger.error(`Lockout check Redis error: ${err.message}`);
      next();
    }
  };
}

/**
 * Record failed login attempt using Redis
 * Once locked, additional attempts do NOT extend the lockout duration
 */
async function recordFailedLogin(email) {
  if (!email) return;
  const identifier = email.toLowerCase();
  
  const failedCountKey = `failed_logins:${identifier}`;
  const lockoutKey = `lockout:${identifier}`;

  try {
    // Check if already locked (don't extend if so)
    const isLocked = await redis.exists(lockoutKey);
    if (isLocked) {
      logger.warn(`Additional failed login for locked account ${identifier}. Lockout not extended.`);
      return;
    }

    // Increment failed login count
    const failedCount = await redis.incr(failedCountKey);
    
    // Set an expiration on the failed count window (e.g. 1 hour) so old failures clear eventually
    if (failedCount === 1) {
      await redis.pexpire(failedCountKey, 60 * 60 * 1000); // 1 hour window
    }

    if (failedCount >= LOCKOUT_CONFIG.maxFailedAttempts) {
      // Lock the account
      await redis.set(lockoutKey, 'locked', 'PX', LOCKOUT_CONFIG.lockoutDurationMs);
      // Clear the counter so when they unlock, they start fresh
      await redis.del(failedCountKey);
      logger.warn(`Account locked for ${identifier} after ${failedCount} failed attempts`);
    }
  } catch (err) {
    logger.error(`Record failed login Redis error: ${err.message}`);
  }
}

/**
 * Clear failed login attempts (on successful login)
 */
async function clearFailedLogins(email) {
  if (!email) return;
  const identifier = email.toLowerCase();
  try {
    await redis.del(`failed_logins:${identifier}`);
    await redis.del(`lockout:${identifier}`);
  } catch (err) {
    logger.error(`Clear failed logins Redis error: ${err.message}`);
  }
}

/**
 * Check if account is locked
 */
async function isAccountLocked(email) {
  if (!email) return false;
  const identifier = email.toLowerCase();
  try {
    const isLocked = await redis.exists(`lockout:${identifier}`);
    return isLocked === 1;
  } catch (err) {
    logger.error(`isAccountLocked Redis error: ${err.message}`);
    return false;
  }
}

module.exports = {
  rateLimit,
  checkAccountLockout,
  recordFailedLogin,
  clearFailedLogins,
  isAccountLocked,
  LOCKOUT_CONFIG,
};

