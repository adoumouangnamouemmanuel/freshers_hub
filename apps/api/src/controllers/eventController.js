const AppError = require("../utils/AppError");
const asyncHandler = require("../utils/asyncHandler");
const { pool } = require("../services/db");

/**
 * POST /events
 * Creates a post + event in one transaction.
 * Body: { title, content, eventDate, eventTime, location, organizer, dressCode, capacity, rsvpEnabled, visibility, targetGroupIds }
 */
const handleCreateEvent = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const {
    title,
    content,
    eventDate,
    eventTime,
    location,
    organizer,
    dressCode,
    capacity,
    rsvpEnabled = true,
    visibility = "public",
    targetGroupIds = [],
  } = req.body || {};

  if (!title?.trim() || !content?.trim() || !eventDate || !eventTime) {
    throw new AppError("title, content, eventDate, and eventTime are required", 400);
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    // 1. Create the post
    const { rows: postRows } = await client.query(
      `INSERT INTO posts (author_id, title, content, category, visibility)
       VALUES ($1, $2, $3, 'event', $4)
       RETURNING id, title, content, category, visibility, created_at as "createdAt"`,
      [userId, title.trim(), content.trim(), visibility]
    );
    const post = postRows[0];

    // 2. Create post_targets if targeted
    if (visibility === "targeted" && targetGroupIds.length > 0) {
      for (const groupId of targetGroupIds) {
        await client.query(
          `INSERT INTO post_targets (post_id, target_type, target_id)
           VALUES ($1, 'group', $2)
           ON CONFLICT DO NOTHING`,
          [post.id, groupId]
        );
      }
    }

    // 3. Create the event
    const { rows: eventRows } = await client.query(
      `INSERT INTO events (post_id, event_date, event_time, location, organizer, dress_code, capacity, rsvp_enabled)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING id, post_id as "postId", event_date as "eventDate", event_time as "eventTime",
                 location, organizer, dress_code as "dressCode", capacity, rsvp_enabled as "rsvpEnabled", status`,
      [post.id, eventDate, eventTime, location || null, organizer || null, dressCode || null, capacity || null, rsvpEnabled]
    );
    const event = eventRows[0];

    // 4. Create notifications for target group members
    if (visibility === "targeted" && targetGroupIds.length > 0) {
      await client.query(
        `INSERT INTO notifications (user_id, category, title, body, related_entity)
         SELECT DISTINCT gm.user_id, 'event', $1, $2, $3
         FROM group_members gm
         WHERE gm.group_id = ANY($4::uuid[])
           AND gm.user_id != $5`,
        [
          `New Event: ${title.trim()}`,
          `You've been invited to "${title.trim()}". Tap to view details and RSVP.`,
          `event:${event.id}`,
          targetGroupIds,
          userId,
        ]
      );
    }

    await client.query("COMMIT");

    res.status(201).json({ post, event });
  } finally {
    client.release();
  }
});

/**
 * GET /events
 * Returns upcoming events visible to the authenticated user.
 */
const handleGetEvents = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const client = await pool.connect();
  try {
    const { rows } = await client.query(
      `SELECT 
         e.id, e.post_id as "postId", e.event_date as "eventDate", e.event_time as "eventTime",
         e.location, e.organizer, e.dress_code as "dressCode", e.capacity,
         e.rsvp_enabled as "rsvpEnabled", e.status,
         p.title, p.content, p.visibility, p.created_at as "createdAt",
         u.full_name as "authorName", u.id as "authorId",
         (SELECT COUNT(*)::int FROM event_rsvps er WHERE er.event_id = e.id AND er.status = 'going') as "goingCount",
         (SELECT er2.status FROM event_rsvps er2 WHERE er2.event_id = e.id AND er2.user_id = $1) as "myRsvp"
       FROM events e
       JOIN posts p ON p.id = e.post_id
       JOIN users u ON u.id = p.author_id
       WHERE e.status = 'scheduled'
         AND e.event_date >= CURRENT_DATE
         AND (
           p.visibility = 'public'
           OR EXISTS (
             SELECT 1 FROM post_targets pt
             JOIN group_members gm ON gm.group_id = pt.target_id AND pt.target_type = 'group'
             WHERE pt.post_id = p.id AND gm.user_id = $1
           )
           OR p.author_id = $1
         )
       ORDER BY e.event_date ASC, e.event_time ASC
       LIMIT 50`,
      [userId]
    );
    res.json({ events: rows });
  } finally {
    client.release();
  }
});

