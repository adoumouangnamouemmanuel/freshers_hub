const { pool } = require("../services/db");

async function handleGetGroups(req, res) {
  const client = await pool.connect();
  try {
    const { rows } = await client.query(`
      SELECT g.id, g.name, g.type,
        (SELECT COUNT(*)::int FROM group_members gm WHERE gm.group_id = g.id) as "memberCount"
      FROM groups g
      ORDER BY g.type, g.name
    `);
    res.json({ groups: rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
}

async function handleGetMyGroups(req, res) {
  const userId = req.user.id;
  const client = await pool.connect();
  try {
    const { rows } = await client.query(`
      SELECT g.id, g.name, g.type,
        (SELECT COUNT(*)::int FROM group_members gm WHERE gm.group_id = g.id) as "memberCount"
      FROM groups g
      JOIN group_members gm ON gm.group_id = g.id
      WHERE gm.user_id = $1
      ORDER BY g.type, g.name
    `, [userId]);
    res.json({ groups: rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
}

module.exports = { handleGetGroups, handleGetMyGroups };
