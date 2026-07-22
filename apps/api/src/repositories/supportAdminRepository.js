const logger = require('../utils/logger');
const { pool } = require("../services/db");

class SupportAdminRepository {
  async getDashboardStats(adminId) {
    const currentYear = new Date().getFullYear();
    const fresherYear = currentYear + 4;
    const { rows } = await pool.query(`
      SELECT 
        (SELECT COUNT(DISTINCT ur.user_id) FROM user_roles ur JOIN roles r ON ur.role_id = r.id JOIN users u ON ur.user_id = u.id WHERE r.name = 'student' AND u.class_year = ${fresherYear} AND NOT EXISTS (
          SELECT 1 FROM user_roles ur2 JOIN roles r2 ON ur2.role_id = r2.id WHERE ur2.user_id = ur.user_id AND r2.name IN ('peer_coach', 'coach_admin', 'counsellor', 'peer_counsellor', 'advisor', 'admin', 'staff')
        )) as total_freshers,
        (SELECT COUNT(DISTINCT ur.user_id) FROM user_roles ur JOIN roles r ON ur.role_id = r.id WHERE r.name = 'peer_coach') as total_coaches,
        (SELECT COUNT(DISTINCT ca.fresher_id) FROM coach_assignments ca JOIN users u ON ca.fresher_id = u.id WHERE u.class_year = ${fresherYear}) as assigned_freshers,
        (SELECT COUNT(*) FROM sessions s JOIN users u ON s.student_id = u.id WHERE s.with_type = 'peer_coach' AND s.status = 'completed' AND u.class_year = ${fresherYear}) as completed_mandatory_sessions,
        (SELECT COUNT(DISTINCT ca.fresher_id) * 3 FROM coach_assignments ca JOIN users u ON ca.fresher_id = u.id WHERE u.class_year = ${fresherYear}) as target_mandatory_sessions,
        (SELECT COUNT(*) FROM sessions s WHERE s.with_type = 'peer_coach' AND s.status = 'scheduled' AND s.scheduled_at >= now() AND (s.provider_id = $1 OR s.student_id = $1)) as upcoming_sessions_count,
        (SELECT COUNT(*) FROM sessions s WHERE s.with_type = 'peer_coach' AND s.status = 'scheduled' AND s.scheduled_at < now() AND (s.provider_id = $1 OR s.student_id = $1)) as overdue_sessions_count
    `, [adminId]);
    return rows[0];
  }

  async getFreshersNeedingAttention(limit = 10) {
    const currentYear = new Date().getFullYear();
    const fresherYear = currentYear + 4;
    const { rows } = await pool.query(`
      SELECT u.id, u.full_name, c.full_name as coach_name
      FROM coach_assignments ca
      JOIN users u ON ca.fresher_id = u.id
      JOIN users c ON ca.peer_coach_id = c.id
      WHERE u.class_year = $2 AND (
        SELECT COUNT(*) FROM sessions 
        WHERE student_id = ca.fresher_id AND status = 'completed'
      ) = 0
      LIMIT $1
    `, [limit, fresherYear]);
    return rows;
  }

