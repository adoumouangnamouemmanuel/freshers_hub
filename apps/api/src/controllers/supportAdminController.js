const { pool } = require("../services/db");

// Dashboard Overview
async function getAdminDashboardStats(req, res) {
  const client = await pool.connect();
  try {
    // Overdue is calculated dynamically now

    // Basic stats for Coach Admin
    const { rows: stats } = await client.query(`
      SELECT 
        (SELECT COUNT(*) FROM user_roles ur JOIN roles r ON ur.role_id = r.id WHERE r.name = 'student' AND NOT EXISTS (
          SELECT 1 FROM user_roles ur2 JOIN roles r2 ON ur2.role_id = r2.id WHERE ur2.user_id = ur.user_id AND r2.name = 'peer_coach'
        )) as total_freshers,
        (SELECT COUNT(*) FROM user_roles ur JOIN roles r ON ur.role_id = r.id WHERE r.name = 'peer_coach') as total_coaches,
        (SELECT COUNT(DISTINCT fresher_id) FROM coach_assignments) as assigned_freshers,
        (SELECT COUNT(*) FROM sessions WHERE with_type = 'peer_coach' AND status = 'completed') as completed_mandatory_sessions,
        (SELECT COUNT(DISTINCT fresher_id) * 3 FROM coach_assignments) as target_mandatory_sessions,
        (SELECT COUNT(*) FROM sessions WHERE status = 'scheduled' AND scheduled_at >= now()) as upcoming_sessions_count,
        (SELECT COUNT(*) FROM sessions WHERE status = 'scheduled' AND scheduled_at < now()) as overdue_sessions_count
    `);

      // Ensure we map the new keys to what the frontend expects
    const totalFreshers = parseInt(stats[0].total_freshers);
    const totalCoaches = parseInt(stats[0].total_coaches);
    
    // Auto-calculate optimal threshold (Math.ceil(total_freshers / total_coaches))
    // e.g. 15 freshers / 6 coaches = 2.5 -> max 3 per coach. If 0 coaches, threshold is 0.
    const threshold = totalCoaches > 0 ? Math.ceil(totalFreshers / totalCoaches) : 0;

    const formattedStats = {
      total_freshers: totalFreshers,
      assigned_freshers: parseInt(stats[0].assigned_freshers),
      active_coaches: totalCoaches,
      completed_mandatory_sessions: parseInt(stats[0].completed_mandatory_sessions),
      target_mandatory_sessions: parseInt(stats[0].target_mandatory_sessions),
      target_freshers_per_coach: threshold,
      upcoming_sessions_count: parseInt(stats[0].upcoming_sessions_count),
      overdue_sessions_count: parseInt(stats[0].overdue_sessions_count)
    };
    
    // Needs attention list (freshers with 0 completed sessions)
    const { rows: needsAttention } = await client.query(`
      SELECT u.id, u.full_name, c.full_name as coach_name
      FROM coach_assignments ca
      JOIN users u ON ca.fresher_id = u.id
      JOIN users c ON ca.peer_coach_id = c.id
      WHERE (
        SELECT COUNT(*) FROM sessions 
        WHERE student_id = ca.fresher_id AND status = 'completed'
      ) = 0
      LIMIT 10
    `);

    res.json({
      stats: formattedStats,
      needsAttention,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  } finally {
    client.release();
  }
}

// Get Peer Coaches
async function getAdminCoaches(req, res) {
  const client = await pool.connect();
  try {
    const { rows } = await client.query(`
      SELECT 
        u.id, u.full_name, u.avatar_url, u.country, u.major,
        COUNT(ca.fresher_id) as assigned_count
      FROM user_roles ur
      JOIN users u ON ur.user_id = u.id
      JOIN roles r ON ur.role_id = r.id
      LEFT JOIN coach_assignments ca ON u.id = ca.peer_coach_id
      WHERE r.name = 'peer_coach'
      GROUP BY u.id
    `);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  } finally {
    client.release();
  }
}

// Get Freshers
async function getAdminFreshers(req, res) {
  const client = await pool.connect();
  try {
    const { rows } = await client.query(`
      SELECT 
        u.id, u.full_name, u.avatar_url, u.country, u.major,
        c.full_name as coach_name,
        (SELECT COUNT(*) FROM sessions WHERE student_id = u.id AND status = 'completed') as completed_sessions
      FROM user_roles ur
      JOIN users u ON ur.user_id = u.id
      JOIN roles r ON ur.role_id = r.id
      LEFT JOIN coach_assignments ca ON u.id = ca.fresher_id
      LEFT JOIN users c ON ca.peer_coach_id = c.id
      WHERE r.name = 'student'
        AND NOT EXISTS (
          SELECT 1 FROM user_roles ur2 
          JOIN roles r2 ON ur2.role_id = r2.id 
          WHERE ur2.user_id = u.id AND r2.name = 'peer_coach'
        )
    `);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  } finally {
    client.release();
  }
}

// Assign Fresher to Coach
async function assignFresherToCoach(req, res) {
  const { fresherId, coachId, academicYearId } = req.body;
  if (!fresherId || !coachId) return res.status(400).json({ error: "Missing ids" });

  const client = await pool.connect();
  try {
    const { rows } = await client.query(`
      INSERT INTO coach_assignments (academic_year_id, fresher_id, peer_coach_id, assigned_by)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (academic_year_id, fresher_id, peer_coach_id) DO NOTHING
      RETURNING *
    `, [academicYearId || 1, fresherId, coachId, req.user.id]);
    res.json({ success: true, assignment: rows[0] });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  } finally {
    client.release();
  }
}

// Bulk Assign Freshers (Round Robin)
async function bulkAssignFreshers(req, res) {
  const { academicYearId } = req.body;
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    
    // Get all active coaches
    const { rows: coaches } = await client.query(`
      SELECT ur.user_id as id
      FROM user_roles ur
      JOIN roles r ON ur.role_id = r.id
      WHERE r.name = 'peer_coach'
    `);
    
    if (coaches.length === 0) {
      await client.query("ROLLBACK");
      return res.status(400).json({ error: "No active coaches found" });
    }
    
    // Get all unassigned freshers
    const { rows: freshers } = await client.query(`
      SELECT u.id
      FROM user_roles ur
      JOIN users u ON ur.user_id = u.id
      JOIN roles r ON ur.role_id = r.id
      WHERE r.name = 'student'
        AND NOT EXISTS (
          SELECT 1 FROM user_roles ur2 JOIN roles r2 ON ur2.role_id = r2.id WHERE ur2.user_id = u.id AND r2.name = 'peer_coach'
        )
        AND NOT EXISTS (
          SELECT 1 FROM coach_assignments ca WHERE ca.fresher_id = u.id
        )
    `);
    
    let count = 0;
    for (let i = 0; i < freshers.length; i++) {
      const coachIndex = i % coaches.length;
      await client.query(`
        INSERT INTO coach_assignments (academic_year_id, fresher_id, peer_coach_id, assigned_by)
        VALUES ($1, $2, $3, $4)
        ON CONFLICT DO NOTHING
      `, [academicYearId || 1, freshers[i].id, coaches[coachIndex].id, req.user.id]);
      count++;
    }
    
    await client.query("COMMIT");
    res.json({ success: true, assignedCount: count });
  } catch (err) {
    await client.query("ROLLBACK");
    res.status(500).json({ error: "Server error" });
  } finally {
    client.release();
  }
}

// Promote Student to Coach
async function promoteToCoach(req, res) {
  const { studentId } = req.body;
  const client = await pool.connect();
  try {
    await client.query(`
      INSERT INTO user_roles (user_id, role_id)
      SELECT $1, id FROM roles WHERE name = 'peer_coach'
      ON CONFLICT DO NOTHING
    `, [studentId]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  } finally {
    client.release();
  }
}

// Get Announcements
async function getAnnouncements(req, res) {
  const client = await pool.connect();
  try {
    const { rows } = await client.query(`
      SELECT a.*, u.full_name as author_name
      FROM announcements a
      JOIN users u ON a.author_id = u.id
      ORDER BY a.created_at DESC
    `);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  } finally {
    client.release();
  }
}

// Post Announcement
async function postAnnouncement(req, res) {
  const { targetAudience, title, content } = req.body;
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    
    let postId = null;
    
    // If school_wide, insert into posts first to get post ID
    if (targetAudience === 'school_wide') {
      const { rows: postRows } = await client.query(`
        INSERT INTO posts (author_id, title, content, category)
        VALUES ($1, $2, $3, 'announcement')
        RETURNING id
      `, [req.user.id, title, content]);
      postId = postRows[0].id;
    }
    
    const { rows } = await client.query(`
      INSERT INTO announcements (author_id, target_audience, title, content, post_id)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `, [req.user.id, targetAudience, title, content, postId]);
    
    await client.query("COMMIT");
    res.json(rows[0]);
  } catch (err) {
    await client.query("ROLLBACK");
    res.status(500).json({ error: "Server error" });
  } finally {
    client.release();
  }
}

// Update Announcement
async function updateAnnouncement(req, res) {
  const { id } = req.params;
  const { title, content } = req.body;
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    
    const { rows } = await client.query(`
      UPDATE announcements
      SET title = $1, content = $2
      WHERE id = $3 AND author_id = $4
      RETURNING *
    `, [title, content, id, req.user.id]);
    
    if (rows.length === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({ error: "Not found" });
    }
    
    if (rows[0].post_id) {
      await client.query(`
        UPDATE posts
        SET title = $1, content = $2, updated_at = now()
        WHERE id = $3
      `, [title, content, rows[0].post_id]);
    }
    
    await client.query("COMMIT");
    res.json(rows[0]);
  } catch (err) {
    await client.query("ROLLBACK");
    res.status(500).json({ error: "Server error" });
  } finally {
    client.release();
  }
}

