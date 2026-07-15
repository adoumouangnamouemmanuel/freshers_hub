const { pool } = require("../services/db");

// Get all sessions (filtered automatically by RLS)
async function getSessions(req, res) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await client.query("SELECT set_config('app.current_user_id', $1, true)", [req.user.id]);

    const { rows } = await client.query(`
      SELECT 
        s.id, s.unit_id, s.academic_year_id, s.student_id, s.provider_id, 
        s.with_type as type, s.scheduled_at as date, s.location, s.description, s.status, s.is_mandatory,
        u1.full_name AS student_name, u1.avatar_url AS student_avatar,
        u2.full_name AS provider_name, u2.avatar_url AS provider_avatar
      FROM sessions s
      JOIN users u1 ON s.student_id = u1.id
      JOIN users u2 ON s.provider_id = u2.id
      ORDER BY s.scheduled_at DESC
    `);

    await client.query("COMMIT");
    res.json(rows);
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("Error getting sessions:", err);
    res.status(500).json({ error: "Internal server error" });
  } finally {
    client.release();
  }
}

// Book a new session
async function bookSession(req, res) {
  const { unitId, academicYearId, providerId, withType, scheduledAt, location, isMandatory, description } = req.body;
  
  if (!unitId || !academicYearId || !providerId || !scheduledAt) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await client.query("SELECT set_config('app.current_user_id', $1, true)", [req.user.id]);

    const { rows } = await client.query(`
      INSERT INTO sessions 
        (unit_id, academic_year_id, student_id, provider_id, with_type, scheduled_at, location, description, is_mandatory, status)
      VALUES 
        ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'scheduled')
      RETURNING *
    `, [unitId, academicYearId, req.user.id, providerId, withType, scheduledAt, location, description, isMandatory || false]);

    await client.query("COMMIT");
    res.status(201).json(rows[0]);
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("Error booking session:", err);
    res.status(500).json({ error: "Internal server error" });
  } finally {
    client.release();
  }
}

// Update session status (e.g. mark complete or cancel)
async function updateSessionStatus(req, res) {
  const { id } = req.params;
  const { status } = req.body;

  if (!status) {
    return res.status(400).json({ error: "Missing status" });
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
      return res.status(404).json({ error: "Session not found or permission denied" });
    }

    await client.query("COMMIT");
    res.json(rows[0]);
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("Error updating session:", err);
    res.status(500).json({ error: "Internal server error" });
  } finally {
    client.release();
  }
}

// Update session details (location, description, scheduledAt)
async function updateSession(req, res) {
  const { id } = req.params;
  const { location, description, scheduledAt } = req.body;

  const client = await pool.connect();
  try {
    const { rows } = await client.query(`
      UPDATE sessions
      SET location = COALESCE($1, location),
          description = COALESCE($2, description),
          scheduled_at = COALESCE($3, scheduled_at),
          updated_at = now()
      WHERE id = $4 AND (student_id = $5 OR provider_id = $5)
      RETURNING *
    `, [location, description, scheduledAt, id, req.user.id]);

    if (rows.length === 0) {
      return res.status(404).json({ error: "Session not found" });
    }
    res.json(rows[0]);
  } catch (err) {
    console.error("Error updating session:", err);
    res.status(500).json({ error: "Internal server error" });
  } finally {
    client.release();
  }
}

// Delete session
async function deleteSession(req, res) {
  const { id } = req.params;
  const client = await pool.connect();
  try {
    const { rowCount } = await client.query(`
      DELETE FROM sessions WHERE id = $1 AND (student_id = $2 OR provider_id = $2)
    `, [id, req.user.id]);

    if (rowCount === 0) {
      return res.status(404).json({ error: "Session not found" });
    }

    res.json({ success: true, message: "Session deleted" });
  } catch (err) {
    console.error("Error deleting session:", err);
    res.status(500).json({ error: "Internal server error" });
  } finally {
    client.release();
  }
}

// Get assigned coaches for a fresher
async function getCoachAssignments(req, res) {
  const client = await pool.connect();
  try {
    const { rows } = await client.query(`
      SELECT ca.id, ca.peer_coach_id, u.full_name AS coach_name, u.avatar_url, u.email, u.phone
      FROM coach_assignments ca
      JOIN users u ON ca.peer_coach_id = u.id
      WHERE ca.fresher_id = $1
    `, [req.user.id]);

    res.json(rows);
  } catch (err) {
    console.error("Error getting coach assignments:", err);
    res.status(500).json({ error: "Internal server error" });
  } finally {
    client.release();
  }
}

// Get freshers assigned to this peer coach
async function getAssignedFreshers(req, res) {
  const client = await pool.connect();
  try {
    const { rows } = await client.query(`
      SELECT ca.id, ca.fresher_id, u.full_name AS fresher_name, u.avatar_url, u.email, u.phone
      FROM coach_assignments ca
      JOIN users u ON ca.fresher_id = u.id
      WHERE ca.peer_coach_id = $1
    `, [req.user.id]);

    res.json(rows);
  } catch (err) {
    console.error("Error getting assigned freshers:", err);
    res.status(500).json({ error: "Internal server error" });
  } finally {
    client.release();
  }
}

// Get assigned buddy
async function getBuddyPairing(req, res) {
  const client = await pool.connect();
  try {
    const { rows } = await client.query(`
      SELECT bp.id, bp.buddy_id, u.full_name AS buddy_name, u.email, u.phone, u.country, u.avatar_url
      FROM buddy_pairings bp
      JOIN users u ON bp.buddy_id = u.id
      WHERE bp.fresher_id = $1
    `, [req.user.id]);

    res.json(rows[0] || null);
  } catch (err) {
    console.error("Error getting buddy:", err);
    res.status(500).json({ error: "Internal server error" });
  } finally {
    client.release();
  }
}

// Log WhatsApp outreach
async function logContactClick(req, res) {
  const { targetId, unitId, context } = req.body;
  if (!targetId) {
    return res.status(400).json({ error: "Missing targetId" });
  }

  const client = await pool.connect();
  try {
    await client.query(`
      INSERT INTO contact_clicks (initiator_id, target_id, unit_id, context)
      VALUES ($1, $2, $3, $4)
    `, [req.user.id, targetId, unitId || null, context || null]);

    res.status(201).json({ success: true });
  } catch (err) {
    console.error("Error logging contact:", err);
    res.status(500).json({ error: "Internal server error" });
  } finally {
    client.release();
  }
}

// Get staff members for a specific unit (e.g., counselling, advising)
async function getStaffByUnit(req, res) {
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
  } catch (err) {
    console.error("Error getting staff by unit:", err);
    res.status(500).json({ error: "Internal server error" });
  } finally {
    client.release();
  }
}

module.exports = {
  getSessions,
  bookSession,
  updateSessionStatus,
  updateSession,
  deleteSession,
  getCoachAssignments,
  getAssignedFreshers,
  getBuddyPairing,
  logContactClick,
  getStaffByUnit,
};
