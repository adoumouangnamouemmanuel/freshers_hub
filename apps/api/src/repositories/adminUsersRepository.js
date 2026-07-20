/**
 * Admin Users Repository
 * Handles all user management queries for the Platform Admin portal.
 */

const { pool } = require('../services/db');

class AdminUsersRepository {
  // ── List / Search ──────────────────────────────────────────────────────────

  async listUsers({ search = '', role = '', status = '', classYear = '', page = 1, pageSize = 20 } = {}) {
    const params = [];
    const conditions = [];
    let p = 1;

    if (search) {
      conditions.push(`(u.full_name ILIKE $${p} OR u.email ILIKE $${p})`);
      params.push(`%${search}%`);
      p++;
    }
    if (role) {
      conditions.push(`EXISTS (SELECT 1 FROM user_roles ur2 JOIN roles r2 ON ur2.role_id = r2.id WHERE ur2.user_id = u.id AND r2.name = $${p})`);
      params.push(role);
      p++;
    }
    if (status === 'active') {
      conditions.push(`u.is_active = true`);
    } else if (status === 'inactive') {
      conditions.push(`u.is_active = false`);
    }
    if (classYear) {
      conditions.push(`u.class_year = $${p}`);
      params.push(parseInt(classYear));
      p++;
    }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    const offset = (page - 1) * pageSize;

    const { rows } = await pool.query(
      `SELECT
         u.id, u.full_name, u.email, u.phone, u.avatar_url,
         u.country, u.major, u.class_year, u.is_active, u.created_at,
         COALESCE(ARRAY_AGG(DISTINCT r.name) FILTER (WHERE r.name IS NOT NULL), '{}') AS roles,
         COALESCE(ARRAY_AGG(DISTINCT un.name) FILTER (WHERE un.name IS NOT NULL), '{}') AS units
       FROM users u
       LEFT JOIN user_roles ur ON ur.user_id = u.id
       LEFT JOIN roles r ON r.id = ur.role_id
       LEFT JOIN units un ON un.id = ur.unit_id
       ${where}
       GROUP BY u.id
       ORDER BY u.full_name ASC
       LIMIT $${p} OFFSET $${p + 1}`,
      [...params, pageSize, offset]
    );

    const { rows: countRows } = await pool.query(
      `SELECT COUNT(DISTINCT u.id) AS total
       FROM users u
       LEFT JOIN user_roles ur ON ur.user_id = u.id
       LEFT JOIN roles r ON r.id = ur.role_id
       ${where}`,
      params
    );

    return { data: rows, total: parseInt(countRows[0].total), page, pageSize };
  }

  // ── Single User ────────────────────────────────────────────────────────────

  async getUserById(id) {
    const { rows } = await pool.query(
      `SELECT
         u.id, u.full_name, u.email, u.phone, u.avatar_url,
         u.country, u.major, u.class_year, u.is_active, u.created_at,
         sp.school_id, sp.graduation_year,
         COALESCE(ARRAY_AGG(DISTINCT r.name) FILTER (WHERE r.name IS NOT NULL), '{}') AS roles
       FROM users u
       LEFT JOIN student_profiles sp ON sp.user_id = u.id
       LEFT JOIN user_roles ur ON ur.user_id = u.id
       LEFT JOIN roles r ON r.id = ur.role_id
       WHERE u.id = $1
       GROUP BY u.id, sp.school_id, sp.graduation_year`,
      [id]
    );
    return rows[0] || null;
  }

  // ── Create User ────────────────────────────────────────────────────────────