// Delete Announcement
async function deleteAnnouncement(req, res) {
  const { id } = req.params;
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    
    const { rows } = await client.query(`
      DELETE FROM announcements
      WHERE id = $1 AND author_id = $2
      RETURNING post_id
    `, [id, req.user.id]);
    
    if (rows.length > 0 && rows[0].post_id) {
      await client.query(`DELETE FROM posts WHERE id = $1`, [rows[0].post_id]);
    }
    
    await client.query("COMMIT");
    res.json({ success: true });
  } catch (err) {
    await client.query("ROLLBACK");
    res.status(500).json({ error: "Server error" });
  } finally {
    client.release();
  }
}

// Flag report
async function flagReport(req, res) {
  const { id } = req.params;
  const { needsFollowUp } = req.body;
  const client = await pool.connect();
  try {
    const { rows } = await client.query(`
      UPDATE session_reports
      SET needs_follow_up = $1
      WHERE id = $2
      RETURNING *
    `, [needsFollowUp, id]);
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  } finally {
    client.release();
  }
}

// Get Reports
async function getAdminReports(req, res) {
  const client = await pool.connect();
  try {
    const { rows } = await client.query(`
      SELECT sr.*, s.scheduled_at, s.status, u.full_name as provider_name, f.full_name as student_name
      FROM session_reports sr
      JOIN sessions s ON sr.session_id = s.id
      JOIN users u ON sr.provider_id = u.id
      JOIN users f ON s.student_id = f.id
      ORDER BY sr.submitted_at DESC
    `);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  } finally {
    client.release();
  }
}

