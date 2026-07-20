const { pool } = require('../services/db');

class AdminAcademicYearsRepository {
  async list() {
    const { rows } = await pool.query(
      `SELECT id, label, start_date, end_date, is_current, created_at
       FROM academic_years
       ORDER BY start_date DESC`
    );
    return rows;
  }

  async create(label, startDate, endDate) {
    const { rows } = await pool.query(
      `INSERT INTO academic_years (label, start_date, end_date, is_current)
       VALUES ($1, $2, $3, false)
       RETURNING *`,
      [label, startDate, endDate]
    );
    return rows[0];
  }

  async getById(id) {
    const { rows } = await pool.query(
      `SELECT * FROM academic_years WHERE id = $1`,
      [id]
    );
    return rows[0] || null;
  }

  /**
   * Activates a new academic year.
   * Transactional: deactivates the currently active year, activates the new one.
   * Historical rows (sessions, assignments) are NOT touched — they remain scoped
   * to their own academic_year_id forever.
   */
  async activate(id) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Deactivate current year
      await client.query(
        `UPDATE academic_years SET is_current = false WHERE is_current = true`
      );

      // Activate new year
      const { rows } = await client.query(
        `UPDATE academic_years SET is_current = true WHERE id = $1 RETURNING *`,
        [id]
      );

      if (rows.length === 0) {
        await client.query('ROLLBACK');
        return null;
      }

      await client.query('COMMIT');
      return rows[0];
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  async getCurrent() {
    const { rows } = await pool.query(
      `SELECT * FROM academic_years WHERE is_current = true LIMIT 1`
    );
    return rows[0] || null;
  }
}

module.exports = new AdminAcademicYearsRepository();