  async getAdminCoaches(page = 1, limit = 20, search = "") {
    const offset = (page - 1) * limit;
    const queryParams = [limit, offset];
    let searchCondition = "";

    if (search) {
      searchCondition = `AND (u.full_name ILIKE $3 OR u.major ILIKE $3)`;
      queryParams.push(`%${search}%`);
    }

    const { rows } = await pool.query(`
      SELECT 
        COUNT(*) OVER() AS total_count,
        u.id, u.full_name, u.avatar_url, u.country, u.major,
        COUNT(ca.fresher_id) as assigned_count
      FROM user_roles ur
      JOIN users u ON ur.user_id = u.id
      JOIN roles r ON ur.role_id = r.id
      LEFT JOIN coach_assignments ca ON u.id = ca.peer_coach_id
      WHERE r.name = 'peer_coach' ${searchCondition}
      GROUP BY u.id
      ORDER BY u.full_name ASC
      LIMIT $1 OFFSET $2
    `, queryParams);

    const total = rows.length > 0 ? parseInt(rows[0].total_count, 10) : 0;
    return {
      data: rows,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) }
    };
  }

  async getAdminFreshers(page = 1, limit = 20, search = "") {
    const currentYear = new Date().getFullYear();
    const fresherYear = currentYear + 4;
    const offset = (page - 1) * limit;
    const queryParams = [limit, offset, fresherYear];
    let searchCondition = "";

    if (search) {
      searchCondition = `AND (u.full_name ILIKE $4 OR u.major ILIKE $4)`;
      queryParams.push(`%${search}%`);
    }

    const { rows } = await pool.query(`
        SELECT 
          COUNT(*) OVER() AS total_count,
          u.id, u.full_name, u.avatar_url, u.country, u.major,
          c.full_name as coach_name,
          (SELECT COUNT(*) FROM sessions WHERE student_id = u.id AND status = 'completed' AND provider_id = ca.peer_coach_id) as completed_sessions,
          (SELECT COUNT(*) FROM sessions s2 JOIN user_roles ur3 ON s2.provider_id = ur3.user_id JOIN roles r3 ON ur3.role_id = r3.id WHERE s2.student_id = u.id AND s2.status = 'completed' AND r3.name = 'coach_admin') as admin_sessions_completed
        FROM user_roles ur
        JOIN users u ON ur.user_id = u.id
        JOIN roles r ON ur.role_id = r.id
        LEFT JOIN coach_assignments ca ON u.id = ca.fresher_id
        LEFT JOIN users c ON ca.peer_coach_id = c.id
        WHERE r.name = 'student' AND u.class_year = $3
        AND NOT EXISTS (
          SELECT 1 FROM user_roles ur2 
          JOIN roles r2 ON ur2.role_id = r2.id 
          WHERE ur2.user_id = u.id AND r2.name = 'peer_coach'
        ) ${searchCondition}
        ORDER BY u.full_name ASC
        LIMIT $1 OFFSET $2
    `, queryParams);

    const total = rows.length > 0 ? parseInt(rows[0].total_count, 10) : 0;
    return {
      data: rows,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) }
    };
  }
  async getUserProfile(id) {
    const { rows } = await pool.query(`
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
    return rows.length ? rows[0] : null;
  }

  async getAssignedFreshersForCoach(coachId) {
    const { rows } = await pool.query(`
      SELECT 
        f.id, f.full_name as name,
        (SELECT COUNT(*) FROM sessions WHERE student_id = f.id AND status = 'completed' AND provider_id = $1) as sessions_completed,
        3 as total_assigned
      FROM coach_assignments ca
      JOIN users f ON ca.fresher_id = f.id
      WHERE ca.peer_coach_id = $1
      UNION
      SELECT 
        f.id, f.full_name as name,
        (SELECT COUNT(*) FROM sessions WHERE student_id = f.id AND status = 'completed' AND provider_id = $1) as sessions_completed,
        3 as total_assigned
      FROM counsellor_assignments ca
      JOIN users f ON ca.student_id = f.id
      WHERE ca.peer_counsellor_id = $1
    `, [coachId]);
    return rows;
  }

  async getAssignedCoachForFresher(fresherId) {
    const { rows } = await pool.query(`
      SELECT c.id, c.full_name as name, c.avatar_url
      FROM coach_assignments ca
      JOIN users c ON ca.peer_coach_id = c.id
      WHERE ca.fresher_id = $1
      UNION
      SELECT c.id, c.full_name as name, c.avatar_url
      FROM counsellor_assignments ca
      JOIN users c ON ca.peer_counsellor_id = c.id
      WHERE ca.student_id = $1
    `, [fresherId]);
    return rows.length ? rows[0] : null;
  }

  async getRecentSessions(userId, sessionFilter, params) {
    const { rows } = await pool.query(`
      SELECT s.id, s.with_type as type, s.scheduled_at as date, s.status, s.location, s.provider_id, s.student_id, s.title,
             u.full_name as with_name, r.content as report_content
      FROM sessions s
      LEFT JOIN session_reports r ON s.id = r.session_id
      LEFT JOIN users u ON (s.student_id = u.id AND s.provider_id = $1) OR (s.provider_id = u.id AND s.student_id = $1)
      ${sessionFilter}
      ORDER BY s.scheduled_at DESC
      LIMIT 10
    `, params);
    return rows;
  }
  async assignFresherToCoach(academicYearId, fresherId, coachId, assignedBy) {
    const { rows } = await pool.query(`
      INSERT INTO coach_assignments (academic_year_id, fresher_id, peer_coach_id, assigned_by)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (academic_year_id, fresher_id, peer_coach_id) DO NOTHING
      RETURNING *
    `, [academicYearId || 1, fresherId, coachId, assignedBy]);
    return rows[0];
  }

  async bulkAssignFreshers(academicYearId, assignedBy) {
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      
      const { rows: coaches } = await client.query(`
        SELECT ur.user_id as id
        FROM user_roles ur
        JOIN roles r ON ur.role_id = r.id
        WHERE r.name = 'peer_coach'
      `);
      
      if (coaches.length === 0) {
        await client.query("ROLLBACK");
        throw new Error("No active coaches found");
      }
      
      const currentYear = new Date().getFullYear();
      const fresherYear = currentYear + 4;
      const { rows: freshers } = await client.query(`
        SELECT u.id
        FROM user_roles ur
        JOIN users u ON ur.user_id = u.id
        JOIN roles r ON ur.role_id = r.id
        WHERE r.name = 'student' AND u.class_year = $1
          AND NOT EXISTS (
            SELECT 1 FROM user_roles ur2 JOIN roles r2 ON ur2.role_id = r2.id WHERE ur2.user_id = u.id AND r2.name = 'peer_coach'
          )
          AND NOT EXISTS (
            SELECT 1 FROM coach_assignments ca WHERE ca.fresher_id = u.id
          )
      `, [fresherYear]);
      
      let count = 0;
      for (let i = 0; i < freshers.length; i++) {
        const coachIndex = i % coaches.length;
        await client.query(`
          INSERT INTO coach_assignments (academic_year_id, fresher_id, peer_coach_id, assigned_by)
          VALUES ($1, $2, $3, $4)
          ON CONFLICT DO NOTHING
        `, [academicYearId || 1, freshers[i].id, coaches[coachIndex].id, assignedBy]);
        count++;
      }
      
      await client.query("COMMIT");
      return count;
    } catch (err) {
      await client.query("ROLLBACK");
      throw err;
    } finally {
      client.release();
    }
  }
  async promoteToCoach(studentId) {
    await pool.query(`
      INSERT INTO user_roles (user_id, role_id)
      SELECT $1, id FROM roles WHERE name = 'peer_coach'
      ON CONFLICT DO NOTHING
    `, [studentId]);
  }

  async getAnnouncements(page = 1, limit = 20, search = "") {
    const offset = (page - 1) * limit;
    const queryParams = [limit, offset];
    let searchCondition = "";

    if (search) {
      searchCondition = `WHERE a.title ILIKE $3 OR a.content ILIKE $3`;
      queryParams.push(`%${search}%`);
    }

    const { rows } = await pool.query(`
      SELECT 
        COUNT(*) OVER() AS total_count,
        a.*, u.full_name as author_name
      FROM announcements a
      JOIN users u ON a.author_id = u.id
      ${searchCondition}
      ORDER BY a.created_at DESC
      LIMIT $1 OFFSET $2
    `, queryParams);

    const total = rows.length > 0 ? parseInt(rows[0].total_count, 10) : 0;
    return {
      data: rows,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) }
    };
  }

  async postAnnouncement(authorId, targetAudience, title, content) {
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      let postId = null;
      if (targetAudience === 'school_wide') {
        const { rows: postRows } = await client.query(`
          INSERT INTO posts (author_id, title, content, category)
          VALUES ($1, $2, $3, 'announcement')
          RETURNING id
        `, [authorId, title, content]);
        postId = postRows[0].id;
      }
      
      const { rows } = await client.query(`
        INSERT INTO announcements (author_id, target_audience, title, content, post_id)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING *
      `, [authorId, targetAudience, title, content, postId]);
      
      await client.query("COMMIT");
      return rows[0];
    } catch (err) {
      await client.query("ROLLBACK");
      throw err;
    } finally {
      client.release();
    }
  }

  async updateAnnouncement(id, authorId, title, content) {
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      const { rows } = await client.query(`
        UPDATE announcements
        SET title = $1, content = $2
        WHERE id = $3 AND author_id = $4
        RETURNING *
      `, [title, content, id, authorId]);
      
      if (rows.length === 0) {
        await client.query("ROLLBACK");
        return null;
      }
      
      if (rows[0].post_id) {
        await client.query(`
          UPDATE posts
          SET title = $1, content = $2, updated_at = now()
          WHERE id = $3
        `, [title, content, rows[0].post_id]);
      }
      
      await client.query("COMMIT");
      return rows[0];
    } catch (err) {
      await client.query("ROLLBACK");
      throw err;
    } finally {
      client.release();
    }
  }

  async deleteAnnouncement(id, authorId) {
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      const { rows } = await client.query(`
        DELETE FROM announcements
        WHERE id = $1 AND author_id = $2
        RETURNING post_id
      `, [id, authorId]);
      
      if (rows.length > 0 && rows[0].post_id) {
        await client.query(`DELETE FROM posts WHERE id = $1`, [rows[0].post_id]);
      }
      
      await client.query("COMMIT");
      return true;
    } catch (err) {
      await client.query("ROLLBACK");
      throw err;
    } finally {
      client.release();
    }
  }

  async flagReport(id, needsFollowUp) {
    const { rows } = await pool.query(`
      UPDATE session_reports
      SET needs_follow_up = $1
      WHERE id = $2
      RETURNING *
    `, [needsFollowUp, id]);
    return rows[0];
  }

  async getAdminReports(page = 1, limit = 20, search = "") {
    const offset = (page - 1) * limit;
    const queryParams = [limit, offset];
    let searchCondition = "";

    if (search) {
      searchCondition = `WHERE f.full_name ILIKE $3 OR u.full_name ILIKE $3 OR sr.content ILIKE $3`;
      queryParams.push(`%${search}%`);
    }

    const { rows } = await pool.query(`
      SELECT 
        COUNT(*) OVER() AS total_count,
        sr.*, s.scheduled_at, s.status, u.full_name as provider_name, f.full_name as student_name
      FROM session_reports sr
      JOIN sessions s ON sr.session_id = s.id
      JOIN users u ON sr.provider_id = u.id
      JOIN users f ON s.student_id = f.id
      ${searchCondition}
      ORDER BY sr.submitted_at DESC
      LIMIT $1 OFFSET $2
    `, queryParams);

    const total = rows.length > 0 ? parseInt(rows[0].total_count, 10) : 0;
    return {
      data: rows,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) }
    };
  }

  async logComplianceFollowUp(fresherId, academicYearId, notes, userId) {
    const { rows } = await pool.query(`
      INSERT INTO compliance_follow_ups (academic_year_id, fresher_id, followed_up_by, notes)
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `, [academicYearId || 1, fresherId, userId, notes]);
    return rows[0];
  }

  async getAdminSessions(page = 1, limit = 20, filter = null) {
    const offset = (page - 1) * limit;
    
    let queryStr = `
      SELECT 
        COUNT(*) OVER() AS total_count,
        s.id, s.with_type as type, s.scheduled_at as date, s.status, s.location, s.description, s.is_mandatory,
        s.student_id, s.provider_id, s.title,
        u1.full_name as student_name, u1.avatar_url as student_avatar,
        u2.full_name as provider_name, u2.avatar_url as provider_avatar,
        r.content as report_content
      FROM sessions s
      JOIN users u1 ON s.student_id = u1.id
      JOIN users u2 ON s.provider_id = u2.id
      LEFT JOIN session_reports r ON s.id = r.session_id
      WHERE s.with_type = 'peer_coach'
    `;
    
    if (filter === 'upcoming') {
      queryStr += ` AND s.status = 'scheduled' AND s.scheduled_at > NOW()`;
    } else if (filter === 'overdue') {
      queryStr += ` AND s.status = 'scheduled' AND s.scheduled_at <= NOW()`;
    } else if (filter === 'completed') {
      queryStr += ` AND s.status = 'completed'`;
    }
    
    queryStr += ` ORDER BY s.scheduled_at DESC LIMIT $1 OFFSET $2`;
    
    const { rows } = await pool.query(queryStr, [limit, offset]);
    
    const total = rows.length > 0 ? parseInt(rows[0].total_count, 10) : 0;
    return {
      data: rows,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  async getAdminStudents(page = 1, limit = 20, search = "", tab = "all") {
    const offset = (page - 1) * limit;
    
    // Determine dynamic fresher year based on current year + 4
    const currentYear = new Date().getFullYear();
    const fresherYear = currentYear + 4;
    
    let baseWhere = `(r.name = 'peer_coach' OR (r.name = 'student' AND u.class_year = ${fresherYear}))`;
    
    if (tab === "freshers") {
      baseWhere = `(r.name = 'student' AND u.class_year = ${fresherYear})`;
    } else if (tab === "coaches") {
      baseWhere = `r.name = 'peer_coach'`;
    }
    
    const queryParams = [limit, offset];
    let searchCondition = "";
    if (search) {
      searchCondition = `AND (u.full_name ILIKE $3 OR u.major ILIKE $3)`;
      queryParams.push(`%${search}%`);
    }

    const { rows } = await pool.query(`
      SELECT COUNT(*) OVER() AS total_count,
             u.id, u.full_name as name, u.avatar_url, u.country, u.major, MIN(r.name) as type
      FROM users u
      JOIN user_roles ur ON u.id = ur.user_id
      JOIN roles r ON ur.role_id = r.id
      WHERE ${baseWhere} ${searchCondition}
      GROUP BY u.id, u.full_name, u.avatar_url, u.country, u.major
      ORDER BY u.full_name ASC
      LIMIT $1 OFFSET $2
    `, queryParams);
    
    const total = rows.length > 0 ? parseInt(rows[0].total_count, 10) : 0;
    return {
      data: rows,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  async adminBookSession(unitId, academicYearId, studentId, providerId, withType, scheduledAt, location, isMandatory, description, title, bookedById) {
    let finalTitle = title;
    if (!finalTitle && bookedById) {
      const { rows: userRows } = await pool.query("SELECT full_name FROM users WHERE id = $1", [bookedById]);
      const userName = userRows[0]?.full_name || "Admin";
      finalTitle = `${userName}'s session`;
    } else if (!finalTitle) {
      finalTitle = "Admin's session";
    }

    const { rows } = await pool.query(`
      INSERT INTO sessions 
        (title, unit_id, academic_year_id, student_id, provider_id, with_type, scheduled_at, location, description, is_mandatory, status, created_by)
      VALUES 
        ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'scheduled', $11)
      RETURNING *
    `, [finalTitle, unitId, academicYearId, studentId, providerId, withType || 'peer_coach', scheduledAt, location, description, isMandatory || false, bookedById]);
    return rows[0];
  }
}

module.exports = new SupportAdminRepository();
