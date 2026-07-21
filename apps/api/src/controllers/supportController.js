const AppError = require("../utils/AppError");
const asyncHandler = require("../utils/asyncHandler");
const { pool } = require("../services/db");

// Get all sessions (filtered automatically by RLS)
const getSessions = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 20;
  const offset = (page - 1) * limit;

  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await client.query("SELECT set_config('app.current_user_id', $1, true)", [req.user.id]);

    let queryStr = `
      SELECT 
        COUNT(*) OVER() AS total_count,
        s.id, s.unit_id, s.academic_year_id, s.student_id, s.provider_id, 
        s.with_type as type, s.scheduled_at as date, s.location, s.description, s.status, s.is_mandatory, s.title,
        EXISTS (SELECT 1 FROM session_reports sr WHERE sr.session_id = s.id) AS has_report,
        u1.full_name AS student_name, u1.avatar_url AS student_avatar,
        u2.full_name AS provider_name, u2.avatar_url AS provider_avatar
      FROM sessions s
      JOIN users u1 ON s.student_id = u1.id
      JOIN users u2 ON s.provider_id = u2.id
    `;
    const params = [];

    // For coach_admin, show all sessions in the coaching unit
    if (req.user.roles && req.user.roles.includes('coach_admin')) {
      // Get the coaching unit id
      const { rows: unitRows } = await client.query(
        "SELECT id FROM units WHERE name = 'coaching' LIMIT 1"
      );
      if (unitRows.length > 0) {
        params.push(unitRows[0].id);
        queryStr += ` WHERE s.unit_id = $${params.length}`;
      }
    } else {
      params.push(req.user.id);
      queryStr += ` WHERE s.student_id = $${params.length} OR s.provider_id = $${params.length}`;
    }

    queryStr += ` ORDER BY s.scheduled_at DESC`;
    
    params.push(limit);
    queryStr += ` LIMIT $${params.length}`;
    params.push(offset);
    queryStr += ` OFFSET $${params.length}`;

    const { rows } = await client.query(queryStr, params);

    await client.query("COMMIT");
    
    const total = rows.length > 0 ? parseInt(rows[0].total_count, 10) : 0;
    res.json({
      data: rows,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    });
  } finally {
    client.release();
  }
});

// Get sessions for the current coach (their own sessions)
const getMySessions = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 20;
  const offset = (page - 1) * limit;

  const client = await pool.connect();
  try {
    const { rows } = await client.query(`
      SELECT 
        COUNT(*) OVER() AS total_count,
        s.id, s.unit_id, s.academic_year_id, s.student_id, s.provider_id, 
        s.with_type as type, s.scheduled_at as date, s.location, s.description, s.status, s.is_mandatory, s.title,
        EXISTS (SELECT 1 FROM session_reports sr WHERE sr.session_id = s.id) AS has_report,
        u1.full_name AS student_name, u1.avatar_url AS student_avatar,
        u2.full_name AS provider_name, u2.avatar_url AS provider_avatar
      FROM sessions s
      JOIN users u1 ON s.student_id = u1.id
      JOIN users u2 ON s.provider_id = u2.id
      WHERE s.provider_id = $1 OR s.student_id = $1
      ORDER BY s.scheduled_at DESC
      LIMIT $2 OFFSET $3
    `, [req.user.id, limit, offset]);

    const total = rows.length > 0 ? parseInt(rows[0].total_count, 10) : 0;
    res.json({
      data: rows,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    });
  } finally {
    client.release();
  }
});

// Book a new session
const bookSession = asyncHandler(async (req, res) => {
  const { unitId, academicYearId, studentId, providerId, withType, scheduledAt, location, description, isMandatory, title } = req.body;

  // Let students request sessions (so providerId may be null initially) or 
  // Let providers create sessions (so studentId may be null initially)
  const finalStudentId = studentId || req.user.id;
  const finalProviderId = providerId || req.user.id;

  if (!unitId || !academicYearId || !finalProviderId || !finalStudentId || !scheduledAt) {
    throw new AppError("Missing required fields", 400);
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await client.query("SELECT set_config('app.current_user_id', $1, true)", [req.user.id]);

    let finalTitle = title;
    if (!finalTitle) {
      const { rows: userRows } = await client.query("SELECT full_name FROM users WHERE id = $1", [req.user.id]);
      const userName = userRows[0]?.full_name || "User";
      finalTitle = `${userName}'s session`;
    }

    const { rows } = await client.query(`
      INSERT INTO sessions 
        (title, unit_id, academic_year_id, student_id, provider_id, with_type, scheduled_at, location, description, is_mandatory, status)
      VALUES 
        ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'scheduled')
      RETURNING *
    `, [finalTitle, unitId, academicYearId, finalStudentId, finalProviderId, withType, scheduledAt, location, description, isMandatory || false]);

    await client.query("COMMIT");
    res.status(201).json(rows[0]);
  } finally {
    client.release();
  }
});

// Update session status (e.g. mark complete or cancel)
const updateSessionStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  if (!status) {
    throw new AppError("Missing status", 400);
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await client.query("SELECT set_config('app.current_user_id', $1, true)", [req.user.id]);

    const { rows } = await client.query(`
      UPDATE sessions
      SET status = $1, updated_at = now()
      WHERE id = $2 AND (student_id = $3 OR provider_id = $3)
      RETURNING *
    `, [status, id, req.user.id]);

    if (rows.length === 0) {
      await client.query("ROLLBACK");
      throw new AppError("Session not found or permission denied", 404);
    }

    await client.query("COMMIT");
    res.json(rows[0]);
  } finally {
    client.release();
  }
});

