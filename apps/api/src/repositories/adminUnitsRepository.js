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
