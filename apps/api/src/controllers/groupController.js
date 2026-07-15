const { pool } = require("../services/db");

async function handleGetGroups(req, res) {
  const client = await pool.connect();
  try {
    const { rows } = await client.query(`
      SELECT g.id, g.name, g.type, g.description, g.category, g.image_url,
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
      SELECT g.id, g.name, g.type, g.description, g.category, g.image_url,
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

async function handleGetGroupById(req, res) {
  const { id } = req.params;
  const client = await pool.connect();
  try {
    const { rows: groupRows } = await client.query(`
      SELECT g.id, g.name, g.type, g.description, g.category, g.image_url,
        (SELECT COUNT(*)::int FROM group_members gm WHERE gm.group_id = g.id) as "memberCount"
      FROM groups g
      WHERE g.id = $1
    `, [id]);

    if (groupRows.length === 0) {
      return res.status(404).json({ error: "Group not found" });
    }

    const { rows: memberRows } = await client.query(`
      SELECT u.id, u.full_name, u.avatar_url, gm.is_leader
      FROM group_members gm
      JOIN users u ON gm.user_id = u.id
      WHERE gm.group_id = $1
      ORDER BY gm.is_leader DESC, u.full_name ASC
    `, [id]);

    const group = groupRows[0];
    group.members = memberRows;
    group.leaders = memberRows.filter(m => m.is_leader);

    res.json({ group });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
}

module.exports = { handleGetGroups, handleGetMyGroups, handleGetGroupById };