// Log Follow Up
async function logComplianceFollowUp(req, res) {
  const { fresherId, academicYearId, notes } = req.body;
  const client = await pool.connect();
  try {
    const { rows } = await client.query(`
      INSERT INTO compliance_follow_ups (academic_year_id, fresher_id, followed_up_by, notes)
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `, [academicYearId || 1, fresherId, req.user.id, notes]);
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  } finally {
    client.release();
  }
}

// Get User Profile (for public view)
async function getAdminUserProfile(req, res) {
  const { id } = req.params;
  const client = await pool.connect();
  try {
    const { rows } = await client.query(`
      SELECT 
        u.id, u.full_name, u.email, u.phone, u.avatar_url, u.country, u.major, u.class_year,
        sp.school_id, sp.graduation_year,
        ARRAY_AGG(DISTINCT r.name) as roles,
        (SELECT COUNT(*) FROM sessions WHERE student_id = u.id) as sessions_as_student,
        (SELECT COUNT(*) FROM sessions WHERE student_id = u.id AND status = 'completed') as completed_sessions_as_student,
        (SELECT COUNT(*) FROM sessions WHERE provider_id = u.id) as sessions_as_provider,
        (SELECT COUNT(*) FROM sessions WHERE provider_id = u.id AND status = 'completed') as completed_sessions_as_provider,
        (SELECT COUNT(*) FROM session_reports WHERE provider_id = u.id) as reports_filed
      FROM users u
      LEFT JOIN student_profiles sp ON u.id = sp.user_id
      LEFT JOIN user_roles ur ON u.id = ur.user_id
      LEFT JOIN roles r ON ur.role_id = r.id
      WHERE u.id = $1
      GROUP BY u.id, sp.school_id, sp.graduation_year
    `, [id]);
    
    if (rows.length === 0) return res.status(404).json({ error: "User not found" });
    
    const userProfile = rows[0];
    
    if (userProfile.roles && userProfile.roles.includes('peer_coach')) {
      const { rows: assignedFreshers } = await client.query(`
        SELECT 
          f.id, f.full_name as name,
          (SELECT COUNT(*) FROM sessions WHERE student_id = f.id AND status = 'completed') as sessions_completed,
          3 as total_assigned
        FROM coach_assignments ca
        JOIN users f ON ca.fresher_id = f.id
        WHERE ca.peer_coach_id = $1
      `, [id]);
      userProfile.assigned_freshers = assignedFreshers.map(f => ({
        id: f.id,
        name: f.name,
        sessionsCompleted: parseInt(f.sessions_completed || 0),
        totalAssigned: parseInt(f.total_assigned)
      }));
    } else {
      userProfile.assigned_freshers = [];
      const { rows: coachResult } = await client.query(`
        SELECT c.id, c.full_name as name, c.avatar_url
        FROM coach_assignments ca
        JOIN users c ON ca.peer_coach_id = c.id
        WHERE ca.fresher_id = $1
      `, [id]);
      userProfile.assigned_coach = coachResult.length > 0 ? coachResult[0] : null;
    }

    let sessionFilter = `WHERE (s.student_id = $1 OR s.provider_id = $1)`;
    const params = [id];

    if (req.user.roles.includes("peer_coach") && !req.user.roles.includes("coach_admin") && !req.user.roles.includes("admin")) {
      sessionFilter += ` AND (s.student_id = $2 OR s.provider_id = $2)`;
      params.push(req.user.id);
    } else if (req.user.roles.includes("coach_admin") || req.user.roles.includes("admin")) {
      sessionFilter += ` AND s.with_type = 'peer_coach'`;
    }

    // Fetch recent sessions
    const { rows: recentSessions } = await client.query(`
      SELECT s.id, s.with_type as type, s.scheduled_at as date, s.status, s.location, s.provider_id, s.student_id,
             u.full_name as with_name, r.content as report_content
      FROM sessions s
      LEFT JOIN session_reports r ON s.id = r.session_id
      LEFT JOIN users u ON (s.student_id = u.id AND s.provider_id = $1) OR (s.provider_id = u.id AND s.student_id = $1)
      ${sessionFilter}
      ORDER BY s.scheduled_at DESC
      LIMIT 10
    `, params);
    
    userProfile.recent_sessions = recentSessions.map(rs => {
      return {
        id: rs.id,
        type: (rs.type === 'peer_coach' && rs.with_name?.toLowerCase().includes('yvonne')) ? 'Coaching' : (rs.type === 'peer_coach' ? 'Peer Coaching' : (rs.type || 'Session')),
        date: new Date(rs.date).toLocaleDateString() + " • " + new Date(rs.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}),
        status: rs.status,
        with: rs.with_name,
        location: rs.location || "TBD",
        provider_id: rs.provider_id,
        student_id: rs.student_id,
        has_report: !!rs.report_content,
        report: rs.report_content ? {
          topic: rs.report_content.topic || "N/A",
          actions: rs.report_content.action_items || rs.report_content.actions || "N/A",
          mood: rs.report_content.wellbeing_notes || rs.report_content.mood || "N/A"
        } : null
      };
    });

    res.json(userProfile);
  } catch (err) {
    console.error("GET ADMIN USER PROFILE ERROR:", err);
    res.status(500).json({ error: err.message, stack: err.stack });
  } finally {
    client.release();
  }
}

