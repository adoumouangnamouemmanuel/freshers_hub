const { pool } = require("../services/db");
const { loadUserBundle, issueTokens, hashToken, generateOTP, generatePasswordResetToken } = require("../services/authService");
const AppError = require("../utils/AppError");
const asyncHandler = require("../utils/asyncHandler");
const logger = require("../utils/logger");

const handleLogin = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  logger.info(`Login attempt for email: ${email}`);

  const client = await pool.connect();
  try {
    const user = await loadUserBundle(client, String(email).trim());

    if (!user) {
      logger.warn(`Login failed: User not found (${email})`);
      throw new AppError("User not found", 404);
    }

    if (!user.is_activated || !user.password_hash) {
      logger.warn(`Login failed: Account not activated (${email})`);
      const err = new AppError("Account not activated", 409);
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
      logger.warn(`Login failed: Invalid credentials (${email})`);
      throw new AppError("Invalid credentials", 401);
    }

    const tokens = await issueTokens(client, user);
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

const handleActivate = asyncHandler(async (req, res) => {
  const { email, otp, password } = req.body;
  logger.info(`Activation attempt for email: ${email}`);

  const client = await pool.connect();
  try {
    const { rows } = await client.query(
      `
        SELECT
          u.id, u.email, ac.otp_hash, ac.expires_at, ac.consumed_at, c.is_activated
        FROM users u
        JOIN activation_codes ac ON ac.user_id = u.id
        LEFT JOIN credentials c ON c.user_id = u.id
        WHERE lower(u.email) = lower($1)
      `,
      [String(email).trim()]
    );

    const record = rows[0];
    if (!record) {
      logger.warn(`Activation failed: Record not found (${email})`);
      throw new AppError("Activation record not found", 404);
    }
    if (record.consumed_at) {
      logger.warn(`Activation failed: OTP already used (${email})`);
      throw new AppError("OTP already used", 409);
    }
    if (new Date(record.expires_at).getTime() < Date.now()) {
      logger.warn(`Activation failed: OTP expired (${email})`);
      throw new AppError("OTP expired", 410);
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
      logger.warn(`Activation failed: Invalid OTP (${email})`);
      throw new AppError("Invalid OTP", 401);
    }

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
      [record.id, String(password)]
    );

    await client.query(
      `
        UPDATE activation_codes
        SET consumed_at = now()
        WHERE user_id = $1
      `,
      [record.id]
    );

    const user = await loadUserBundle(client, String(email).trim());
    const tokens = await issueTokens(client, user);

    logger.info(`Activation successful for email: ${email}`);
    res.json({
      activated: true,
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
    logger.error(`Activation error for ${email}: ${error.message}`);
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
    const tokenHash = hashToken(String(refreshToken).trim());
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

    const user = await loadUserBundle(client, record.email);
    const tokens = await issueTokens(client, user);

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
    const user = await loadUserBundle(client, String(email).trim());
    
    if (!user) {
      logger.warn(`OTP request failed: User not found (${email})`);
      throw new AppError("User not found", 404);
    }

    await generateOTP(client, user);
    logger.info(`OTP successfully generated for email: ${email}`);
    
    res.json({ success: true, message: "OTP sent to email (mocked to terminal)" });
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
    const user = await loadUserBundle(client, String(email).trim());
    
    if (!user) {
      logger.warn(`Forgot password request failed: User not found (${email})`);
      throw new AppError("User not found", 404);
    }

    await generatePasswordResetToken(client, user);
    logger.info(`Password reset token successfully generated for email: ${email}`);
    
    res.json({ success: true, message: "Password reset link sent to email (mocked to terminal)" });
  } catch (error) {
    logger.error(`Forgot password error for ${email}: ${error.message}`);
    throw error;
  } finally {
    client.release();
  }
});

const handleResetPassword = asyncHandler(async (req, res) => {
  const { email, token, newPassword } = req.body;
  logger.info(`Reset password attempt for email: ${email}`);

  const client = await pool.connect();
  try {
    const user = await loadUserBundle(client, String(email).trim());
    if (!user) {
      throw new AppError("User not found", 404);
    }

    const tokenHash = hashToken(String(token).trim());
    
    const { rows } = await client.query(
      `
        SELECT * FROM password_resets
        WHERE user_id = $1 AND token_hash = $2
      `,
      [user.id, tokenHash]
    );

    const record = rows[0];
    if (!record) {
      logger.warn(`Reset password failed: Invalid token (${email})`);
      throw new AppError("Invalid or expired token", 400);
    }
    if (record.consumed_at) {
      logger.warn(`Reset password failed: Token already consumed (${email})`);
      throw new AppError("Token already used", 409);
    }
    if (new Date(record.expires_at).getTime() < Date.now()) {
      logger.warn(`Reset password failed: Token expired (${email})`);
      throw new AppError("Token expired", 410);
    }

    await client.query(
      `
        UPDATE credentials
        SET password_hash = crypt($2, gen_salt('bf')),
            updated_at = now()
        WHERE user_id = $1
      `,
      [user.id, String(newPassword)]
    );

    await client.query(
      `
        UPDATE password_resets
        SET consumed_at = now()
        WHERE user_id = $1 AND token_hash = $2
      `,
      [user.id, tokenHash]
    );

    logger.info(`Password successfully reset for email: ${email}`);
    res.json({ success: true, message: "Password has been successfully reset" });
  } catch (error) {
    logger.error(`Reset password error for ${email}: ${error.message}`);
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
    const tokenHash = hashToken(String(refreshToken).trim());
    
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
  handleActivate,
  handleRefresh,
  handleRequestOtp,
  handleForgotPassword,
  handleResetPassword,
  handleLogout,
};
