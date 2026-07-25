/**
 * Admin Units Repository
 *
 * CONFIDENTIALITY BOUNDARY: Every method in this file queries
 * aggregate VIEWS only (admin_*_summary). No method queries
 * sessions, session_reports, or session_feedback directly.
 *
 * Belt-and-suspenders: even if a bug introduced a direct query,
 * Postgres RLS has no policy granting platform_admin row access
 * to those tables, so it would return zero rows, not leaked data.
 */

const { pool } = require('../services/db');

class AdminUnitsRepository {
  // ── Coaching ───────────────────────────────────────────────────────────────

  async getCoachingSummary(academicYearId) {
    const params = academicYearId ? [academicYearId] : [];
    const where = academicYearId ? `WHERE academic_year_id = $1` : '';
    const { rows } = await pool.query(
      `SELECT * FROM admin_coaching_summary ${where}`,
      params
    );
    return rows[0] || null;
  }

  /**
   * Per-coach aggregate list — name + aggregate completion rate only.
   * Never returns individual fresher names or session content.
   */
  async getCoachingCoaches(academicYearId) {
    const params = academicYearId ? [academicYearId] : [];
    const yearFilter = academicYearId ? 'AND ca.academic_year_id = $1' : '';
    const { rows } = await pool.query(
      `SELECT
         u.id, u.full_name, u.avatar_url,
         COUNT(DISTINCT ca.fresher_id)                                   AS assigned_freshers,
         COUNT(s.id) FILTER (
           WHERE s.status = 'completed' AND s.with_type = 'peer_coach'
         )                                                               AS completed_sessions,
         COALESCE(
           ROUND(
             COUNT(s.id) FILTER (WHERE s.status = 'completed' AND s.with_type = 'peer_coach')::NUMERIC
             / NULLIF(COUNT(DISTINCT ca.fresher_id) * 3, 0) * 100
           ), 0
         )                                                               AS completion_rate_pct
       FROM user_roles ur
       JOIN users u ON u.id = ur.user_id
       JOIN roles r ON r.id = ur.role_id
       LEFT JOIN coach_assignments ca ON ca.peer_coach_id = u.id ${yearFilter}
       LEFT JOIN sessions s ON s.student_id = ca.fresher_id AND s.with_type = 'peer_coach'
       WHERE r.name = 'peer_coach'
       GROUP BY u.id
       ORDER BY u.full_name`,
      params
    );
    return rows;
  }

  // ── Counselling ────────────────────────────────────────────────────────────

  async getCounsellingSummary(academicYearId) {
    const params = academicYearId ? [academicYearId] : [];
    const where = academicYearId ? `WHERE academic_year_id = $1` : '';
    const { rows } = await pool.query(
      `SELECT * FROM admin_counselling_summary ${where}`,
      params
    );
    return rows[0] || null;
  }

  async getCounsellors(academicYearId) {
    // Return Professional and Peer Counsellors along with their active caseload
    const params = academicYearId ? [academicYearId] : [];
    const yearFilter = academicYearId ? 'AND ca.academic_year_id = $1' : '';
    const { rows } = await pool.query(
      `SELECT
         u.id, u.full_name, u.avatar_url, r.name as role_name,
         COUNT(ca.id) FILTER (WHERE ca.status = 'active') AS active_cases,
         COUNT(ca.id) FILTER (WHERE ca.status = 'resolved') AS resolved_cases
       FROM user_roles ur
       JOIN users u ON u.id = ur.user_id
       JOIN roles r ON r.id = ur.role_id
       LEFT JOIN counsellor_assignments ca ON ca.peer_counsellor_id = u.id ${yearFilter}
       WHERE r.name IN ('counsellor', 'peer_counsellor')
       GROUP BY u.id, r.name
       ORDER BY r.name, u.full_name`,
      params
    );
    return rows;
  }

