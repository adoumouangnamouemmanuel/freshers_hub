const AppError = require("../utils/AppError");
const asyncHandler = require("../utils/asyncHandler");
const { pool } = require("../services/db");

/**
 * counselling Controller
 * 
 * Handles all counselling-specific admin endpoints for the 2 academic counsellors.
 * Unlike coaching (which has peer_coach management, compliance, assignments),
 * counselling is simpler: counsellors see their own sessions, reports, and can book
 * sessions with any student.
 */

// Get the counselling unit ID (cached after first call)
let _counsellingUnitId = null;
const getCounsellingUnitId = async (client) => {
  if (_counsellingUnitId) return _counsellingUnitId;
  const { rows } = await client.query("SELECT id FROM units WHERE name = 'counselling' LIMIT 1");
  if (rows.length === 0) throw new AppError("counselling unit not found", 500);
  _counsellingUnitId = rows[0].id;
  return _counsellingUnitId;
};

// ─── Dashboard Stats ────────────────────────────────────────────────────────
const getCounsellingDashboard = asyncHandler(async (req, res) => {
  const client = await pool.connect();
  try {
    const unitId = await getCounsellingUnitId(client);
    const counsellorId = req.user.id;

    // Get stats in a single query batch
    const statsQuery = `
      SELECT
        (SELECT COUNT(*) FROM sessions WHERE unit_id = $1 AND (provider_id = $2 OR student_id = $2) AND status = 'scheduled' AND scheduled_at > NOW()) AS upcoming_sessions,
        (SELECT COUNT(*) FROM sessions WHERE unit_id = $1 AND (provider_id = $2 OR student_id = $2) AND status = 'scheduled' AND scheduled_at <= NOW()) AS overdue_sessions,
        (SELECT COUNT(*) FROM sessions WHERE unit_id = $1 AND (provider_id = $2 OR student_id = $2) AND status = 'completed') AS completed_sessions,
        (SELECT COUNT(*) FROM users u JOIN user_roles ur ON u.id = ur.user_id JOIN roles r ON ur.role_id = r.id WHERE r.name = 'student' AND u.is_active = true) AS total_students_seen,
        (SELECT COUNT(*) FROM sessions WHERE unit_id = $1 AND (provider_id = $2 OR student_id = $2) 
          AND scheduled_at >= date_trunc('week', NOW()) 
          AND scheduled_at < date_trunc('week', NOW()) + interval '7 days') AS this_week_sessions,
        (SELECT COUNT(*) FROM sessions WHERE unit_id = $1 AND (provider_id = $2 OR student_id = $2) 
          AND scheduled_at::date = CURRENT_DATE AND status = 'scheduled') AS today_sessions
    `;
    const { rows: [stats] } = await client.query(statsQuery, [unitId, counsellorId]);

    // Get upcoming sessions (next 5)
    const { rows: upcomingSessions } = await client.query(`
      SELECT 
        s.id, s.scheduled_at AS date, s.location, s.status, s.description,
        u.full_name AS student_name, u.avatar_url AS student_avatar, u.email AS student_email
      FROM sessions s
      JOIN users u ON s.student_id = u.id
      WHERE s.unit_id = $1 AND (s.provider_id = $2 OR s.student_id = $2) AND s.status = 'scheduled' AND s.scheduled_at > NOW()
      ORDER BY s.scheduled_at ASC
      LIMIT 5
    `, [unitId, counsellorId]);

    // Get recent sessions (last 5 completed)
    const { rows: recentSessions } = await client.query(`
      SELECT 
        s.id, s.scheduled_at AS date, s.location, s.status, s.description,
        u.full_name AS student_name, u.avatar_url AS student_avatar,
        EXISTS (SELECT 1 FROM session_reports sr WHERE sr.session_id = s.id) AS has_report
      FROM sessions s
      JOIN users u ON s.student_id = u.id
      WHERE s.unit_id = $1 AND (s.provider_id = $2 OR s.student_id = $2) AND s.status = 'completed'
      ORDER BY s.scheduled_at DESC
      LIMIT 5
    `, [unitId, counsellorId]);

    res.json({
      stats: {
        upcoming_sessions: parseInt(stats.upcoming_sessions),
        overdue_sessions: parseInt(stats.overdue_sessions),
        completed_sessions: parseInt(stats.completed_sessions),
        total_students_seen: parseInt(stats.total_students_seen),
        this_week_sessions: parseInt(stats.this_week_sessions),
        today_sessions: parseInt(stats.today_sessions),
      },
      upcomingSessions,
      recentSessions,
    });
  } finally {
    client.release();
  }
});