// Get Admin Sessions
async function getAdminSessions(req, res) {
  const client = await pool.connect();
  try {
    // Overdue is handled dynamically by frontend

    const { rows } = await client.query(`
      SELECT 
        s.id, s.with_type as type, s.scheduled_at as date, s.status, s.location, s.description, s.is_mandatory,
        s.student_id, s.provider_id,
        u1.full_name as student_name, u1.avatar_url as student_avatar,
        u2.full_name as provider_name, u2.avatar_url as provider_avatar,
        r.content as report_content
      FROM sessions s
      JOIN users u1 ON s.student_id = u1.id
      JOIN users u2 ON s.provider_id = u2.id
      LEFT JOIN session_reports r ON s.id = r.session_id
      ORDER BY s.scheduled_at DESC
    `);
    res.json(rows);
  } catch (err) {
    console.error("Error getting admin sessions:", err);
    res.status(500).json({ error: "Internal server error" });
  } finally {
    client.release();
  }
}

// Get Admin Students
async function getAdminStudents(req, res) {
  const client = await pool.connect();
  try {
    const { rows: directory } = await client.query(`
      SELECT u.id, u.full_name as name, u.avatar_url, u.country, u.major, r.name as type
      FROM users u
      JOIN user_roles ur ON u.id = ur.user_id
      JOIN roles r ON ur.role_id = r.id
      WHERE r.name IN ('student', 'peer_coach')
      ORDER BY u.full_name ASC
    `);

    res.json(directory);
  } catch (err) {
    console.error("Error getting admin directory:", err);
    res.status(500).json({ error: "Internal server error" });
  } finally {
    client.release();
  }
}