// Update session details (location, description, scheduledAt)
const updateSession = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { location, description, scheduledAt, title } = req.body;

  const client = await pool.connect();
  try {
    const { rows } = await client.query(`
      UPDATE sessions
      SET location = COALESCE($1, location),
          description = COALESCE($2, description),
          scheduled_at = COALESCE($3, scheduled_at),
          title = COALESCE($4, title),
          updated_at = now()
      WHERE id = $5 AND (student_id = $6 OR provider_id = $6)
      RETURNING *
    `, [location, description, scheduledAt, title, id, req.user.id]);

    if (rows.length === 0) {
      throw new AppError("Session not found", 404);
    }
    res.json(rows[0]);
  } finally {
    client.release();
  }
});

// Delete session
const deleteSession = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const client = await pool.connect();
  try {
    const { rowCount } = await client.query(`
      DELETE FROM sessions WHERE id = $1 AND (student_id = $2 OR provider_id = $2)
    `, [id, req.user.id]);

    if (rowCount === 0) {
      throw new AppError("Session not found", 404);
    }

    res.json({ success: true, message: "Session deleted" });
  } finally {
    client.release();
  }
});

// Get assigned coaches for a fresher
const getCoachAssignments = asyncHandler(async (req, res) => {
  const client = await pool.connect();
  try {
    const { rows } = await client.query(`
      SELECT ca.id, ca.peer_coach_id, u.full_name AS coach_name, u.avatar_url, u.email, u.phone
      FROM coach_assignments ca
      JOIN users u ON ca.peer_coach_id = u.id
      WHERE ca.fresher_id = $1
    `, [req.user.id]);

    res.json(rows);
  } finally {
    client.release();
  }
});

// Get freshers assigned to this peer coach
const getAssignedFreshers = asyncHandler(async (req, res) => {
  const client = await pool.connect();
  try {
    const { rows } = await client.query(`
      SELECT ca.id, ca.fresher_id, u.full_name AS fresher_name, u.avatar_url, u.email, u.phone
      FROM coach_assignments ca
      JOIN users u ON ca.fresher_id = u.id
      WHERE ca.peer_coach_id = $1
    `, [req.user.id]);

    res.json(rows);
  } finally {
    client.release();
  }
});

// Get assigned buddy
const getBuddyPairing = asyncHandler(async (req, res) => {
  const client = await pool.connect();
  try {
    const { rows } = await client.query(`
      SELECT bp.id, bp.buddy_id, u.full_name AS buddy_name, u.email, u.phone, u.country, u.avatar_url
      FROM buddy_pairings bp
      JOIN users u ON bp.buddy_id = u.id
      WHERE bp.fresher_id = $1
    `, [req.user.id]);

    res.json(rows[0] || null);
  } finally {
    client.release();
  }
});

// Log WhatsApp outreach
const logContactClick = asyncHandler(async (req, res) => {
  const { targetId, unitId, context } = req.body;
  if (!targetId) {
    throw new AppError("Missing targetId", 400);
  }

  const client = await pool.connect();
  try {
    await client.query(`
      INSERT INTO contact_clicks (initiator_id, target_id, unit_id, context)
      VALUES ($1, $2, $3, $4)
    `, [req.user.id, targetId, unitId || null, context || null]);

    res.status(201).json({ success: true });
  } finally {
    client.release();
  }
});

// Get staff members for a specific unit (e.g., counselling, advising)
const getStaffByUnit = asyncHandler(async (req, res) => {
  const { unitName } = req.params;
  const client = await pool.connect();
  try {
    const { rows } = await client.query(`
      SELECT DISTINCT u.id, u.full_name as name, u.email, u.phone, u.avatar_url
      FROM users u
      JOIN user_roles ur ON u.id = ur.user_id
      JOIN units un ON ur.unit_id = un.id
      WHERE un.name = $1 AND u.is_active = true
    `, [unitName]);
    res.json(rows);
  } finally {
    client.release();
  }
});

// Submit a session report
const submitSessionReport = asyncHandler(async (req, res) => {
  const { id } = req.params; // session_id
  const { content } = req.body;

  if (!content) {
    throw new AppError("Missing report content", 400);
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    
    // Verify session belongs to the user and they are the provider
    const { rows: sessionRows } = await client.query(
      "SELECT id FROM sessions WHERE id = $1 AND provider_id = $2",
      [id, req.user.id]
    );

    if (sessionRows.length === 0) {
      await client.query("ROLLBACK");
      throw new AppError("Permission denied or session not found", 403);
    }

    const { rows } = await client.query(`
      INSERT INTO session_reports (session_id, provider_id, content)
      VALUES ($1, $2, $3)
      ON CONFLICT (session_id) DO UPDATE SET content = EXCLUDED.content, submitted_at = now()
      RETURNING *
    `, [id, req.user.id, content]);

    await client.query("COMMIT");
    res.status(201).json(rows[0]);
  } finally {
    client.release();
  }
});

module.exports = {
  getSessions,
  getMySessions,
  bookSession,
  updateSessionStatus,
  updateSession,
  deleteSession,
  getCoachAssignments,
  getAssignedFreshers,
  getBuddyPairing,
  logContactClick,
  getStaffByUnit,
  submitSessionReport,
};
