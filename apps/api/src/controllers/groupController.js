const AppError = require("../utils/AppError");
const asyncHandler = require("../utils/asyncHandler");
const { pool } = require("../services/db");

const handleGetGroups = asyncHandler(async (req, res) => {
  const client = await pool.connect();
  try {
    const { rows } = await client.query(`
      SELECT g.id, g.name, g.type, g.description, g.category, g.image_url,
        (SELECT COUNT(*)::int FROM group_members gm WHERE gm.group_id = g.id) as "memberCount"
      FROM groups g
      ORDER BY g.type, g.name
    `);
    res.json({ groups: rows });
  } finally {
    client.release();
  }
});

const handleGetMyGroups = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const client = await pool.connect();
  try {
    const { rows } = await client.query(`
      SELECT g.id, g.name, g.type, g.description, g.category, g.image_url, gm.is_leader as "isLeader",
        (SELECT COUNT(*)::int FROM group_members gm2 WHERE gm2.group_id = g.id) as "memberCount"
      FROM groups g
      JOIN group_members gm ON gm.group_id = g.id
      WHERE gm.user_id = $1
      ORDER BY g.type, g.name
    `, [userId]);
    res.json({ groups: rows });
  } finally {
    client.release();
  }
});

const handleGetGroupById = asyncHandler(async (req, res) => {
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
      throw new AppError("Group not found", 404);
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
  } finally {
    client.release();
  }
});

const handleJoinGroup = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { id } = req.params;
  const client = await pool.connect();
  try {
    // Check if group exists
    const { rows: groupRows } = await client.query('SELECT id FROM groups WHERE id = $1', [id]);
    if (groupRows.length === 0) {
      throw new AppError("Group not found", 404);
    }

    await client.query(`
      INSERT INTO group_members (group_id, user_id, is_leader) 
      VALUES ($1, $2, false)
      ON CONFLICT DO NOTHING
    `, [id, userId]);
    
    res.json({ success: true, message: "Successfully joined group" });
  } finally {
    client.release();
  }
});

const handleLeaveGroup = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { id } = req.params;
  const client = await pool.connect();
  try {
    await client.query(`
      DELETE FROM group_members 
      WHERE group_id = $1 AND user_id = $2
    `, [id, userId]);
    
    res.json({ success: true, message: "Successfully left group" });
  } finally {
    client.release();
  }
});

const handleUpdateGroup = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { id } = req.params;
  const { name, description, category, image_url } = req.body;
  const client = await pool.connect();
  try {
    // Check if user is leader
    const { rows: memberRows } = await client.query(`
      SELECT is_leader FROM group_members 
      WHERE group_id = $1 AND user_id = $2
    `, [id, userId]);

    if (memberRows.length === 0 || !memberRows[0].is_leader) {
      throw new AppError("Only group leaders can update group info", 403);
    }

    const { rows } = await client.query(`
      UPDATE groups 
      SET name = COALESCE($1, name), 
          description = COALESCE($2, description), 
          category = COALESCE($3, category), 
          image_url = COALESCE($4, image_url)
      WHERE id = $5
      RETURNING *
    `, [name, description, category, image_url, id]);

    res.json({ group: rows[0] });
  } finally {
    client.release();
  }
});

const handleGetGroupPosts = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const client = await pool.connect();
  try {
    const { rows } = await client.query(`
      SELECT 
        p.id, p.title, p.content, p.category, p.visibility,
        p.created_at as "createdAt",
        u.id as "authorId", u.full_name as "authorName", u.avatar_url as "authorAvatar",
        e.id as "eventId", e.event_date as "eventDate", e.event_time as "eventTime",
        e.location as "eventLocation", e.organizer as "eventOrganizer",
        e.capacity as "eventCapacity", e.rsvp_enabled as "rsvpEnabled", e.status as "eventStatus",
        (SELECT COUNT(*)::int FROM event_rsvps er WHERE er.event_id = e.id AND er.status = 'going') as "goingCount"
      FROM posts p
      JOIN users u ON u.id = p.author_id
      JOIN post_targets pt ON pt.post_id = p.id
      LEFT JOIN events e ON e.post_id = p.id
      WHERE pt.target_type = 'group' AND pt.target_id = $1
      ORDER BY p.created_at DESC
    `, [id]);
    
    res.json({ posts: rows });
  } finally {
    client.release();
  }
});

const handleGetMyGroupsPosts = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const client = await pool.connect();
  try {
    const { rows } = await client.query(`
      SELECT 
        p.id, p.title, p.content, p.category, p.visibility,
        p.created_at as "createdAt",
        u.id as "authorId", u.full_name as "authorName", u.avatar_url as "authorAvatar",
        e.id as "eventId", e.event_date as "eventDate", e.event_time as "eventTime",
        e.location as "eventLocation", e.organizer as "eventOrganizer",
        e.capacity as "eventCapacity", e.rsvp_enabled as "rsvpEnabled", e.status as "eventStatus",
        (SELECT COUNT(*)::int FROM event_rsvps er WHERE er.event_id = e.id AND er.status = 'going') as "goingCount",
        g.name as "groupName"
      FROM posts p
      JOIN users u ON u.id = p.author_id
      JOIN post_targets pt ON pt.post_id = p.id
      JOIN groups g ON g.id = pt.target_id
      JOIN group_members gm ON gm.group_id = g.id
      LEFT JOIN events e ON e.post_id = p.id
      WHERE pt.target_type = 'group' AND gm.user_id = $1
      ORDER BY p.created_at DESC
    `, [userId]);
    
    res.json({ posts: rows });
  } finally {
    client.release();
  }
});

module.exports = { 
  handleGetGroups, 
  handleGetMyGroups, 
  handleGetGroupById, 
  handleJoinGroup, 
  handleLeaveGroup,
  handleUpdateGroup,
  handleGetGroupPosts,
  handleGetMyGroupsPosts
};
