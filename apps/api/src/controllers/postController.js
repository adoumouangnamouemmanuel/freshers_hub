const { pool } = require("../services/db");
const { verifyJwt } = require("../services/authService");
const AppError = require("../utils/AppError");
const asyncHandler = require("../utils/asyncHandler");

const handleGetPosts = asyncHandler(async (req, res) => {
  let userId = null;
  const authHeader = req.headers.authorization || "";
  const token = authHeader.replace(/^Bearer\s+/i, "");
  if (token) {
    const payload = verifyJwt(token);
    if (payload) userId = payload.sub;
  }

  const client = await pool.connect();
  try {
    let query;
    let params;

    if (userId) {
      query = `
        SELECT 
          p.id, p.title, p.content, p.category, p.visibility,
          p.created_at as "createdAt",
          u.id as "authorId", u.full_name as "authorName", u.avatar_url as "authorAvatar",
          e.id as "eventId", e.event_date as "eventDate", e.event_time as "eventTime",
          e.location as "eventLocation", e.organizer as "eventOrganizer",
          e.capacity as "eventCapacity", e.rsvp_enabled as "rsvpEnabled", e.status as "eventStatus",
          (SELECT COUNT(*)::int FROM event_rsvps er WHERE er.event_id = e.id AND er.status = 'going') as "goingCount",
          (SELECT er2.status FROM event_rsvps er2 WHERE er2.event_id = e.id AND er2.user_id = $1) as "myRsvp"
        FROM posts p
        JOIN users u ON u.id = p.author_id
        LEFT JOIN events e ON e.post_id = p.id
        WHERE (
          p.visibility = 'public'
          OR p.author_id = $1
          OR EXISTS (
            SELECT 1 FROM post_targets pt
            JOIN group_members gm ON gm.group_id = pt.target_id AND pt.target_type = 'group'
            WHERE pt.post_id = p.id AND gm.user_id = $1
          )
        )
        ORDER BY p.created_at DESC
        LIMIT 50
      `;
      params = [userId];
    } else {
      query = `
        SELECT 
          p.id, p.title, p.content, p.category, p.visibility,
          p.created_at as "createdAt",
          u.id as "authorId", u.full_name as "authorName", u.avatar_url as "authorAvatar",
          e.id as "eventId", e.event_date as "eventDate", e.event_time as "eventTime",
          e.location as "eventLocation", e.organizer as "eventOrganizer",
          e.capacity as "eventCapacity", e.rsvp_enabled as "rsvpEnabled", e.status as "eventStatus",
          (SELECT COUNT(*)::int FROM event_rsvps er WHERE er.event_id = e.id AND er.status = 'going') as "goingCount",
          NULL as "myRsvp"
        FROM posts p
        JOIN users u ON u.id = p.author_id
        LEFT JOIN events e ON e.post_id = p.id
        WHERE p.visibility = 'public'
        ORDER BY p.created_at DESC
        LIMIT 50
      `;
      params = [];
    }

    const { rows } = await client.query(query, params);
    res.json({ posts: rows });
  } finally {
    client.release();
  }
});

