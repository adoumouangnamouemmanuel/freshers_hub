/**
 * Admin Analytics Repository
 *
 * All queries read from materialized views — never from raw session tables.
 * Views are refreshed nightly. Slightly stale data is acceptable for trend charts.
 */

const { pool } = require('../services/db');

class AdminAnalyticsRepository {
  async getOverview(academicYearId) {
    const params = academicYearId ? [academicYearId] : [];
    const yearFilter = academicYearId ? 'WHERE ca.academic_year_id = $1' : '';

    // Aggregate across all units + users for the given year
    const { rows: coaching }     = await pool.query(`SELECT * FROM admin_coaching_summary     ${academicYearId ? 'WHERE academic_year_id = $1' : ''}`, params);
    const { rows: counselling }  = await pool.query(`SELECT * FROM admin_counselling_summary  ${academicYearId ? 'WHERE academic_year_id = $1' : ''}`, params);
    const { rows: advising }     = await pool.query(`SELECT * FROM admin_advising_summary     ${academicYearId ? 'WHERE academic_year_id = $1' : ''}`, params);

    const { rows: userStats } = await pool.query(
      `SELECT
         COUNT(DISTINCT u.id) FILTER (WHERE r.name = 'student')      AS total_students,
         COUNT(DISTINCT u.id) FILTER (WHERE r.name = 'peer_coach')   AS total_coaches,
         COUNT(DISTINCT u.id) FILTER (WHERE u.is_active = false)     AS inactive_users
       FROM users u
       LEFT JOIN user_roles ur ON ur.user_id = u.id
       LEFT JOIN roles r ON r.id = ur.role_id`
    );

    return {
      users: userStats[0],
      coaching: coaching[0] || null,
      counselling: counselling[0] || null,
      advising: advising[0] || null,
    };
  }

  async getUnitComparison(academicYearId) {
    const params = academicYearId ? [academicYearId] : [];
    const filter = academicYearId ? 'WHERE academic_year_id = $1' : '';
    const [c, cn, a] = await Promise.all([
      pool.query(`SELECT 'Coaching' AS unit, completion_rate FROM admin_coaching_summary ${filter}`, params),
      pool.query(`SELECT 'Counselling' AS unit, completion_rate FROM admin_counselling_summary ${filter}`, params),
      pool.query(`SELECT 'Advising' AS unit, completion_rate FROM admin_advising_summary ${filter}`, params),
    ]);
    return [...c.rows, ...cn.rows, ...a.rows];
  }

  async getCohortSpeed(academicYearId, unit = 'coaching') {
    const params = [];
    const conditions = [];
    let p = 1;

    if (academicYearId) { conditions.push(`academic_year_id = $${p++}`); params.push(academicYearId); }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    const { rows } = await pool.query(
      `SELECT class_year, total_freshers, completed_freshers, avg_days_to_complete
       FROM analytics_cohort_completion_speed
       ${where}
       ORDER BY class_year`,
      params
    );
    return rows;
  }

  async getMonthlySessions(academicYearId) {
    const params = academicYearId ? [academicYearId] : [];
    const where = academicYearId ? 'WHERE academic_year_id = $1' : '';
    const { rows } = await pool.query(
      `SELECT month, unit_name, total_sessions, completed_sessions
       FROM analytics_monthly_sessions
       ${where}
       ORDER BY month ASC`,
      params
    );
    return rows;
  }

  async getTopClubs() {
    const { rows } = await pool.query(
      `SELECT c.id, c.name, c.category,
              COUNT(cm.user_id) AS member_count
       FROM clubs c
       LEFT JOIN club_members cm ON cm.club_id = c.id
       WHERE c.is_active = true
       GROUP BY c.id
       ORDER BY member_count DESC
       LIMIT 10`
    );
    return rows;
  }

  /**
   * Export: CSV string built from the same aggregate views — never raw tables.
   */
  async buildExportData(academicYearId) {
    const [overview, cohort, monthly] = await Promise.all([
      this.getOverview(academicYearId),
      this.getCohortSpeed(academicYearId),
      this.getMonthlySessions(academicYearId),
    ]);
    return { overview, cohort, monthly };
  }
}

module.exports = new AdminAnalyticsRepository();
