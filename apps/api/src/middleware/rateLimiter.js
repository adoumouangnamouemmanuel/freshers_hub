const logger = require("../utils/logger");

// In-memory store for rate limiting (use Redis in production)
const rateLimitStore = new Map();
const lockoutStore = new Map();

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
 * Rate limiting middleware
 * Uses action-specific identifier to avoid cross-contamination
 */
function rateLimit(action) {
  const config = RATE_LIMITS[action];
  if (!config) return (req, res, next) => next();

  return (req, res, next) => {
    // Use action-specific identifier: "action:email" or "action:ip"
    const email = req.body?.email;
    const identifier = email 
      ? `${action}:${email.toLowerCase()}` 
      : `${action}:ip:${req.ip}`;
    const now = Date.now();

    const record = rateLimitStore.get(identifier);

    if (!record || now - record.windowStart > config.windowMs) {
      // New window or expired
      rateLimitStore.set(identifier, {
        count: 1,
        windowStart: now,
      });
      return next();
    }

    if (record.count >= config.maxAttempts) {
      logger.warn(`Rate limit exceeded for ${identifier} on ${action}`);
      return res.status(429).json({
        error: "Too many attempts. Please try again later.",
        retryAfter: Math.ceil((config.windowMs - (now - record.windowStart)) / 1000),
      });
    }

    record.count++;
    next();
  };
}

/**
 * Account lockout middleware
 */
function checkAccountLockout() {
  return (req, res, next) => {
    const { email } = req.body;
    if (!email) return next();

    const identifier = email.toLowerCase();
    const lockoutRecord = lockoutStore.get(identifier);
    const now = Date.now();

    if (lockoutRecord) {
      // Check if lockout is still active
      if (lockoutRecord.lockedUntil && now < lockoutRecord.lockedUntil) {
        const remainingMs = lockoutRecord.lockedUntil - now;
        logger.warn(`Account locked: ${identifier}. Remaining: ${Math.ceil(remainingMs / 1000)}s`);
        return res.status(423).json({
          error: "Account temporarily locked due to too many failed attempts.",
          retryAfter: Math.ceil(remainingMs / 1000),
        });
      }

      // Lockout expired, clear it
      if (lockoutRecord.lockedUntil && now >= lockoutRecord.lockedUntil) {
        lockoutStore.delete(identifier);
      }
    }

    next();
  };
}

/**
 * Record failed login attempt
 * Once locked, additional attempts do NOT extend the lockout duration
 */
function recordFailedLogin(email) {
  const identifier = email.toLowerCase();
  const now = Date.now();

  const record = lockoutStore.get(identifier) || { failedCount: 0 };

  // If already locked, do NOT extend the lockout
  if (record.lockedUntil && now < record.lockedUntil) {
    logger.warn(`Additional failed login for locked account ${identifier}. Lockout not extended.`);
    return;
  }

  // If lockout expired, clear and start fresh
  if (record.lockedUntil && now >= record.lockedUntil) {
    lockoutStore.delete(identifier);
    const newRecord = { failedCount: 1, lastFailedAt: now };
    lockoutStore.set(identifier, newRecord);
    return;
  }

  record.failedCount++;
  record.lastFailedAt = now;

  if (record.failedCount >= LOCKOUT_CONFIG.maxFailedAttempts) {
    record.lockedUntil = now + LOCKOUT_CONFIG.lockoutDurationMs;
    logger.warn(`Account locked for ${identifier} after ${record.failedCount} failed attempts`);
  }

  lockoutStore.set(identifier, record);
}

/**
 * Clear failed login attempts (on successful login)
 */
function clearFailedLogins(email) {
  const identifier = email.toLowerCase();
  lockoutStore.delete(identifier);
}

/**
 * Check if account is locked
 */
function isAccountLocked(email) {
  const identifier = email.toLowerCase();
  const record = lockoutStore.get(identifier);

  if (!record || !record.lockedUntil) return false;

  const now = Date.now();
  if (now >= record.lockedUntil) {
    lockoutStore.delete(identifier);
    return false;
  }

  return true;
}

module.exports = {
  rateLimit,
  checkAccountLockout,
  recordFailedLogin,
  clearFailedLogins,
  isAccountLocked,
  LOCKOUT_CONFIG,
};
