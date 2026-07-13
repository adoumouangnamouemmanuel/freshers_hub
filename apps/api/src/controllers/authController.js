const { pool } = require("../services/db");
const { loadUserBundle, issueTokens, hashToken } = require("../services/authService");

async function handleLogin(req, res) {
  const { email, password } = req.body || {};
  if (!email || !password) {
    return res.status(400).json({ error: "email and password are required" });
  }

  const client = await pool.connect();
  try {
    const user = await loadUserBundle(client, String(email).trim());

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    if (!user.is_activated || !user.password_hash) {
      return res.status(409).json({
        error: "Account not activated",
        needsActivation: true,
        email: user.email,
      });
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
      return res.status(401).json({ error: "Invalid credentials" });
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
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  } finally {
    client.release();
  }
}

async function handleActivate(req, res) {
  const { email, otp, password } = req.body || {};
  
  if (!email || !otp || !password) {
    return res.status(400).json({ error: "email, otp, and password are required" });
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
      return res.status(404).json({ error: "Activation record not found" });
    }
    if (record.consumed_at) {
      return res.status(409).json({ error: "OTP already used" });
    }
    if (new Date(record.expires_at).getTime() < Date.now()) {
      return res.status(410).json({ error: "OTP expired" });
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
      return res.status(401).json({ error: "Invalid OTP" });
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
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  } finally {
    client.release();
  }
}

async function handleRefresh(req, res) {
  const { refreshToken } = req.body || {};
  if (!refreshToken) {
    return res.status(400).json({ error: "refreshToken is required" });
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
      return res.status(401).json({ error: "Invalid refresh token" });
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
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  } finally {
    client.release();
  }
}

module.exports = {
  handleLogin,
  handleActivate,
  handleRefresh,
};