// ─── All counselling Sessions ──────────────────────────────────────────────────
const getCounsellingSessions = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 20;
  const offset = (page - 1) * limit;

  const client = await pool.connect();
  try {
    const unitId = await getCounsellingUnitId(client);

    const { rows } = await client.query(`
      SELECT 
        COUNT(*) OVER() AS total_count,
        s.id, s.unit_id, s.academic_year_id, s.student_id, s.provider_id,
        s.with_type AS type, s.scheduled_at AS date, s.location, s.description, 
        s.status, s.is_mandatory,
        EXISTS (SELECT 1 FROM session_reports sr WHERE sr.session_id = s.id) AS has_report,
        u1.full_name AS student_name, u1.avatar_url AS student_avatar,
        u2.full_name AS provider_name, u2.avatar_url AS provider_avatar
      FROM sessions s
      JOIN users u1 ON s.student_id = u1.id
      JOIN users u2 ON s.provider_id = u2.id
      WHERE s.unit_id = $1 AND (s.provider_id = $2 OR s.student_id = $2)
      ORDER BY s.scheduled_at DESC
      LIMIT $3 OFFSET $4
    `, [unitId, req.user.id, limit, offset]);

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

// ─── All Students (for booking) ─────────────────────────────────────────────
const getCounsellingStudents = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 20;
  const offset = (page - 1) * limit;

  const client = await pool.connect();
  try {
    const { rows } = await client.query(`
      SELECT 
        COUNT(*) OVER() AS total_count,
        u.id, u.full_name AS name, u.email, u.phone, u.avatar_url, u.class_year, u.major,
        'student' AS type
      FROM users u
      JOIN user_roles ur ON u.id = ur.user_id
      JOIN roles r ON ur.role_id = r.id
      WHERE r.name = 'student' AND u.is_active = true
      GROUP BY u.id, u.full_name, u.email, u.phone, u.avatar_url, u.class_year, u.major
      ORDER BY u.full_name ASC
      LIMIT $1 OFFSET $2
    `, [limit, offset]);

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

// ─── Reports for counselling Sessions ──────────────────────────────────────────
const getCounsellingReports = asyncHandler(async (req, res) => {
  const client = await pool.connect();
  try {
    const unitId = await getCounsellingUnitId(client);

    const { rows } = await client.query(`
      SELECT 
        sr.id, sr.session_id, sr.content, sr.submitted_at,
        sr.needs_follow_up,
        u1.full_name AS student_name, u1.avatar_url AS student_avatar,
        u2.full_name AS provider_name,
        s.scheduled_at AS session_date, s.location AS session_location
      FROM session_reports sr
      JOIN sessions s ON sr.session_id = s.id
      JOIN users u1 ON s.student_id = u1.id
      JOIN users u2 ON s.provider_id = u2.id
      WHERE s.unit_id = $1 AND s.provider_id = $2
      ORDER BY sr.submitted_at DESC
    `, [unitId, req.user.id]);

    res.json(rows);
  } finally {
    client.release();
  }
});

// ─── Book Session as counsellor ────────────────────────────────────────────────
const counsellorBookSession = asyncHandler(async (req, res) => {
  const { academicYearId, studentId, scheduledAt, location, description, title } = req.body;

  if (!studentId || !scheduledAt) {
    throw new AppError("Missing required fields (studentId, scheduledAt)", 400);
  }

  const client = await pool.connect();
  try {
    const unitId = await getCounsellingUnitId(client);
    
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
        ($1, $2, $3, $4, $5, NULL, $6, $7, $8, false, 'scheduled')
      RETURNING *
    `, [finalTitle, unitId, academicYearId || 1, studentId, req.user.id, scheduledAt, location, description]);

    await client.query("COMMIT");
    res.status(201).json(rows[0]);
  } catch (err) {
    await client.query("ROLLBACK").catch(() => {});
    throw err;
  } finally {
    client.release();
  }
});

// ─── Get all Peer Counsellors ───────────────────────────────────────────────
const getPeerCounsellors = asyncHandler(async (req, res) => {
  const client = await pool.connect();
  try {
    const { rows } = await client.query(`
      SELECT 
        u.id, u.full_name AS name, u.email, u.phone, u.avatar_url, u.class_year, u.major,
        'peer_counsellor' AS type
      FROM users u
      JOIN user_roles ur ON u.id = ur.user_id
      JOIN roles r ON ur.role_id = r.id
      WHERE r.name = 'peer_counsellor' AND u.is_active = true
      ORDER BY u.full_name ASC
    `);
    res.json(rows);
  } finally {
    client.release();
  }
});

// ─── Assign Student to Peer Counsellor ───────────────────────────────────────
const assignStudentToPeer = asyncHandler(async (req, res) => {
  const { studentId, peerCounsellorId, academicYearId } = req.body;
  if (!studentId || !peerCounsellorId) {
    throw new AppError("studentId and peerCounsellorId are required", 400);
  }

  const client = await pool.connect();
  try {
    const { rows } = await client.query(`
      INSERT INTO counsellor_assignments (academic_year_id, student_id, peer_counsellor_id, assigned_by)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (academic_year_id, student_id, peer_counsellor_id) DO NOTHING
      RETURNING *
    `, [academicYearId || 1, studentId, peerCounsellorId, req.user.id]);
    
    res.status(201).json({ success: true, assignment: rows[0] });
  } finally {
    client.release();
  }
});

module.exports = {
  getCounsellingDashboard,
  getCounsellingSessions,
  getCounsellingStudents,
  getCounsellingReports,
  counsellorBookSession,
  getPeerCounsellors,
  assignStudentToPeer
};