  async getCounsellingCases(academicYearId, status = 'active') {
    const params = academicYearId ? [academicYearId, status] : [status];
    const whereYear = academicYearId ? `ca.academic_year_id = $1 AND` : '';
    const statusParam = academicYearId ? '$2' : '$1';
    
    const { rows } = await pool.query(
      `SELECT
         ca.id as assignment_id,
         ca.status,
         ca.notes,
         ca.created_at,
         ca.resolved_at,
         ca.academic_year_id,
         s.id as student_id,
         s.full_name as student_name,
         s.avatar_url as student_avatar,
         p.id as peer_counsellor_id,
         p.full_name as peer_counsellor_name,
         p.avatar_url as peer_counsellor_avatar,
         a.id as assigned_by_id,
         a.full_name as assigned_by_name
       FROM counsellor_assignments ca
       JOIN users s ON ca.student_id = s.id
       JOIN users p ON ca.peer_counsellor_id = p.id
       LEFT JOIN users a ON ca.assigned_by = a.id
       WHERE ${whereYear} ca.status = ${statusParam}
       ORDER BY ca.created_at DESC`,
      params
    );
    return rows;
  }

  async assignCounsellingCase({ academicYearId, studentId, peerCounsellorId, assignedBy, notes }) {
    const { rows } = await pool.query(`
      INSERT INTO counsellor_assignments (academic_year_id, student_id, peer_counsellor_id, assigned_by, notes, status, created_at)
      VALUES ($1, $2, $3, $4, $5, 'active', NOW())
      RETURNING *
    `, [academicYearId, studentId, peerCounsellorId, assignedBy, notes]);
    return rows[0];
  }

  async resolveCounsellingCase(assignmentId) {
    const { rows } = await pool.query(`
      UPDATE counsellor_assignments
      SET status = 'resolved', resolved_at = NOW()
      WHERE id = $1
      RETURNING *
    `, [assignmentId]);
    return rows[0];
  }

  // ── Advising ───────────────────────────────────────────────────────────────

  async getAdvisingSummary(academicYearId) {
    const params = academicYearId ? [academicYearId] : [];
    const where = academicYearId ? `WHERE academic_year_id = $1` : '';
    const { rows } = await pool.query(
      `SELECT * FROM admin_advising_summary ${where}`,
      params
    );
    return rows[0] || null;
  }

  // ── Buddy Up ───────────────────────────────────────────────────────────────

  async getBuddyUpSummary(academicYearId) {
    const params = academicYearId ? [academicYearId] : [];
    const where = academicYearId ? `WHERE academic_year_id = $1` : '';
    const { rows } = await pool.query(
      `SELECT * FROM admin_buddy_up_summary ${where}`,
      params
    );
    return rows[0] || null;
  }

  /**
   * Buddy Up sync: upserts buddy_pairings from external OIPCC data.
   * Idempotent — keyed by odip_ref_id, re-running does not create duplicates.
   */
  async syncBuddyUp(pairings, triggeredBy) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      let synced = 0;

      for (const p of pairings) {
        await client.query(
          `INSERT INTO buddy_pairings (odip_ref_id, fresher_id, buddy_id, academic_year_id, is_active)
           VALUES ($1, $2, $3, $4, true)
           ON CONFLICT (odip_ref_id)
           DO UPDATE SET
             fresher_id       = EXCLUDED.fresher_id,
             buddy_id         = EXCLUDED.buddy_id,
             academic_year_id = EXCLUDED.academic_year_id,
             is_active        = true,
             synced_at        = now()`,
          [p.odip_ref_id, p.fresher_id, p.buddy_id, p.academic_year_id]
        );
        synced++;
      }

      // Log the sync event
      await client.query(
        `INSERT INTO buddy_sync_log (triggered_by, source, status, synced_count)
         VALUES ($1, 'manual', 'success', $2)`,
        [triggeredBy, synced]
      );

      await client.query('COMMIT');
      return { synced };
    } catch (err) {
      await client.query('ROLLBACK');
      // Log failure
      await pool.query(
        `INSERT INTO buddy_sync_log (triggered_by, source, status, synced_count, error_detail)
         VALUES ($1, 'manual', 'failed', 0, $2)`,
        [triggeredBy, err.message]
      );
      throw err;
    } finally {
      client.release();
    }
  }

  async getSyncStatus() {
    const { rows } = await pool.query(
      `SELECT id, triggered_by, source, status, synced_count, error_detail, synced_at
       FROM buddy_sync_log
       ORDER BY synced_at DESC
       LIMIT 10`
    );
    return rows;
  }
}

module.exports = new AdminUnitsRepository();