// Book a session as an admin
async function adminBookSession(req, res) {
  const { unitId, academicYearId, studentId, providerId, withType, scheduledAt, location, isMandatory, description } = req.body;
  
  if (!unitId || !academicYearId || !studentId || !providerId || !scheduledAt) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  const client = await pool.connect();
  try {
    const { rows } = await client.query(`
      INSERT INTO sessions 
        (unit_id, academic_year_id, student_id, provider_id, with_type, scheduled_at, location, description, is_mandatory, status)
      VALUES 
        ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'scheduled')
      RETURNING *
    `, [unitId, academicYearId, studentId, providerId, withType || 'peer_coach', scheduledAt, location, description, isMandatory || false]);

    res.status(201).json(rows[0]);
  } catch (err) {
    console.error("Error admin booking session:", err);
    res.status(500).json({ error: "Internal server error" });
  } finally {
    client.release();
  }
}

module.exports = {
  getAdminDashboardStats,
  getAdminCoaches,
  getAdminFreshers,
  assignFresherToCoach,
  bulkAssignFreshers,
  promoteToCoach,
  getAnnouncements,
  postAnnouncement,
  updateAnnouncement,
  deleteAnnouncement,
  flagReport,
  getAdminReports,
  logComplianceFollowUp,
  getAdminUserProfile,
  getAdminSessions,
  getAdminStudents,
  adminBookSession,
};