  async createUser(fields) {
    const { email, full_name, phone, major, class_year, country, is_active, school_id } = fields;
    
    // Default is_active to true if not specified
    const active = is_active !== undefined ? is_active : true;

    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const { rows } = await client.query(
        `INSERT INTO users (email, full_name, phone, major, class_year, country, is_active)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING id, full_name, email, is_active`,
        [email, full_name, phone || null, major || null, class_year || null, country || null, active]
      );
      const user = rows[0];

      if (school_id) {
        await client.query(
          `INSERT INTO student_profiles (user_id, school_id, identifier, graduation_year)
           VALUES ($1, $2, $3, $4)`,
          [user.id, school_id, fields.email.split('@')[0], fields.class_year || 0]
        );
      }
      
      if (fields.role_id) {
        await client.query(
          `INSERT INTO user_roles (user_id, role_id)
           VALUES ($1, $2)
           ON CONFLICT DO NOTHING`,
          [user.id, fields.role_id]
        );
      }
      
      await client.query('COMMIT');
      return user;
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  // ── Update User ────────────────────────────────────────────────────────────

  async updateUser(id, fields) {
    const allowed = ['email', 'full_name', 'phone', 'major', 'class_year', 'country', 'is_active'];
    const sets = [];
    const params = [];
    let p = 1;

    for (const key of allowed) {
      if (fields[key] !== undefined) {
        sets.push(`${key} = $${p++}`);
        params.push(fields[key]);
      }
    }

    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      let user = null;
      
      if (sets.length > 0) {
        const queryParams = [...params, id];
        const { rows } = await client.query(
          `UPDATE users SET ${sets.join(', ')}, updated_at = now() WHERE id = $${p} RETURNING id, full_name, email, is_active`,
          queryParams
        );
        user = rows[0];
      } else {
        // If no user fields were updated, just fetch the user to return
        const { rows } = await client.query(`SELECT id, full_name, email, is_active FROM users WHERE id = $1`, [id]);
        user = rows[0];
      }

      if (fields.school_id !== undefined && user) {
        await client.query(
          `INSERT INTO student_profiles (user_id, school_id, identifier, graduation_year)
           VALUES ($1, $2, $3, $4)
           ON CONFLICT (user_id) DO UPDATE SET 
             school_id = EXCLUDED.school_id,
             identifier = EXCLUDED.identifier,
             graduation_year = EXCLUDED.graduation_year`,
          [id, fields.school_id || null, user.email.split('@')[0], user.class_year || 0]
        );
      }

      if (fields.role_id && user) {
        await client.query(
          `INSERT INTO user_roles (user_id, role_id)
           VALUES ($1, $2)
           ON CONFLICT DO NOTHING`,
          [id, fields.role_id]
        );
      }

      await client.query('COMMIT');
      return user || null;
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  // ── Deactivate ─────────────────────────────────────────────────────────────

  async deactivateUsers(ids) {
    const { rows } = await pool.query(
      `UPDATE users SET is_active = false, updated_at = now()
       WHERE id = ANY($1::uuid[])
       RETURNING id`,
      [ids]
    );
    return rows;
  }

  // ── Roles ──────────────────────────────────────────────────────────────────

  async listRoles() {
    const { rows } = await pool.query(`SELECT id, name FROM roles ORDER BY name`);
    return rows;
  }

  async assignRole(userId, roleId, unitId = null) {
    const { rows } = await pool.query(
      `INSERT INTO user_roles (user_id, role_id, unit_id)
       VALUES ($1, $2, $3)
       ON CONFLICT DO NOTHING
       RETURNING *`,
      [userId, roleId, unitId]
    );
    if (rows.length === 0) {
       // It conflicted, so just fetch the existing one to return
       const existing = await pool.query(
         `SELECT * FROM user_roles WHERE user_id = $1 AND role_id = $2 AND (unit_id = $3 OR (unit_id IS NULL AND $3 IS NULL))`,
         [userId, roleId, unitId]
       );
       return existing.rows[0];
    }
    return rows[0];
  }

  async removeRole(userId, roleId) {
    const { rows } = await pool.query(
      `DELETE FROM user_roles WHERE user_id = $1 AND role_id = $2 RETURNING *`,
      [userId, roleId]
    );
    return rows[0] || null;
  }

  async bulkAssignRole(userIds, roleId, unitId = null) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const results = [];
      for (const userId of userIds) {
        const { rows } = await client.query(
          `INSERT INTO user_roles (user_id, role_id, unit_id)
           VALUES ($1, $2, $3)
           ON CONFLICT DO NOTHING
           RETURNING *`,
          [userId, roleId, unitId]
        );
        if (rows.length > 0) {
          results.push(rows[0]);
        }
      }
      await client.query('COMMIT');
      return results;
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  // ── CSV Import ─────────────────────────────────────────────────────────────

  async importUsers(rows) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Fetch all roles for mapping
      const { rows: roleRows } = await client.query(`SELECT id, name FROM roles`);
      const roleMap = roleRows.reduce((acc, r) => {
        acc[r.name.toLowerCase()] = r.id;
        return acc;
      }, {});
      const studentRoleId = roleMap['student'];

      const results = { inserted: 0, updated: 0, errors: [] };

      for (let i = 0; i < rows.length; i++) {
        const { school_id, email, full_name, class_year, country, major, phone, role, is_active } = rows[i];
        const rowNum = i + 2; // +2 because row 1 is header

        // Validate required fields
        if (!school_id || !email || !full_name) {
          results.errors.push({ row: rowNum, school_id, reason: 'Missing required field: school_id, email, or full_name' });
          continue;
        }
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
          results.errors.push({ row: rowNum, school_id, reason: 'Invalid email format' });
          continue;
        }

        // Parse is_active
        let isActiveParsed = true;
        if (is_active !== undefined && is_active !== '') {
          const lower = is_active.toLowerCase();
          isActiveParsed = !(lower === 'false' || lower === '0' || lower === 'no');
        }

        try {
          const { rows: upserted } = await client.query(
            `INSERT INTO users (email, full_name, class_year, country, major, phone, is_active)
             VALUES ($1, $2, $3, $4, $5, $6, $7)
             ON CONFLICT (email) DO UPDATE
               SET full_name  = EXCLUDED.full_name,
                   class_year = COALESCE(EXCLUDED.class_year, users.class_year),
                   country    = COALESCE(EXCLUDED.country, users.country),
                   major      = COALESCE(EXCLUDED.major, users.major),
                   phone      = COALESCE(EXCLUDED.phone, users.phone),
                   is_active  = EXCLUDED.is_active,
                   updated_at = now()
             RETURNING id, (xmax = 0) AS is_insert`,
            [email, full_name, class_year || null, country || null, major || null, phone || null, isActiveParsed]
          );
          const user = upserted[0];

          // Upsert student_profiles keyed by school_id
          await client.query(
            `INSERT INTO student_profiles (user_id, school_id, identifier, graduation_year)
             VALUES ($1, $2, $3, $4)
             ON CONFLICT (user_id) DO UPDATE SET 
               school_id = EXCLUDED.school_id,
               identifier = EXCLUDED.identifier,
               graduation_year = EXCLUDED.graduation_year`,
            [user.id, school_id, email.split('@')[0], class_year || 0]
          );

          // Determine role to assign
          let roleIdToAssign = studentRoleId;
          if (role && roleMap[role.toLowerCase()]) {
            roleIdToAssign = roleMap[role.toLowerCase()];
          }

          // Auto-assign role if not already present
          if (roleIdToAssign) {
            await client.query(
              `INSERT INTO user_roles (user_id, role_id)
               VALUES ($1, $2)
               ON CONFLICT DO NOTHING`,
              [user.id, roleIdToAssign]
            );
          }

          if (user.is_insert) {
            results.inserted++;
          } else {
            results.updated++;
          }
        } catch (rowErr) {
          results.errors.push({ row: rowNum, school_id, reason: rowErr.message });
        }
      }

      await client.query('COMMIT');
      return results;
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }
}

module.exports = new AdminUsersRepository();
