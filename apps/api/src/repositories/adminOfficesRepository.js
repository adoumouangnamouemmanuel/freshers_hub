const { pool } = require('../services/db');

class AdminOfficesRepository {
  async list() {
    const { rows } = await pool.query(
      `SELECT
         o.id, o.name, o.description, o.contact_email, o.contact_phone,
         o.location, o.is_active, o.created_at,
         COALESCE(
           JSON_AGG(DISTINCT JSONB_BUILD_OBJECT('id', os.id, 'user_id', os.user_id, 'title', os.title, 'name', u.full_name))
           FILTER (WHERE os.id IS NOT NULL), '[]'
         ) AS staff,
         COALESCE(
           JSON_AGG(DISTINCT JSONB_BUILD_OBJECT('id', ol.id, 'label', ol.label, 'url', ol.url))
           FILTER (WHERE ol.id IS NOT NULL), '[]'
         ) AS links
       FROM offices o
       LEFT JOIN office_staff os ON os.office_id = o.id
       LEFT JOIN users u ON u.id = os.user_id
       LEFT JOIN office_links ol ON ol.office_id = o.id
       GROUP BY o.id
       ORDER BY o.name`
    );
    return rows;
  }

  async getById(id) {
    const { rows } = await pool.query(
      `SELECT
         o.id, o.name, o.description, o.contact_email, o.contact_phone,
         o.location, o.is_active, o.created_at,
         COALESCE(
           JSON_AGG(DISTINCT JSONB_BUILD_OBJECT('id', os.id, 'user_id', os.user_id, 'title', os.title, 'name', u.full_name))
           FILTER (WHERE os.id IS NOT NULL), '[]'
         ) AS staff,
         COALESCE(
           JSON_AGG(DISTINCT JSONB_BUILD_OBJECT('id', ol.id, 'label', ol.label, 'url', ol.url))
           FILTER (WHERE ol.id IS NOT NULL), '[]'
         ) AS links
       FROM offices o
       LEFT JOIN office_staff os ON os.office_id = o.id
       LEFT JOIN users u ON u.id = os.user_id
       LEFT JOIN office_links ol ON ol.office_id = o.id
       WHERE o.id = $1
       GROUP BY o.id`,
      [id]
    );
    return rows[0] || null;
  }

  async create({ name, description, contactEmail, contactPhone, location }) {
    const { rows } = await pool.query(
      `INSERT INTO offices (name, description, contact_email, contact_phone, location)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [name, description || null, contactEmail || null, contactPhone || null, location || null]
    );
    return rows[0];
  }

  async update(id, fields) {
    const allowed = {
      name: 'name', description: 'description',
      contactEmail: 'contact_email', contactPhone: 'contact_phone',
      location: 'location', is_active: 'is_active'
    };
    const sets = [];
    const params = [];
    let p = 1;

    for (const [jsKey, dbCol] of Object.entries(allowed)) {
      if (fields[jsKey] !== undefined) {
        sets.push(`${dbCol} = $${p++}`);
        params.push(fields[jsKey]);
      }
    }
    if (sets.length === 0) return null;

    params.push(id);
    const { rows } = await pool.query(
      `UPDATE offices SET ${sets.join(', ')}, updated_at = now() WHERE id = $${p} RETURNING *`,
      params
    );
    return rows[0] || null;
  }

  async addStaff(officeId, userId, title) {
    const { rows } = await pool.query(
      `INSERT INTO office_staff (office_id, user_id, title)
       VALUES ($1, $2, $3)
       ON CONFLICT (office_id, user_id) DO UPDATE SET title = EXCLUDED.title
       RETURNING *`,
      [officeId, userId, title || null]
    );
    return rows[0];
  }

  async removeStaff(officeId, userId) {
    const { rows } = await pool.query(
      `DELETE FROM office_staff WHERE office_id = $1 AND user_id = $2 RETURNING *`,
      [officeId, userId]
    );
    return rows[0] || null;
  }

  async addLink(officeId, label, url) {
    const { rows } = await pool.query(
      `INSERT INTO office_links (office_id, label, url) VALUES ($1, $2, $3) RETURNING *`,
      [officeId, label, url]
    );
    return rows[0];
  }

  async removeLink(linkId, officeId) {
    const { rows } = await pool.query(
      `DELETE FROM office_links WHERE id = $1 AND office_id = $2 RETURNING *`,
      [linkId, officeId]
    );
    return rows[0] || null;
  }
}

module.exports = new AdminOfficesRepository();
