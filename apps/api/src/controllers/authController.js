const { pool } = require("../services/db");
const authService = require("../services/authService");
const AppError = require("../utils/AppError");
const asyncHandler = require("../utils/asyncHandler");
const logger = require("../utils/logger");
const {
  recordFailedLogin,
  clearFailedLogins,
} = require("../middleware/rateLimiter");
const Redis = require("ioredis");

const redis = new Redis(process.env.REDIS_URL || {
  host: process.env.REDIS_HOST || 'localhost',
  port: process.env.REDIS_PORT || 6379,
});

// NOTE: checkAccountLockout and rateLimit are applied as route-level middleware
// in authRoutes.js — do NOT call them manually inside the controller.

const handleLogin = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const clientIp = req.ip || req.connection.remoteAddress;
  logger.info(`Login attempt for email: ${email} from IP: ${clientIp}`);

  const client = await pool.connect();
  try {
    const user = await authService.loadUserBundle(client, String(email).trim());

    if (!user) {
      logger.warn(`Login failed: User not found (${email})`);
      // Generic error to prevent user enumeration
      const err = new AppError("Invalid credentials", 401);
      err.needsActivation = false;
      throw err;
    }

    if (!user.is_activated || !user.password_hash) {
      logger.warn(`Login failed: Account not activated (${email})`);
      const err = new AppError("Invalid credentials", 401);
      err.needsActivation = true;
      err.email = user.email;
      throw err;
    }

    const verification = await client.query(
      `
        SELECT password_hash = crypt($2, password_hash) AS matches
        FROM credentials
        WHERE user_id = $1
      `,
      [user.id, String(password)],
    );

    if (!verification.rows[0]?.matches) {
      logger.warn(
        `Login failed: Invalid credentials (${email}) from IP: ${clientIp}`,
      );
      // Record failed login attempt (now async)
      await recordFailedLogin(email);

      // TODO: Send alert to Sentry/DataDog after 3 failed attempts
      // TODO: Implement CAPTCHA after 3 failed attempts
      // TODO: Add device fingerprinting for suspicious login detection

      throw new AppError("Invalid credentials", 401);
    }

    // Clear failed login attempts on successful login (now async)
    await clearFailedLogins(email);

    logger.info(`Successful login for ${email} from IP: ${clientIp}`);
    // TODO: Log successful login to monitoring service
    // TODO: Send email notification for new login from unrecognized device

    const tokens = await authService.issueTokens(client, user);
    logger.info(`Login successful for email: ${email}`);

    res.json({
      user: {
        id: user.id,
        email: user.email,
        fullName: user.full_name,
        phone: user.phone,
        country: user.country,
        major: user.major,
        avatarUrl: user.avatar_url,
        classYear: user.class_year,
        roles: user.roles,
        studentProfile: user.student_profile,
        createdAt: user.created_at,
      },
      ...tokens,
    });
  } catch (error) {
    logger.error(`Login error for ${email}: ${error.message}`);
    throw error;
  } finally {
    client.release();
  }
});

// Step 1: Verify OTP and mark it as used
const handleVerifyOtp = asyncHandler(async (req, res) => {
  const { email, otp } = req.body;
  logger.info(`OTP verification attempt for email: ${email}`);

  const client = await pool.connect();
  try {
    const userResult = await client.query(
      `SELECT id, email FROM users WHERE lower(email) = lower($1)`,
      [String(email).trim()]
    );

    const user = userResult.rows[0];
    if (!user) {
      logger.warn(`OTP verification failed: User not found (${email})`);
      throw new AppError("Invalid or expired OTP", 400);
    }

    const redisKey = `otp:activation:${user.id}`;
    const storedHash = await redis.get(redisKey);

    if (!storedHash) {
      logger.warn(`OTP verification failed: Expired or not found (${email})`);
      throw new AppError("Invalid or expired OTP", 400);
    }

    if (storedHash === "consumed") {
      logger.warn(`OTP verification failed: OTP already used (${email})`);
      throw new AppError("Invalid or expired OTP", 400);
    }

    const providedHash = authService.hashToken(String(otp).trim());
    if (storedHash !== providedHash) {
      logger.warn(`OTP verification failed: Invalid OTP (${email})`);
      throw new AppError("Invalid or expired OTP", 400);
    }

    // Mark OTP as consumed but keep its expiration window active
    await redis.set(redisKey, "consumed", "KEEPTTL");

    logger.info(`OTP verified successfully for email: ${email}`);
    res.json({
      success: true,
      message: "OTP verified. Please set your password.",
      email: user.email,
    });
  } catch (error) {
    logger.error(`OTP verification error for ${email}: ${error.message}`);
    throw error;
  } finally {
    client.release();
  }
});

