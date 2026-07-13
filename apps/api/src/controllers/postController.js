const { pool } = require("../services/db");
const { verifyJwt } = require("../services/authService");

async function handleGetPosts(req, res) {
  const client = await pool.connect();
  try {
    const { rows } = await client.query(`
      SELECT 
        p.id, p.title, p.content, p.category, p.created_at as "createdAt",
        u.id as "authorId", u.full_name as "authorName", u.avatar_url as "authorAvatar"
      FROM posts p
      JOIN users u ON u.id = p.author_id
      ORDER BY p.created_at DESC
      LIMIT 50
    `);
    res.json({ posts: rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
}

async function handleCreatePost(req, res) {
  const authHeader = req.headers.authorization || "";
  const token = authHeader.replace(/^Bearer\s+/i, "");
  if (!token) {
    return res.status(401).json({ error: "Missing token" });
  }
  
  const payload = verifyJwt(token);
  if (!payload || !payload.roles) {
    return res.status(401).json({ error: "Invalid token" });
  }
  
  const allowedRoles = ["staff", "faculty", "student_leader", "admin", "club_lead"];
  const hasAccess = payload.roles.some(r => allowedRoles.includes(r));
  
  if (!hasAccess) {
    return res.status(403).json({ error: "Insufficient permissions to create post" });
  }
  
  const { title, content, category = "announcement" } = req.body || {};
  const cleanTitle = String(title || "").trim();
  const cleanContent = String(content || "").trim();
  const cleanCategory = String(category).trim();
  
  if (!cleanTitle || !cleanContent) {
    return res.status(400).json({ error: "Title and content are required" });
  }
  
  const client = await pool.connect();
  try {
    const { rows } = await client.query(`
      INSERT INTO posts (author_id, title, content, category)
      VALUES ($1, $2, $3, $4)
      RETURNING id, title, content, category, created_at as "createdAt"
    `, [payload.sub, cleanTitle, cleanContent, cleanCategory]);
    
    res.status(201).json({ post: rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
}

async function handleGetPostById(req, res) {
  const { id } = req.params;
  const client = await pool.connect();
  try {
    const { rows } = await client.query(`
      SELECT 
        p.id, p.title, p.content, p.category, p.created_at as "createdAt",
        u.id as "authorId", u.full_name as "authorName", u.avatar_url as "authorAvatar"
      FROM posts p
      JOIN users u ON u.id = p.author_id
      WHERE p.id = $1
    `, [id]);
    
    if (rows.length === 0) {
      return res.status(404).json({ error: "Post not found" });
    }
    res.json({ post: rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
}

async function handleUpdatePost(req, res) {
  const { id } = req.params;
  const authHeader = req.headers.authorization || "";
  const token = authHeader.replace(/^Bearer\s+/i, "");
  if (!token) return res.status(401).json({ error: "Missing token" });
  
  const payload = verifyJwt(token);
  if (!payload) return res.status(401).json({ error: "Invalid token" });

  const { title, content, category } = req.body || {};
  const cleanTitle = String(title || "").trim();
  const cleanContent = String(content || "").trim();
  const cleanCategory = String(category || "").trim();

  if (!cleanTitle || !cleanContent) {
    return res.status(400).json({ error: "Title and content are required" });
  }

  const client = await pool.connect();
  try {
    const { rows: postRows } = await client.query('SELECT author_id FROM posts WHERE id = $1', [id]);
    if (postRows.length === 0) return res.status(404).json({ error: "Post not found" });
    
    const isAuthor = postRows[0].author_id === payload.sub;
    const isAdmin = payload.roles && payload.roles.includes("admin");
    if (!isAuthor && !isAdmin) return res.status(403).json({ error: "Not authorized to edit this post" });

    const { rows } = await client.query(`
      UPDATE posts
      SET title = $1, content = $2, category = $3
      WHERE id = $4
      RETURNING id, title, content, category, created_at as "createdAt"
    `, [cleanTitle, cleanContent, cleanCategory, id]);

    res.json({ post: rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
}

async function handleDeletePost(req, res) {
  const { id } = req.params;
  const authHeader = req.headers.authorization || "";
  const token = authHeader.replace(/^Bearer\s+/i, "");
  if (!token) return res.status(401).json({ error: "Missing token" });
  
  const payload = verifyJwt(token);
  if (!payload) return res.status(401).json({ error: "Invalid token" });

  const client = await pool.connect();
  try {
    const { rows: postRows } = await client.query('SELECT author_id FROM posts WHERE id = $1', [id]);
    if (postRows.length === 0) return res.status(404).json({ error: "Post not found" });
    
    const isAuthor = postRows[0].author_id === payload.sub;
    const isAdmin = payload.roles && payload.roles.includes("admin");
    if (!isAuthor && !isAdmin) return res.status(403).json({ error: "Not authorized to delete this post" });

    await client.query('DELETE FROM posts WHERE id = $1', [id]);
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
}

module.exports = {
  handleGetPosts,
  handleGetPostById,
  handleCreatePost,
  handleUpdatePost,
  handleDeletePost,
};
