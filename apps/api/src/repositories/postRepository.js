const { pool } = require("../services/db");

const findPosts = async (client, { userId, page = 1, limit = 50, category, authorId }) => {
  const offset = (page - 1) * limit;
  let queryParams = [];
  let paramIndex = 1;

  let whereClauses = [];

  // Visibility logic
  if (userId) {
    whereClauses.push(`(
      p.visibility = 'public'
      OR p.author_id = $${paramIndex}
      OR EXISTS (
        SELECT 1 FROM post_targets pt
        JOIN group_members gm ON gm.group_id = pt.target_id AND pt.target_type = 'group'
        WHERE pt.post_id = p.id AND gm.user_id = $${paramIndex}
      )
      OR EXISTS (
        SELECT 1 FROM post_targets pt
        JOIN coach_assignments ca ON ca.peer_coach_id = pt.target_id AND pt.target_type = 'coach'
        WHERE pt.post_id = p.id AND ca.fresher_id = $${paramIndex}
      )
    )`);
    queryParams.push(userId);
    paramIndex++;
  } else {
    whereClauses.push(`p.visibility = 'public'`);
  }

  if (category) {
    whereClauses.push(`p.category = $${paramIndex}`);
    queryParams.push(category);
    paramIndex++;
  }

  if (authorId) {
    whereClauses.push(`p.author_id = $${paramIndex}`);
    queryParams.push(authorId);
    paramIndex++;
  }

  const whereStr = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

  // Get total count for pagination
  const countQuery = `SELECT COUNT(*) FROM posts p ${whereStr}`;
  const countResult = await client.query(countQuery, queryParams);
  const total = parseInt(countResult.rows[0].count, 10);

  // My RSVP logic only if user is logged in
  let myRsvpSelect = `NULL as "myRsvp"`;
  if (userId) {
    myRsvpSelect = `(SELECT er2.status FROM event_rsvps er2 WHERE er2.event_id = e.id AND er2.user_id = $1)`;
  }

  // Get paginated data
  const dataQuery = `
    SELECT 
      p.id, p.title, p.content, p.category, p.visibility,
      p.created_at as "createdAt",
      u.id as "authorId", u.full_name as "authorName", u.avatar_url as "authorAvatar",
      e.id as "eventId", e.event_date as "eventDate", e.event_time as "eventTime",
      e.location as "eventLocation", e.organizer as "eventOrganizer",
      e.capacity as "eventCapacity", e.rsvp_enabled as "rsvpEnabled", e.status as "eventStatus",
      (SELECT COUNT(*)::int FROM event_rsvps er WHERE er.event_id = e.id AND er.status = 'going') as "goingCount",
      (
        SELECT string_agg(
          CASE 
            WHEN pt.target_type = 'coach' THEN 'My Assigned Students' 
            ELSE g.name 
          END, ', '
        ) 
        FROM post_targets pt
        LEFT JOIN groups g ON g.id = pt.target_id AND pt.target_type = 'group'
        WHERE pt.post_id = p.id
      ) as "targetGroupName",
      ${myRsvpSelect}
    FROM posts p
    JOIN users u ON u.id = p.author_id
    LEFT JOIN events e ON e.post_id = p.id
    ${whereStr}
    ORDER BY p.created_at DESC
    LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
  `;
  
  const dataParams = [...queryParams, limit, offset];
  const { rows } = await client.query(dataQuery, dataParams);

  return { rows, total };
};

const findPostById = async (client, postId) => {
  const { rows } = await client.query(`
    SELECT 
      p.id, p.title, p.content, p.category, p.visibility,
      p.created_at as "createdAt",
      u.id as "authorId", u.full_name as "authorName", u.avatar_url as "authorAvatar"
    FROM posts p
    JOIN users u ON u.id = p.author_id
    WHERE p.id = $1
  `, [postId]);
  return rows[0] || null;
};

const findPostAuthor = async (client, postId) => {
  const { rows } = await client.query('SELECT author_id FROM posts WHERE id = $1', [postId]);
  return rows[0] ? rows[0].author_id : null;
};

const insertPost = async (client, { authorId, title, content, category, visibility }) => {
  const { rows } = await client.query(`
    INSERT INTO posts (author_id, title, content, category, visibility)
    VALUES ($1, $2, $3, $4, $5)
    RETURNING id, title, content, category, visibility, created_at as "createdAt"
  `, [authorId, title, content, category, visibility]);
  return rows[0];
};

const insertPostTargets = async (client, postId, targetGroupIds, authorId) => {
  for (const groupId of targetGroupIds) {
    if (groupId === "assigned_students") {
      await client.query(
        `INSERT INTO post_targets (post_id, target_type, target_id)
         VALUES ($1, 'coach', $2) ON CONFLICT DO NOTHING`,
        [postId, authorId]
      );
    } else {
      await client.query(
        `INSERT INTO post_targets (post_id, target_type, target_id)
         VALUES ($1, 'group', $2) ON CONFLICT DO NOTHING`,
        [postId, groupId]
      );
    }
  }
};

const insertNotificationsForTargets = async (client, { title, category, postId, targetGroupIds, authorId }) => {
  const actualGroupIds = targetGroupIds.filter(id => id !== "assigned_students");
  if (actualGroupIds.length > 0) {
    await client.query(
      `INSERT INTO notifications (user_id, category, title, body, related_entity)
       SELECT DISTINCT gm.user_id, 'announcement', $1, $2, $3
       FROM group_members gm
       WHERE gm.group_id = ANY($4::uuid[])
         AND gm.user_id != $5`,
      [
        `New: ${title}`,
        `A new ${category} has been posted for your group. Tap to view.`,
        `post:${postId}`,
        actualGroupIds,
        authorId,
      ]
    );
  }

  if (targetGroupIds.includes("assigned_students")) {
    await client.query(
      `INSERT INTO notifications (user_id, category, title, body, related_entity)
       SELECT DISTINCT ca.fresher_id, 'announcement', $1, $2, $3
       FROM coach_assignments ca
       WHERE ca.peer_coach_id = $4`,
      [
        `New: ${title}`,
        `Your peer coach posted a new ${category}. Tap to view.`,
        `post:${postId}`,
        authorId,
      ]
    );
  }
};

const updatePost = async (client, postId, { title, content, category }) => {
  const { rows } = await client.query(`
    UPDATE posts
    SET 
      title = COALESCE($1, title), 
      content = COALESCE($2, content), 
      category = COALESCE($3, category), 
      updated_at = now()
    WHERE id = $4
    RETURNING id, title, content, category, created_at as "createdAt"
  `, [title, content, category, postId]);
  return rows[0];
};

const deletePost = async (client, postId) => {
  await client.query('DELETE FROM posts WHERE id = $1', [postId]);
};

module.exports = {
  findPosts,
  findPostById,
  findPostAuthor,
  insertPost,
  insertPostTargets,
  insertNotificationsForTargets,
  updatePost,
  deletePost
};