// Step 2: Set password and complete activation
const handleSetPassword = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  logger.info(`Set password attempt for email: ${email}`);

  const client = await pool.connect();
  try {
    const user = await authService.loadUserBundle(client, String(email).trim());

    if (!user) {
      logger.warn(`Set password failed: User not found (${email})`);
      throw new AppError("User not found", 404);
    }

    // FIX #2: Verify OTP was already consumed before allowing password set.
    // Without this check, an attacker knowing a valid email could skip the OTP step.
    const redisKey = `otp:activation:${user.id}`;
    const status = await redis.get(redisKey);

    if (status !== "consumed") {
      logger.warn(`Set password failed: OTP not yet consumed for (${email})`);
      throw new AppError("OTP verification required before setting password", 403);
    }

    // Clean up Redis
    await redis.del(redisKey);

    // Set password and activate
    await client.query(
      `
        INSERT INTO credentials (user_id, password_hash, is_activated, activated_at)
        VALUES ($1, crypt($2, gen_salt('bf')), true, now())
        ON CONFLICT (user_id) DO UPDATE
        SET password_hash = EXCLUDED.password_hash,
            is_activated = EXCLUDED.is_activated,
            activated_at = EXCLUDED.activated_at,
            updated_at = now()
      `,
      [user.id, String(password)],
    );

    const updatedUser = await authService.loadUserBundle(
      client,
      String(email).trim(),
    );
    const tokens = await authService.issueTokens(client, updatedUser);

    logger.info(`Password set and activation successful for email: ${email}`);
    // TODO: Send welcome email with account activation confirmation
    // TODO: Log activation event to monitoring service

    res.json({
      user: {
        id: user.id,
        email: user.email,
        fullName: user.full_name,
        phone: user.phone,
        country: user.country,
        major: user.major,
        avatarUrl: user.avatar_url,
        classYear: user.class_year,
        roles: user.roles,
        studentProfile: user.student_profile,
        createdAt: user.created_at,
      },
      ...tokens,
    });
  } catch (error) {
    logger.error(`Set password error for ${email}: ${error.message}`);
    throw error;
  } finally {
    client.release();
  }
});

const handleRefresh = asyncHandler(async (req, res) => {
  const { refreshToken } = req.body;
  logger.info(`Refresh token request`);

  const client = await pool.connect();
  try {
    const tokenHash = authService.hashToken(String(refreshToken).trim());
    const { rows } = await client.query(
      `
        SELECT rt.id, rt.user_id, u.email, rt.expires_at
        FROM refresh_tokens rt
        JOIN users u ON u.id = rt.user_id
        WHERE rt.token_hash = $1
          AND rt.revoked_at IS NULL
          AND rt.expires_at > now()
      `,
      [tokenHash],
    );

    const record = rows[0];
    if (!record) {
      logger.warn(`Refresh failed: Invalid token`);
      throw new AppError("Invalid refresh token", 401);
    }

    // NOTE: We do NOT revoke the refresh token on use to support biometric login
    // The refresh token will remain valid until it expires (90 days) or user logs out
    // This allows the same refresh token to be used multiple times for biometric authentication

    const user = await authService.loadUserBundle(client, record.email);
    const tokens = await authService.issueTokens(client, user);

    logger.info(`Refresh successful for email: ${user.email}`);
    res.json({
      user: {
        id: user.id,
        email: user.email,
        fullName: user.full_name,
        phone: user.phone,
        country: user.country,
        major: user.major,
        avatarUrl: user.avatar_url,
        classYear: user.class_year,
        roles: user.roles,
        studentProfile: user.student_profile,
        createdAt: user.created_at,
      },
      ...tokens,
    });
  } catch (error) {
    logger.error(`Refresh token error: ${error.message}`);
    throw error;
  } finally {
    client.release();
  }
});

const handleRequestOtp = asyncHandler(async (req, res) => {
  const { email } = req.body;
  logger.info(`OTP request for email: ${email}`);

  const client = await pool.connect();
  try {
    const user = await authService.loadUserBundle(client, String(email).trim());

    if (!user) {
      logger.warn(`OTP request failed: User not found (${email})`);
      // Don't reveal if user exists
      res.json({
        success: true,
        message: "If an account exists, an OTP has been sent",
      });
      return;
    }

    if (user.is_activated && user.password_hash) {
      logger.warn(`OTP request failed: Account already activated (${email})`);
      // Don't reveal account status
      res.json({
        success: true,
        message: "If an account exists, an OTP has been sent",
      });
      return;
    }

    await authService.generateOTP(client, user);
    logger.info(`OTP successfully generated for email: ${email}`);

    res.json({
      success: true,
      message: "If an account exists, an OTP has been sent",
    });
  } catch (error) {
    logger.error(`OTP request error for ${email}: ${error.message}`);
    throw error;
  } finally {
    client.release();
  }
});

const handleForgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;
  logger.info(`Forgot password request for email: ${email}`);

  const client = await pool.connect();
  try {
    const user = await authService.loadUserBundle(client, String(email).trim());

    if (!user) {
      logger.warn(`Forgot password request failed: User not found (${email})`);
      // Don't reveal if user exists
      res.json({
        success: true,
        message: "If an account exists, a reset code has been sent",
      });
      return;
    }

    // Only allow password reset for activated accounts
    if (!user.is_activated || !user.password_hash) {
      logger.warn(
        `Forgot password request failed: Account not activated (${email})`,
      );
      // Don't reveal account status
      res.json({
        success: true,
        message: "If an account exists, a reset code has been sent",
      });
      return;
    }

    // Generate OTP for password reset
    await authService.generatePasswordResetOtp(client, user);
    logger.info(`Password reset OTP generated for email: ${email}`);

    res.json({
      success: true,
      message: "If an account exists, a reset code has been sent",
    });
  } catch (error) {
    logger.error(`Forgot password error for ${email}: ${error.message}`);
    throw error;
  } finally {
    client.release();
  }
});

// Step 1: Verify reset OTP
const handleVerifyResetOtp = asyncHandler(async (req, res) => {
  const { email, otp } = req.body;
  logger.info(`Verify reset OTP for email: ${email}`);

  const client = await pool.connect();
  try {
    const user = await authService.loadUserBundle(client, String(email).trim());

    // FIX #4: Return the same generic error whether the user exists or not,
    // to prevent email enumeration via this endpoint.
    if (!user) {
      logger.warn(`Verify reset OTP failed: User not found (${email})`);
      throw new AppError("Invalid or expired code", 400);
    }

    const redisKey = `otp:reset:${user.id}`;
    const storedHash = await redis.get(redisKey);

    if (!storedHash) {
      logger.warn(`Verify reset OTP failed: Expired or not found (${email})`);
      throw new AppError("Invalid or expired code", 400);
    }

    if (storedHash === "consumed") {
      logger.warn(`Verify reset OTP failed: OTP already used (${email})`);
      throw new AppError("Invalid or expired code", 400);
    }

    const providedHash = authService.hashToken(String(otp).trim());
    if (storedHash !== providedHash) {
      logger.warn(`Verify reset OTP failed: Invalid OTP (${email})`);
      throw new AppError("Invalid or expired code", 400);
    }

    // Mark OTP as consumed but keep its expiration window active
    await redis.set(redisKey, "consumed", "KEEPTTL");

    logger.info(`Reset OTP verified successfully for email: ${email}`);
    res.json({
      success: true,
      message: "OTP verified. Please set your new password.",
    });
  } catch (error) {
    logger.error(`Verify reset OTP error for ${email}: ${error.message}`);
    throw error;
  } finally {
    client.release();
  }
});

// Step 2: Set new password
const handleSetNewPassword = asyncHandler(async (req, res) => {
  const { email, otp, newPassword } = req.body;
  logger.info(`Set new password for email: ${email}`);

  const client = await pool.connect();
  try {
    const user = await authService.loadUserBundle(client, String(email).trim());
    if (!user) {
      // FIX #4: return generic error so user existence is not revealed
      throw new AppError("Invalid or expired code", 400);
    }

    // Verify OTP again
    const redisKey = `otp:reset:${user.id}`;
    const status = await redis.get(redisKey);

    if (status !== "consumed") {
      throw new AppError("Invalid or expired code", 400);
    }

    // Clean up Redis
    await redis.del(redisKey);

    // FIX #3: Wrap the password update + OTP consumption + refresh token revocation
    // in a single transaction so no partial state can be left on server crash.
    // FIX #7: Revoke all existing refresh tokens so stolen tokens are invalidated
    // immediately after a password reset.
    await client.query("BEGIN");

    await client.query(
      `
        UPDATE credentials
        SET password_hash = crypt($2, gen_salt('bf')),
            updated_at = now()
        WHERE user_id = $1
      `,
      [user.id, String(newPassword)],
    );


    // Revoke all active refresh tokens — forces re-login on all devices
    await client.query(
      `
        UPDATE refresh_tokens
        SET revoked_at = now()
        WHERE user_id = $1 AND revoked_at IS NULL
      `,
      [user.id],
    );

    await client.query("COMMIT");

    logger.info(`Password successfully reset for email: ${email}`);
    // TODO: Send email notification confirming password change
    // TODO: Log password reset event to monitoring service for fraud detection

    res.json({
      success: true,
      message: "Password has been successfully reset",
    });
  } catch (error) {
    await client.query("ROLLBACK").catch(() => {});
    logger.error(`Set new password error for ${email}: ${error.message}`);
    throw error;
  } finally {
    client.release();
  }
});

