const fs = require("fs");
const http = require("http");
const path = require("path");
const crypto = require("crypto");

const { Pool } = require("pg");

function loadEnv(filePath) {
  if (!fs.existsSync(filePath)) {
    return;
  }

  const lines = fs.readFileSync(filePath, "utf8").split(/\r?\n/);

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) {
      continue;
    }

    const equalsIndex = trimmed.indexOf("=");
    if (equalsIndex === -1) {
      continue;
    }

    const key = trimmed.slice(0, equalsIndex).trim();
    let value = trimmed.slice(equalsIndex + 1).trim();

    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    if (!process.env[key]) {
      process.env[key] = value;
    }
  }
}

loadEnv(path.resolve(__dirname, "../../.env"));

const databaseUrl =
  process.env.DATABASE_URL ||
  "postgres://postgres:postgres@localhost:5432/fresher_hub";
const jwtSecret = process.env.JWT_SECRET || "dev-secret-change-me";
const port = Number(process.env.PORT || 4000);
const pool = new Pool({ connectionString: databaseUrl });

function sendJson(res, statusCode, payload) {
  res.writeHead(statusCode, {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
  });
  res.end(JSON.stringify(payload));
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let body = "";
    req.on("data", (chunk) => {
      body += chunk;
    });
    req.on("end", () => {
      if (!body) {
        resolve({});
        return;
      }

      try {
        resolve(JSON.parse(body));
      } catch (error) {
        reject(new Error("Invalid JSON body"));
      }
    });
    req.on("error", reject);
  });
}

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
        u.id,
        u.email,
        u.full_name,
        u.phone,
        u.class_year,
        u.country,
        u.major,
        u.avatar_url,
        c.password_hash,
        c.is_activated,
        c.activated_at,
        sp.school_id,
        sp.identifier,
        sp.graduation_year
      FROM users u
      LEFT JOIN credentials c ON c.user_id = u.id
      LEFT JOIN student_profiles sp ON sp.user_id = u.id
      WHERE lower(u.email) = lower($1)
    `,
    [email],
  );

  const user = userResult.rows[0];

  if (!user) {
    return null;
  }

  const rolesResult = await client.query(
    `
      SELECT r.name, un.name AS unit_name
      FROM user_roles ur
      JOIN roles r ON r.id = ur.role_id
      LEFT JOIN units un ON un.id = ur.unit_id
      WHERE ur.user_id = $1
      ORDER BY r.name
    `,
    [user.id],
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
    [user.id, refreshTokenHash],
  );

  return { accessToken, refreshToken };
}

async function handleLogin(req, res) {
  const body = await readBody(req);
  const email = String(body.email || "").trim();
  const password = String(body.password || "");

  if (!email || !password) {
    sendJson(res, 400, { error: "email and password are required" });
    return;
  }

  const client = await pool.connect();

  try {
    const user = await loadUserBundle(client, email);

    if (!user) {
      sendJson(res, 404, { error: "User not found" });
      return;
    }

    if (!user.is_activated || !user.password_hash) {
      sendJson(res, 409, {
        error: "Account not activated",
        needsActivation: true,
        email: user.email,
      });
      return;
    }

    const verification = await client.query(
      `
        SELECT password_hash = crypt($2, password_hash) AS matches
        FROM credentials
        WHERE user_id = $1
      `,
      [user.id, password],
    );

    if (!verification.rows[0]?.matches) {
      sendJson(res, 401, { error: "Invalid credentials" });
      return;
    }

    const tokens = await issueTokens(client, user);
    sendJson(res, 200, {
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
}

async function handleActivate(req, res) {
  const body = await readBody(req);
  const email = String(body.email || "").trim();
  const otp = String(body.otp || "").trim();
  const password = String(body.password || "");

  if (!email || !otp || !password) {
    sendJson(res, 400, {
      error: "email, otp, and password are required",
    });
    return;
  }

  const client = await pool.connect();

  try {
    const { rows } = await client.query(
      `
        SELECT
          u.id,
          u.email,
          ac.otp_hash,
          ac.expires_at,
          ac.consumed_at,
          c.is_activated
        FROM users u
        JOIN activation_codes ac ON ac.user_id = u.id
        LEFT JOIN credentials c ON c.user_id = u.id
        WHERE lower(u.email) = lower($1)
      `,
      [email],
    );

    const record = rows[0];

    if (!record) {
      sendJson(res, 404, { error: "Activation record not found" });
      return;
    }

    if (record.consumed_at) {
      sendJson(res, 409, { error: "OTP already used" });
      return;
    }

    if (new Date(record.expires_at).getTime() < Date.now()) {
      sendJson(res, 410, { error: "OTP expired" });
      return;
    }

    const otpCheck = await client.query(
      `
        SELECT crypt($2, otp_hash) = otp_hash AS matches
        FROM activation_codes
        WHERE user_id = $1
      `,
      [record.id, otp],
    );

    if (!otpCheck.rows[0]?.matches) {
      sendJson(res, 401, { error: "Invalid OTP" });
      return;
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
      [record.id, password],
    );

    await client.query(
      `
        UPDATE activation_codes
        SET consumed_at = now()
        WHERE user_id = $1
      `,
      [record.id],
    );

    const user = await loadUserBundle(client, email);
    const tokens = await issueTokens(client, user);

    sendJson(res, 200, {
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
}

async function handleRefresh(req, res) {
  const body = await readBody(req);
  const refreshToken = String(body.refreshToken || "").trim();

  if (!refreshToken) {
    sendJson(res, 400, { error: "refreshToken is required" });
    return;
  }

  const client = await pool.connect();

  try {
    const tokenHash = hashToken(refreshToken);
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
      sendJson(res, 401, { error: "Invalid refresh token" });
      return;
    }

    await client.query(
      `
        UPDATE refresh_tokens
        SET revoked_at = now()
        WHERE id = $1
      `,
      [record.id],
    );

    const user = await loadUserBundle(client, record.email);
    const tokens = await issueTokens(client, user);

    sendJson(res, 200, {
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
}

async function handleFaqSearch(req, res) {
  const url = new URL(req.url || "/", `http://localhost:${port}`);
  const query = url.searchParams.get("q") || "";

  if (!query) {
    sendJson(res, 200, { results: [] });
    return;
  }

  const client = await pool.connect();
  try {
    const { rows } = await client.query(
      `SELECT id, category, question, answer FROM faq_items WHERE question ILIKE $1 OR answer ILIKE $1 LIMIT 20`,
      [`%${query}%`]
    );
    sendJson(res, 200, { results: rows });
  } catch (err) {
    console.log("FAQ DB error (falling back to mock data):", err.message);
    
    const mockFaqs = [
      { id: '1', category: 'Housing', question: 'How do I apply for a hostel?', answer: 'Hostel applications open in July via the SIS portal. Ensure you have paid your housing deposit.' },
      { id: '2', category: 'Housing', question: 'Can I choose my hostel roommate?', answer: 'First-year students are randomly assigned to encourage mingling. You can request specific roommates from sophomore year.' },
      { id: '3', category: 'Health', question: 'Where is the health center?', answer: 'The Natembea Health Center is located behind the student hostels. It is open 24/7 for emergencies.' },
      { id: '4', category: 'Academics', question: 'How do I drop a course?', answer: 'Use the SIS portal before the add/drop deadline in week 2 of the semester.' },
      { id: '5', category: 'Finance', question: 'When is tuition due?', answer: 'Tuition must be paid in full or a payment plan agreed upon before the start of the semester.' }
    ];
    
    const qLower = query.toLowerCase();
    const results = mockFaqs.filter(f => 
      f.question.toLowerCase().includes(qLower) || 
      f.answer.toLowerCase().includes(qLower)
    );
    
    sendJson(res, 200, { results });
  } finally {
    client.release();
  }
}

const server = http.createServer(async (req, res) => {
  const route = (req.url || "/").split("?")[0];

  if (req.method === "OPTIONS") {
    sendJson(res, 204, {});
    return;
  }

  if (req.method === "GET" && route === "/health") {
    sendJson(res, 200, { ok: true, service: "fresher-hub-api" });
    return;
  }

  if (req.method === "POST" && route === "/auth/login") {
    await handleLogin(req, res);
    return;
  }

  if (req.method === "POST" && route === "/auth/activate") {
    await handleActivate(req, res);
    return;
  }

  if (req.method === "POST" && route === "/auth/refresh") {
    await handleRefresh(req, res);
    return;
  }

  if (req.method === "GET" && route === "/faqs/search") {
    await handleFaqSearch(req, res);
    return;
  }

  sendJson(res, 404, {
    error: "Not found",
    routes: [
      "GET /health",
      "POST /auth/login",
      "POST /auth/activate",
      "POST /auth/refresh",
      "GET /faqs/search",
    ],
  });
});

server.listen(port, () => {
  console.log(`Fresher Hub API listening on http://localhost:${port}`);
});
