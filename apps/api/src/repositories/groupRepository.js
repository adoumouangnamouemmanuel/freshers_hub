const { pool } = require("../services/db");

const getGroups = async (filters, page, limit) => {
  const offset = (page - 1) * limit;
  const values = [];
  let query = `
    SELECT g.id, g.name, g.type, g.description, g.category, g.image_url, g.cover_image, g.created_at, g.updated_at,
      (SELECT COUNT(*)::int FROM group_members gm WHERE gm.group_id = g.id) as "memberCount"
    FROM groups g
  `;
  const conditions = [];

  if (filters.category) {
    values.push(filters.category);
    conditions.push(`g.category = $${values.length}`);
  }
  
  if (filters.type) {
    values.push(filters.type);
    conditions.push(`g.type = $${values.length}`);
  }

  if (filters.q) {
    values.push(`%${filters.q}%`);
    conditions.push(`(g.name ILIKE $${values.length} OR g.description ILIKE $${values.length})`);
  }

  if (conditions.length > 0) {
    query += ` WHERE ` + conditions.join(" AND ");
  }

  query += ` ORDER BY g.type, g.name LIMIT $${values.length + 1} OFFSET $${values.length + 2}`;
  
  let countQuery = `SELECT COUNT(*) FROM groups g`;
  if (conditions.length > 0) {
    countQuery += ` WHERE ` + conditions.join(" AND ");
  }

  const [data, countRes] = await Promise.all([
    pool.query(query, [...values, limit, offset]),
    pool.query(countQuery, values),
  ]);

  return {
    groups: data.rows,
    total: parseInt(countRes.rows[0].count, 10),
  };
};

const getMyGroups = async (userId, filters, page, limit) => {
  const offset = (page - 1) * limit;
  const values = [userId];
  let query = `
    SELECT g.id, g.name, g.type, g.description, g.category, g.image_url, g.cover_image, g.created_at, g.updated_at, gm.is_leader as "isLeader",
      (SELECT COUNT(*)::int FROM group_members gm2 WHERE gm2.group_id = g.id) as "memberCount"
    FROM groups g
    JOIN group_members gm ON gm.group_id = g.id
    WHERE gm.user_id = $1
  `;
  const conditions = [];

  if (filters.category) {
    values.push(filters.category);
    conditions.push(`g.category = $${values.length}`);
  }
  
  if (filters.type) {
    values.push(filters.type);
    conditions.push(`g.type = $${values.length}`);
  }

  if (filters.q) {
    values.push(`%${filters.q}%`);
    conditions.push(`(g.name ILIKE $${values.length} OR g.description ILIKE $${values.length})`);
  }

  if (conditions.length > 0) {
    query += ` AND ` + conditions.join(" AND ");
  }

  query += ` ORDER BY g.type, g.name LIMIT $${values.length + 1} OFFSET $${values.length + 2}`;
  
  let countQuery = `
    SELECT COUNT(*) FROM groups g 
    JOIN group_members gm ON gm.group_id = g.id 
    WHERE gm.user_id = $1
  `;
  if (conditions.length > 0) {
    countQuery += ` AND ` + conditions.join(" AND ");
  }

  const [data, countRes] = await Promise.all([
    pool.query(query, [...values, limit, offset]),
    pool.query(countQuery, values),
  ]);

  return {
    groups: data.rows,
    total: parseInt(countRes.rows[0].count, 10),
  };
};

const getGroupById = async (id) => {
  const { rows } = await pool.query(`
    SELECT g.id, g.name, g.type, g.description, g.category, g.image_url, g.cover_image, g.created_at, g.updated_at,
      (SELECT COUNT(*)::int FROM group_members gm WHERE gm.group_id = g.id) as "memberCount"
    FROM groups g
    WHERE g.id = $1
  `, [id]);
  return rows[0] || null;
};

