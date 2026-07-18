const { pool } = require("../services/db");
const authService = require("../services/authService");
const AppError = require("../utils/AppError");
const asyncHandler = require("../utils/asyncHandler");
const logger = require("../utils/logger");
const { checkAccountLockout, recordFailedLogin, clearFailedLogins } = require("../middleware/rateLimiter");

const handleLogin = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const clientIp = req.ip || req.connection.remoteAddress;
  logger.info(`Login attempt for email: ${email} from IP: ${clientIp}`);

  // Check if account is locked
  const lockoutCheck = checkAccountLockout(req, res, () => {});
  lockoutCheck(req, res, () => {});

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
      [user.id, String(password)]
    );

    if (!verification.rows[0]?.matches) {
      logger.warn(`Login failed: Invalid credentials (${email}) from IP: ${clientIp}`);
      // Record failed login attempt
      recordFailedLogin(email);
      
      // TODO: Send alert to Sentry/DataDog after 3 failed attempts
      // TODO: Implement CAPTCHA after 3 failed attempts
      // TODO: Add device fingerprinting for suspicious login detection
      
      throw new AppError("Invalid credentials", 401);
    }

    // Clear failed login attempts on successful login
    clearFailedLogins(email);
    
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
        roles: user.roles,
        studentProfile: user.student_profile,
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
    const { rows } = await client.query(
      `
        SELECT
          u.id, u.email, ac.otp_hash, ac.expires_at, ac.consumed_at
        FROM users u
        JOIN activation_codes ac ON ac.user_id = u.id
        WHERE lower(u.email) = lower($1)
      `,
      [String(email).trim()]
    );

    const record = rows[0];
    if (!record) {
      logger.warn(`OTP verification failed: Record not found (${email})`);
      throw new AppError("Invalid or expired OTP", 400);
    }
    if (record.consumed_at) {
      logger.warn(`OTP verification failed: OTP already used (${email})`);
      throw new AppError("Invalid or expired OTP", 400);
    }
    if (new Date(record.expires_at).getTime() < Date.now()) {
      logger.warn(`OTP verification failed: OTP expired (${email})`);
      throw new AppError("Invalid or expired OTP", 400);
    }

    const otpCheck = await client.query(
      `
        SELECT crypt($2, otp_hash) = otp_hash AS matches
        FROM activation_codes
        WHERE user_id = $1
      `,
      [record.id, String(otp).trim()]
    );

    if (!otpCheck.rows[0]?.matches) {
      logger.warn(`OTP verification failed: Invalid OTP (${email})`);
      throw new AppError("Invalid or expired OTP", 400);
    }

    // Mark OTP as consumed
    await client.query(
      `
        UPDATE activation_codes
        SET consumed_at = now()
        WHERE user_id = $1
      `,
      [record.id]
    );

    logger.info(`OTP verified successfully for email: ${email}`);
    res.json({ 
      success: true, 
      message: "OTP verified. Please set your password.",
      email: record.email 
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
      [user.id, String(password)]
    );

    const updatedUser = await authService.loadUserBundle(client, String(email).trim());
    const tokens = await authService.issueTokens(client, updatedUser);

    logger.info(`Password set and activation successful for email: ${email}`);
    // TODO: Send welcome email with account activation confirmation
    // TODO: Log activation event to monitoring service
    
    res.json({
      activated: true,
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        fullName: updatedUser.full_name,
        roles: updatedUser.roles,
        studentProfile: updatedUser.student_profile,
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
      [tokenHash]
    );

    const record = rows[0];
    if (!record) {
      logger.warn(`Refresh failed: Invalid token`);
      throw new AppError("Invalid refresh token", 401);
    }

    await client.query(
      `
        UPDATE refresh_tokens
        SET revoked_at = now()
        WHERE id = $1
      `,
      [record.id]
    );

    const user = await authService.loadUserBundle(client, record.email);
    const tokens = await authService.issueTokens(client, user);

    logger.info(`Refresh successful for email: ${user.email}`);
    res.json({
      user: {
        id: user.id,
        email: user.email,
        fullName: user.full_name,
        roles: user.roles,
        studentProfile: user.student_profile,
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
      res.json({ success: true, message: "If an account exists, an OTP has been sent" });
      return;
    }

    if (user.is_activated && user.password_hash) {
      logger.warn(`OTP request failed: Account already activated (${email})`);
      // Don't reveal account status
      res.json({ success: true, message: "If an account exists, an OTP has been sent" });
      return;
    }

    await authService.generateOTP(client, user);
    logger.info(`OTP successfully generated for email: ${email}`);
    
    res.json({ success: true, message: "If an account exists, an OTP has been sent" });
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
      res.json({ success: true, message: "If an account exists, a reset code has been sent" });
      return;
    }

    // Only allow password reset for activated accounts
    if (!user.is_activated || !user.password_hash) {
      logger.warn(`Forgot password request failed: Account not activated (${email})`);
      // Don't reveal account status
      res.json({ success: true, message: "If an account exists, a reset code has been sent" });
      return;
    }

    // Generate OTP for password reset
    await authService.generatePasswordResetOtp(client, user);
    logger.info(`Password reset OTP generated for email: ${email}`);
    
    res.json({ success: true, message: "If an account exists, a reset code has been sent" });
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
    if (!user) {
      throw new AppError("User not found", 404);
    }

    const { rows } = await client.query(
      `
        SELECT pr.token_hash, pr.expires_at, pr.consumed_at
        FROM password_resets pr
        WHERE pr.user_id = $1
        ORDER BY pr.created_at DESC
        LIMIT 1
      `,
      [user.id]
    );

    const record = rows[0];
    if (!record) {
      logger.warn(`Verify reset OTP failed: No OTP found (${email})`);
      throw new AppError("Invalid or expired code", 400);
    }
    if (record.consumed_at) {
      logger.warn(`Verify reset OTP failed: OTP already used (${email})`);
      throw new AppError("Invalid or expired code", 400);
    }
    if (new Date(record.expires_at).getTime() < Date.now()) {
      logger.warn(`Verify reset OTP failed: OTP expired (${email})`);
      throw new AppError("Invalid or expired code", 400);
    }

    const otpCheck = await client.query(
      `
        SELECT crypt($2, token_hash) = token_hash AS matches
        FROM password_resets
        WHERE user_id = $1
      `,
      [user.id, String(otp).trim()]
    );

    if (!otpCheck.rows[0]?.matches) {
      logger.warn(`Verify reset OTP failed: Invalid OTP (${email})`);
      throw new AppError("Invalid or expired code", 400);
    }

    logger.info(`Reset OTP verified successfully for email: ${email}`);
    res.json({ success: true, message: "OTP verified. Please set your new password." });
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
      throw new AppError("User not found", 404);
    }

    // Verify OTP again
    const { rows } = await client.query(
      `
        SELECT pr.token_hash, pr.expires_at, pr.consumed_at
        FROM password_resets pr
        WHERE pr.user_id = $1
        ORDER BY pr.created_at DESC
        LIMIT 1
      `,
      [user.id]
    );

    const record = rows[0];
    if (!record || record.consumed_at || new Date(record.expires_at).getTime() < Date.now()) {
      throw new AppError("Invalid or expired code", 400);
    }

    const otpCheck = await client.query(
      `
        SELECT crypt($2, token_hash) = token_hash AS matches
        FROM password_resets
        WHERE user_id = $1
      `,
      [user.id, String(otp).trim()]
    );

    if (!otpCheck.rows[0]?.matches) {
      throw new AppError("Invalid or expired code", 400);
    }

    // Update password
    await client.query(
      `
      UPDATE credentials
      SET password_hash = crypt($2, gen_salt('bf')),
          updated_at = now()
      WHERE user_id = $1
    `,
      [user.id, String(newPassword)]
    );

    // Mark OTP as consumed
    await client.query(
      `
      UPDATE password_resets
      SET consumed_at = now()
      WHERE user_id = $1
    `,
      [user.id]
    );

    logger.info(`Password successfully reset for email: ${email}`);
    // TODO: Send email notification confirming password change
    // TODO: Log password reset event to monitoring service for fraud detection
    
    res.json({ success: true, message: "Password has been successfully reset" });
  } catch (error) {
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
    logger.info(`Check email success: exists=true, activated=${activated} (${email})`);
    res.json({ exists: true, activated });
  } catch (error) {
    logger.error(`Check email error for ${email}: ${error.message}`);
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
      [tokenHash]
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
};
