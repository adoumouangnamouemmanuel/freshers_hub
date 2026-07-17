const { pool } = require("../services/db");
const { loadUserBundle, issueTokens, hashToken } = require("../services/authService");
const AppError = require("../utils/AppError");
const asyncHandler = require("../utils/asyncHandler");

const handleLogin = asyncHandler(async (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) {
    throw new AppError("email and password are required", 400);
  }

  const client = await pool.connect();
  try {
    const user = await loadUserBundle(client, String(email).trim());

    if (!user) {
      throw new AppError("User not found", 404);
    }

    if (!user.is_activated || !user.password_hash) {
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
      throw new AppError("Invalid credentials", 401);
    }

    const tokens = await issueTokens(client, user);
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
  } finally {
    client.release();
  }
});

const handleActivate = asyncHandler(async (req, res) => {
  const { email, otp, password } = req.body || {};
  
  if (!email || !otp || !password) {
    throw new AppError("email, otp, and password are required", 400);
  }

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
      throw new AppError("Activation record not found", 404);
    }
    if (record.consumed_at) {
      throw new AppError("OTP already used", 409);
    }
    if (new Date(record.expires_at).getTime() < Date.now()) {
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
  } finally {
    client.release();
  }
});

const handleRefresh = asyncHandler(async (req, res) => {
  const { refreshToken } = req.body || {};
  if (!refreshToken) {
    throw new AppError("refreshToken is required", 400);
  }

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
  } finally {
    client.release();
  }
});

module.exports = {
  handleLogin,
  handleActivate,
  handleRefresh,
};