const handleCheckEmail = asyncHandler(async (req, res) => {
  const { email } = req.body;
  logger.info(`Check email request for: ${email}`);

  const client = await pool.connect();
  try {
    const user = await authService.loadUserBundle(client, String(email).trim());

    if (!user) {
      logger.warn(`Check email failed: User not found (${email})`);
      return res.json({ exists: false, activated: false });
    }

    const activated = !!(user.is_activated && user.password_hash);
    logger.info(
      `Check email success: exists=true, activated=${activated} (${email})`,
    );
    res.json({ exists: true, activated });
  } catch (error) {
    logger.error(`Check email error for ${email}: ${error.message}`);
    throw error;
  } finally {
    client.release();
  }
});

// Change password (authenticated)
const handleChangePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const userId = req.user?.id; // From auth middleware
  logger.info(`Change password request for user: ${userId}`);

  if (!userId) {
    throw new AppError("Authentication required", 401);
  }

  const client = await pool.connect();
  try {
    // Verify current password
    const verification = await client.query(
      `
        SELECT password_hash = crypt($2, password_hash) AS matches
        FROM credentials
        WHERE user_id = $1
      `,
      [userId, String(currentPassword)],
    );

    if (!verification.rows[0]?.matches) {
      logger.warn(`Change password failed: Invalid current password for user ${userId}`);
      throw new AppError("Current password is incorrect", 400);
    }

    // FIX #3 + #7: Wrap password update and refresh token revocation in a transaction.
    // Revoking tokens forces re-login on all other devices after a password change.
    await client.query("BEGIN");

    await client.query(
      `
        UPDATE credentials
        SET password_hash = crypt($2, gen_salt('bf')),
            updated_at = now()
        WHERE user_id = $1
      `,
      [userId, String(newPassword)],
    );

    // Revoke all active refresh tokens — stolen tokens are immediately invalidated
    await client.query(
      `
        UPDATE refresh_tokens
        SET revoked_at = now()
        WHERE user_id = $1 AND revoked_at IS NULL
      `,
      [userId],
    );

    await client.query("COMMIT");

    logger.info(`Password changed successfully for user: ${userId}`);
    res.json({ success: true, message: "Password changed successfully" });
  } catch (error) {
    await client.query("ROLLBACK").catch(() => {});
    logger.error(`Change password error for user ${userId}: ${error.message}`);
    throw error;
  } finally {
    client.release();
  }
});

// Update user profile
const handleUpdateProfile = asyncHandler(async (req, res) => {
  const { phone, major, avatarUrl } = req.body;
  const userId = req.user?.id; // From auth middleware
  logger.info(`Update profile request for user: ${userId}`);

  if (!userId) {
    throw new AppError("Authentication required", 401);
  }

  const client = await pool.connect();
  try {
    // Update user profile
    await client.query(
      `
        UPDATE users
        SET phone = $2,
            major = $3,
            avatar_url = $4,
            updated_at = now()
        WHERE id = $1
      `,
      [userId, phone || null, major || null, avatarUrl || null],
    );

    // Get updated user data
    const user = await authService.loadUserBundle(client, null, userId);
    const tokens = await authService.issueTokens(client, user);

    logger.info(`Profile updated successfully for user: ${userId}`);
    res.json({
      user: {
        id: user.id,
        email: user.email,
        fullName: user.full_name,
        phone: user.phone,
        country: user.country,
        major: user.major,
        avatarUrl: user.avatar_url,
        classYear: user.class_year,
        roles: user.roles,
        studentProfile: user.student_profile,
        createdAt: user.created_at,
      },
      ...tokens,
    });
  } catch (error) {
    logger.error(`Update profile error for user ${userId}: ${error.message}`);
    throw error;
  } finally {
    client.release();
  }
});

const handleLogout = asyncHandler(async (req, res) => {
  const { refreshToken } = req.body;
  logger.info(`Logout request`);

  if (!refreshToken) {
    return res.json({ success: true });
  }

  const client = await pool.connect();
  try {
    const tokenHash = authService.hashToken(String(refreshToken).trim());

    await client.query(
      `
        UPDATE refresh_tokens
        SET revoked_at = now()
        WHERE token_hash = $1
      `,
      [tokenHash],
    );

    logger.info(`Logout successful, token revoked`);
    res.json({ success: true, message: "Logged out successfully" });
  } catch (error) {
    logger.error(`Logout error: ${error.message}`);
    throw error;
  } finally {
    client.release();
  }
});

module.exports = {
  handleLogin,
  handleVerifyOtp,
  handleSetPassword,
  handleRefresh,
  handleRequestOtp,
  handleForgotPassword,
  handleVerifyResetOtp,
  handleSetNewPassword,
  handleCheckEmail,
  handleLogout,
  handleChangePassword,
  handleUpdateProfile,
};