const handleCreatePost = asyncHandler(async (req, res) => {
  const authHeader = req.headers.authorization || "";
  const token = authHeader.replace(/^Bearer\s+/i, "");
  if (!token) {
    throw new AppError("Missing token", 401);
  }
  
  const payload = verifyJwt(token);
  if (!payload || !payload.roles) {
    throw new AppError("Invalid token", 401);
  }
  
  const allowedRoles = ["staff", "faculty", "student_leader", "admin", "club_lead"];
  const hasAccess = payload.roles.some(r => allowedRoles.includes(r));
  
  if (!hasAccess) {
    throw new AppError("Insufficient permissions to create post", 403);
  }
  
  const {
    title,
    content,
    category = "announcement",
    visibility = "public",
    targetGroupIds = [],
  } = req.body || {};

  const cleanTitle = String(title || "").trim();
  const cleanContent = String(content || "").trim();
  const cleanCategory = String(category).trim();
  
  if (!cleanTitle || !cleanContent) {
    throw new AppError("Title and content are required", 400);
  }
  
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const { rows } = await client.query(`
      INSERT INTO posts (author_id, title, content, category, visibility)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id, title, content, category, visibility, created_at as "createdAt"
    `, [payload.sub, cleanTitle, cleanContent, cleanCategory, visibility]);
    
    const post = rows[0];

    // Insert post targets if targeted
    if (visibility === "targeted" && targetGroupIds.length > 0) {
      for (const groupId of targetGroupIds) {
        await client.query(
          `INSERT INTO post_targets (post_id, target_type, target_id)
           VALUES ($1, 'group', $2) ON CONFLICT DO NOTHING`,
          [post.id, groupId]
        );
      }

      // Create notifications for targeted group members
      await client.query(
        `INSERT INTO notifications (user_id, category, title, body, related_entity)
         SELECT DISTINCT gm.user_id, 'announcement', $1, $2, $3
         FROM group_members gm
         WHERE gm.group_id = ANY($4::uuid[])
           AND gm.user_id != $5`,
        [
          `New: ${cleanTitle}`,
          `A new ${cleanCategory} has been posted for your group. Tap to view.`,
          `post:${post.id}`,
          targetGroupIds,
          payload.sub,
        ]
      );
    }

    await client.query("COMMIT");
    res.status(201).json({ post });
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
});

const handleGetPostById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const client = await pool.connect();
  try {
    const { rows } = await client.query(`
      SELECT 
        p.id, p.title, p.content, p.category, p.visibility,
        p.created_at as "createdAt",
        u.id as "authorId", u.full_name as "authorName", u.avatar_url as "authorAvatar"
      FROM posts p
      JOIN users u ON u.id = p.author_id
      WHERE p.id = $1
    `, [id]);
    
    if (rows.length === 0) {
      throw new AppError("Post not found", 404);
    }
    res.json({ post: rows[0] });
  } finally {
    client.release();
  }
});

const handleUpdatePost = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const authHeader = req.headers.authorization || "";
  const token = authHeader.replace(/^Bearer\s+/i, "");
  if (!token) throw new AppError("Missing token", 401);
  
  const payload = verifyJwt(token);
  if (!payload) throw new AppError("Invalid token", 401);

  const { title, content, category } = req.body || {};
  const cleanTitle = String(title || "").trim();
  const cleanContent = String(content || "").trim();
  const cleanCategory = String(category || "").trim();

  if (!cleanTitle || !cleanContent) {
    throw new AppError("Title and content are required", 400);
  }

  const client = await pool.connect();
  try {
    const { rows: postRows } = await client.query('SELECT author_id FROM posts WHERE id = $1', [id]);
    if (postRows.length === 0) throw new AppError("Post not found", 404);
    
    const isAuthor = postRows[0].author_id === payload.sub;
    const isAdmin = payload.roles && payload.roles.includes("admin");
    if (!isAuthor && !isAdmin) throw new AppError("Not authorized to edit this post", 403);

    const { rows } = await client.query(`
      UPDATE posts
      SET title = $1, content = $2, category = $3
      WHERE id = $4
      RETURNING id, title, content, category, created_at as "createdAt"
    `, [cleanTitle, cleanContent, cleanCategory, id]);

    res.json({ post: rows[0] });
  } finally {
    client.release();
  }
});

const handleDeletePost = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const authHeader = req.headers.authorization || "";
  const token = authHeader.replace(/^Bearer\s+/i, "");
  if (!token) throw new AppError("Missing token", 401);
  
  const payload = verifyJwt(token);
  if (!payload) throw new AppError("Invalid token", 401);

  const client = await pool.connect();
  try {
    const { rows: postRows } = await client.query('SELECT author_id FROM posts WHERE id = $1', [id]);
    if (postRows.length === 0) throw new AppError("Post not found", 404);
    
    const isAuthor = postRows[0].author_id === payload.sub;
    const isAdmin = payload.roles && payload.roles.includes("admin");
    if (!isAuthor && !isAdmin) throw new AppError("Not authorized to delete this post", 403);

    await client.query('DELETE FROM posts WHERE id = $1', [id]);
    res.json({ success: true });
  } finally {
    client.release();
  }
});

module.exports = {
  handleGetPosts,
  handleGetPostById,
  handleCreatePost,
  handleUpdatePost,
  handleDeletePost,
};