/**
 * GET /events/:id
 * Returns a single event with RSVP details.
 */
const handleGetEventById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;
  const client = await pool.connect();
  try {
    const { rows } = await client.query(
      `SELECT 
         e.id, e.post_id as "postId", e.event_date as "eventDate", e.event_time as "eventTime",
         e.location, e.organizer, e.dress_code as "dressCode", e.capacity,
         e.rsvp_enabled as "rsvpEnabled", e.status,
         p.title, p.content, p.visibility, p.created_at as "createdAt",
         u.full_name as "authorName", u.id as "authorId", u.avatar_url as "authorAvatar",
         (SELECT COUNT(*)::int FROM event_rsvps er WHERE er.event_id = e.id AND er.status = 'going') as "goingCount",
         (SELECT COUNT(*)::int FROM event_rsvps er WHERE er.event_id = e.id AND er.status = 'maybe') as "maybeCount",
         (SELECT er2.status FROM event_rsvps er2 WHERE er2.event_id = e.id AND er2.user_id = $2) as "myRsvp"
       FROM events e
       JOIN posts p ON p.id = e.post_id
       JOIN users u ON u.id = p.author_id
       WHERE e.id = $1`,
      [id, userId]
    );

    if (rows.length === 0) {
      throw new AppError("Event not found", 404);
    }
    res.json({ event: rows[0] });
  } finally {
    client.release();
  }
});

/**
 * POST /events/:id/rsvp
 * Body: { status: 'going' | 'maybe' | 'declined' }
 */
const handleRsvp = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;
  const { status = "going" } = req.body || {};

  const validStatuses = ["going", "maybe", "declined"];
  if (!validStatuses.includes(status)) {
    throw new AppError(`status must be one of: ${validStatuses.join(", ")}`, 400);
  }

  const client = await pool.connect();
  try {
    // Verify event exists and RSVP is enabled
    const { rows: eventRows } = await client.query(
      `SELECT e.id, e.rsvp_enabled, e.capacity,
         (SELECT COUNT(*)::int FROM event_rsvps er WHERE er.event_id = e.id AND er.status = 'going') as "goingCount"
       FROM events e WHERE e.id = $1`,
      [id]
    );

    if (eventRows.length === 0) {
      throw new AppError("Event not found", 404);
    }

    const event = eventRows[0];
    if (!event.rsvp_enabled) {
      throw new AppError("RSVP is not enabled for this event", 400);
    }

    if (status === "going" && event.capacity && event.goingCount >= event.capacity) {
      throw new AppError("Event is at full capacity", 400);
    }

    // Upsert RSVP
    const { rows } = await client.query(
      `INSERT INTO event_rsvps (event_id, user_id, status)
       VALUES ($1, $2, $3)
       ON CONFLICT (event_id, user_id) DO UPDATE SET status = $3, rsvp_at = now()
       RETURNING event_id as "eventId", user_id as "userId", status, rsvp_at as "rsvpAt"`,
      [id, userId, status]
    );

    // Get updated counts
    const { rows: countRows } = await client.query(
      `SELECT 
         (SELECT COUNT(*)::int FROM event_rsvps WHERE event_id = $1 AND status = 'going') as "goingCount",
         (SELECT COUNT(*)::int FROM event_rsvps WHERE event_id = $1 AND status = 'maybe') as "maybeCount"`,
      [id]
    );

    res.json({ rsvp: rows[0], counts: countRows[0] });
  } finally {
    client.release();
  }
});

/**
 * GET /events/:id/rsvps
 * Returns list of RSVPs for an event.
 */
const handleGetRsvps = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const client = await pool.connect();
  try {
    const { rows } = await client.query(
      `SELECT er.status, er.rsvp_at as "rsvpAt",
         u.id as "userId", u.full_name as "fullName", u.avatar_url as "avatarUrl"
       FROM event_rsvps er
       JOIN users u ON u.id = er.user_id
       WHERE er.event_id = $1
       ORDER BY er.rsvp_at DESC`,
      [id]
    );
    res.json({ rsvps: rows });
  } finally {
    client.release();
  }
});

module.exports = {
  handleCreateEvent,
  handleGetEvents,
  handleGetEventById,
  handleRsvp,
  handleGetRsvps,
};