const getGroupMembers = async (id) => {
  const { rows } = await pool.query(`
    SELECT u.id, u.full_name, u.avatar_url, gm.is_leader
    FROM group_members gm
    JOIN users u ON gm.user_id = u.id
    WHERE gm.group_id = $1
    ORDER BY gm.is_leader DESC, u.full_name ASC
  `, [id]);
  return rows;
};

const createGroup = async (groupData, creatorId) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const { rows } = await client.query(`
      INSERT INTO groups (name, type, description, category, cover_image, image_url)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `, [
      groupData.name,
      groupData.type,
      groupData.description || null,
      groupData.category || null,
      groupData.cover_image || null,
      groupData.image_url || null
    ]);

    const newGroup = rows[0];

    // Add creator as leader
    await client.query(`
      INSERT INTO group_members (group_id, user_id, is_leader) 
      VALUES ($1, $2, true)
    `, [newGroup.id, creatorId]);

    await client.query('COMMIT');
    return newGroup;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

const updateGroup = async (id, groupData) => {
  const { rows } = await pool.query(`
    UPDATE groups 
    SET name = COALESCE($1, name), 
        type = COALESCE($2, type),
        description = COALESCE($3, description), 
        category = COALESCE($4, category), 
        cover_image = COALESCE($5, cover_image),
        image_url = COALESCE($6, image_url),
        updated_at = NOW()
    WHERE id = $7
    RETURNING *
  `, [
    groupData.name, 
    groupData.type, 
    groupData.description, 
    groupData.category, 
    groupData.cover_image,
    groupData.image_url, 
    id
  ]);
  return rows[0] || null;
};

const deleteGroup = async (id) => {
  const { rowCount } = await pool.query(`DELETE FROM groups WHERE id = $1`, [id]);
  return rowCount > 0;
};

const checkGroupMembership = async (groupId, userId) => {
  const { rows } = await pool.query(`
    SELECT is_leader FROM group_members 
    WHERE group_id = $1 AND user_id = $2
  `, [groupId, userId]);
  return rows[0] || null;
};

const joinGroup = async (groupId, userId) => {
  const { rowCount } = await pool.query(`
    INSERT INTO group_members (group_id, user_id, is_leader) 
    VALUES ($1, $2, false)
    ON CONFLICT DO NOTHING
  `, [groupId, userId]);
  return rowCount > 0;
};

const leaveGroup = async (groupId, userId) => {
  const { rowCount } = await pool.query(`
    DELETE FROM group_members 
    WHERE group_id = $1 AND user_id = $2
  `, [groupId, userId]);
  return rowCount > 0;
};

const getGroupPosts = async (groupId, page, limit) => {
  const offset = (page - 1) * limit;
  const { rows } = await pool.query(`
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
    LIMIT $2 OFFSET $3
  `, [groupId, limit, offset]);

  // For total count
  const count = await pool.query(`
    SELECT COUNT(*) 
    FROM posts p
    JOIN post_targets pt ON pt.post_id = p.id
    WHERE pt.target_type = 'group' AND pt.target_id = $1
  `, [groupId]);

  return {
    posts: rows,
    total: parseInt(count.rows[0].count, 10)
  };
};

const getMyGroupsPosts = async (userId, page, limit) => {
  const offset = (page - 1) * limit;
  const { rows } = await pool.query(`
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
    LIMIT $2 OFFSET $3
  `, [userId, limit, offset]);

  const count = await pool.query(`
    SELECT COUNT(*)
    FROM posts p
    JOIN post_targets pt ON pt.post_id = p.id
    JOIN group_members gm ON gm.group_id = pt.target_id
    WHERE pt.target_type = 'group' AND gm.user_id = $1
  `, [userId]);

  return {
    posts: rows,
    total: parseInt(count.rows[0].count, 10)
  };
};

module.exports = {
  getGroups,
  getMyGroups,
  getGroupById,
  getGroupMembers,
  createGroup,
  updateGroup,
  deleteGroup,
  checkGroupMembership,
  joinGroup,
  leaveGroup,
  getGroupPosts,
  getMyGroupsPosts,
};
