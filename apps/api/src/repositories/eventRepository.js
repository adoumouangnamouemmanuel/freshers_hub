/**
 * src/repositories/eventRepository.js
 */

const insertEvent = async (client, { 
  postId, eventDate, eventTime, endDate, endTime, isAllDay, isOnline, meetingLink, reminderMinutes, location, organizer, dressCode, capacity, rsvpEnabled 
}) => {
  const { rows } = await client.query(
    `INSERT INTO events (
      post_id, event_date, event_time, end_date, end_time, is_all_day, is_online, meeting_link, reminder_minutes, 
      location, organizer, dress_code, capacity, rsvp_enabled
     )
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
     RETURNING id, post_id as "postId", event_date as "eventDate", event_time as "eventTime",
               end_date as "endDate", end_time as "endTime", is_all_day as "isAllDay",
               is_online as "isOnline", meeting_link as "meetingLink", reminder_minutes as "reminderMinutes",
               location, organizer, dress_code as "dressCode", capacity, rsvp_enabled as "rsvpEnabled", status`,
    [postId, eventDate, eventTime, endDate || null, endTime || null, isAllDay || false, isOnline || false, meetingLink || null, reminderMinutes || null, location || null, organizer || null, dressCode || null, capacity || null, rsvpEnabled]
  );
  return rows[0];
};

const updateEvent = async (client, eventId, { 
  eventDate, eventTime, endDate, endTime, isAllDay, isOnline, meetingLink, reminderMinutes, location, organizer, dressCode, capacity, rsvpEnabled, status 
}) => {
  const { rows } = await client.query(
    `UPDATE events
     SET
       event_date = COALESCE($1, event_date),
       event_time = COALESCE($2, event_time),
       end_date = COALESCE($3, end_date),
       end_time = COALESCE($4, end_time),
       is_all_day = COALESCE($5, is_all_day),
       is_online = COALESCE($6, is_online),
       meeting_link = COALESCE($7, meeting_link),
       reminder_minutes = COALESCE($8, reminder_minutes),
       location = COALESCE($9, location),
       organizer = COALESCE($10, organizer),
       dress_code = COALESCE($11, dress_code),
       capacity = COALESCE($12, capacity),
       rsvp_enabled = COALESCE($13, rsvp_enabled),
       status = COALESCE($14, status)
     WHERE id = $15
     RETURNING id, post_id as "postId", event_date as "eventDate", event_time as "eventTime",
               end_date as "endDate", end_time as "endTime", is_all_day as "isAllDay",
               is_online as "isOnline", meeting_link as "meetingLink", reminder_minutes as "reminderMinutes",
               location, organizer, dress_code as "dressCode", capacity, rsvp_enabled as "rsvpEnabled", status`,
    [eventDate, eventTime, endDate, endTime, isAllDay, isOnline, meetingLink, reminderMinutes, location, organizer, dressCode, capacity, rsvpEnabled, status, eventId]
  );
  return rows[0];
};

const findEvents = async (client, userId, { limit, offset, status = 'scheduled' }) => {
  const { rows } = await client.query(
    `SELECT 
       e.id, e.post_id as "postId", e.event_date as "eventDate", e.event_time as "eventTime",
       e.end_date as "endDate", e.end_time as "endTime", e.is_all_day as "isAllDay",
       e.is_online as "isOnline", e.meeting_link as "meetingLink", e.reminder_minutes as "reminderMinutes",
       e.location, e.organizer, e.dress_code as "dressCode", e.capacity,
       e.rsvp_enabled as "rsvpEnabled", e.status,
       p.title, p.content, p.visibility, p.created_at as "createdAt",
       u.full_name as "authorName", u.id as "authorId",
       (SELECT COUNT(*)::int FROM event_rsvps er WHERE er.event_id = e.id AND er.status = 'going') as "goingCount",
       (SELECT er2.status FROM event_rsvps er2 WHERE er2.event_id = e.id AND er2.user_id = $1) as "myRsvp",
       COUNT(*) OVER()::int AS "totalCount"
     FROM events e
     JOIN posts p ON p.id = e.post_id
     JOIN users u ON u.id = p.author_id
     WHERE e.status = $4
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
     LIMIT $2 OFFSET $3`,
    [userId, limit, offset, status]
  );
  
  if (rows.length === 0) return { data: [], total: 0 };
  
  const total = rows[0].totalCount;
  // Remove totalCount from individual rows
  const data = rows.map(({ totalCount, ...rest }) => rest);
  
  return { data, total };
};

const findEventById = async (client, eventId, userId) => {
  // We use user_id to resolve "myRsvp" correctly if userId is provided
  const { rows } = await client.query(
    `SELECT 
       e.id, e.post_id as "postId", e.event_date as "eventDate", e.event_time as "eventTime",
       e.end_date as "endDate", e.end_time as "endTime", e.is_all_day as "isAllDay",
       e.is_online as "isOnline", e.meeting_link as "meetingLink", e.reminder_minutes as "reminderMinutes",
       e.location, e.organizer, e.dress_code as "dressCode", e.capacity,
       e.rsvp_enabled as "rsvpEnabled", e.status,
       p.title, p.content, p.visibility, p.created_at as "createdAt",
       u.full_name as "authorName", u.id as "authorId", u.avatar_url as "authorAvatar",
       (SELECT COUNT(*)::int FROM event_rsvps er WHERE er.event_id = e.id AND er.status = 'going') as "goingCount",
       (SELECT COUNT(*)::int FROM event_rsvps er WHERE er.event_id = e.id AND er.status = 'maybe') as "maybeCount",
       ${userId ? `(SELECT er2.status FROM event_rsvps er2 WHERE er2.event_id = e.id AND er2.user_id = $2) as "myRsvp"` : `NULL as "myRsvp"`}
     FROM events e
     JOIN posts p ON p.id = e.post_id
     JOIN users u ON u.id = p.author_id
     WHERE e.id = $1`,
    userId ? [eventId, userId] : [eventId]
  );
  return rows[0] || null;
};

const upsertRsvp = async (client, eventId, userId, status) => {
  const { rows } = await client.query(
    `INSERT INTO event_rsvps (event_id, user_id, status)
     VALUES ($1, $2, $3)
     ON CONFLICT (event_id, user_id) DO UPDATE SET status = $3, rsvp_at = now()
     RETURNING event_id as "eventId", user_id as "userId", status, rsvp_at as "rsvpAt"`,
    [eventId, userId, status]
  );
  return rows[0];
};

const getEventCounts = async (client, eventId) => {
  const { rows } = await client.query(
    `SELECT 
       (SELECT COUNT(*)::int FROM event_rsvps WHERE event_id = $1 AND status = 'going') as "goingCount",
       (SELECT COUNT(*)::int FROM event_rsvps WHERE event_id = $1 AND status = 'maybe') as "maybeCount"`,
    [eventId]
  );
  return rows[0];
};

const findRsvpsByEventId = async (client, eventId, limit = 10, offset = 0) => {
  const { rows } = await client.query(
    `SELECT er.status, er.rsvp_at as "rsvpAt",
       u.id as "userId", u.full_name as "fullName", u.avatar_url as "avatarUrl"
     FROM event_rsvps er
     JOIN users u ON u.id = er.user_id
     WHERE er.event_id = $1
     ORDER BY er.rsvp_at DESC
     LIMIT $2 OFFSET $3`,
    [eventId, limit, offset]
  );
  return rows;
};

module.exports = {
  insertEvent,
  updateEvent,
  findEvents,
  findEventById,
  upsertRsvp,
  getEventCounts,
  findRsvpsByEventId
};
