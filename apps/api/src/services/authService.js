const logger = require('../utils/logger');
const crypto = require("crypto");

const jwtSecret = process.env.JWT_SECRET || "dev-secret-change-me";

function base64Url(input) {
  return Buffer.from(JSON.stringify(input)).toString("base64url");
}

function signJwt(payload) {
  const header = { alg: "HS256", typ: "JWT" };
  const encodedHeader = base64Url(header);
  const encodedPayload = base64Url(payload);
  const content = `${encodedHeader}.${encodedPayload}`;
  const signature = crypto
    .createHmac("sha256", jwtSecret)
    .update(content)
    .digest("base64url");

  return `${content}.${signature}`;
}

function verifyJwt(token) {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;

    const [encodedHeader, encodedPayload, signature] = parts;
    const content = `${encodedHeader}.${encodedPayload}`;
    const expectedSignature = crypto
      .createHmac("sha256", jwtSecret)
      .update(content)
      .digest("base64url");

    if (signature !== expectedSignature) return null;

    const payload = JSON.parse(
      Buffer.from(encodedPayload, "base64url").toString("utf8")
    );
    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) return null;

    return payload;
  } catch (err) {
    return null;
  }
}

function createRefreshToken() {
  return crypto.randomBytes(32).toString("hex");
}

function hashToken(token) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

async function loadUserBundle(client, email) {
  const userResult = await client.query(
    `
      SELECT
        u.id, u.email, u.full_name, u.phone, u.class_year, u.country, u.major, u.avatar_url,
        c.password_hash, c.is_activated, c.activated_at,
        sp.school_id, sp.identifier, sp.graduation_year
      FROM users u
      LEFT JOIN credentials c ON c.user_id = u.id
      LEFT JOIN student_profiles sp ON sp.user_id = u.id
      WHERE lower(u.email) = lower($1)
    `,
    [email]
  );

  const user = userResult.rows[0];
  if (!user) return null;

  const rolesResult = await client.query(
    `
      SELECT r.name, un.name AS unit_name
      FROM user_roles ur
      JOIN roles r ON r.id = ur.role_id
      LEFT JOIN units un ON un.id = ur.unit_id
      WHERE ur.user_id = $1
      ORDER BY r.name
    `,
    [user.id]
  );

  return {
    ...user,
    roles: rolesResult.rows,
    student_profile: user.school_id
      ? {
          schoolId: user.school_id,
          identifier: user.identifier,
          graduationYear: user.graduation_year,
        }
      : null,
  };
}

async function issueTokens(client, user) {
  const roles = Array.isArray(user.roles) ? user.roles : [];
  const accessToken = signJwt({
    sub: user.id,
    email: user.email,
    roles: roles.map((role) => role.name),
    typ: "access",
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 15 * 60,
  });

  const refreshToken = createRefreshToken();
  const refreshTokenHash = hashToken(refreshToken);

  await client.query(
    `
      INSERT INTO refresh_tokens (user_id, token_hash, expires_at)
      VALUES ($1, $2, now() + interval '30 days')
    `,
    [user.id, refreshTokenHash]
  );

  return { accessToken, refreshToken };
}

module.exports = {
  signJwt,
  verifyJwt,
  createRefreshToken,
  hashToken,
  loadUserBundle,
  issueTokens,
};
