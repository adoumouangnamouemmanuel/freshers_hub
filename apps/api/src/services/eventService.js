const AppError = require("../utils/AppError");
const { pool } = require("../services/db");
const eventRepository = require("../repositories/eventRepository");
const postRepository = require("../repositories/postRepository");
const notificationRepo = require("../repositories/notificationRepository");
const notificationService = require("./notificationService");
const logger = require("../utils/logger");

// Shared roles allowed to manipulate events
const ALLOWED_ROLES = ["staff", "faculty", "student_leader", "admin", "club_lead", "advisor", "counsellor", "coach_admin"];

const checkPermission = (userRoles, authorId, userId) => {
  const hasRole = userRoles.some(role => ALLOWED_ROLES.includes(role));
  const isAuthor = authorId === userId;
  if (!hasRole && !isAuthor) {
    throw new AppError("Not authorized to manage this event", 403);
  }
};

/**
 * BUG-23 fix: Extracted shared helper so push dispatch isn't duplicated.
 * BUG-06 fix: Uses setImmediate so notifications fire AFTER the DB transaction
 * commits — preventing ghost notifications if the transaction rolls back.
 */
const dispatchPushNotifications = (notifiedUsers, postId) => {
  if (!notifiedUsers || notifiedUsers.length === 0) return;
  setImmediate(async () => {
    for (const n of notifiedUsers) {
      try {
        const tokens = await notificationRepo.getPushTokensForUser(n.user_id);
        if (tokens && tokens.length > 0) {
          await notificationService.sendExpoPush(tokens, n.title, n.body, {
            notificationId: n.id,
            relatedEntity: `post:${postId}`
          });
        }
      } catch (err) {
        logger.error(`Failed to send push for new event to user ${n.user_id}: ${err.message}`);
      }
    }
  });
};

const createEvent = async (userId, userRoles, data) => {
  const hasRole = userRoles.some(role => ALLOWED_ROLES.includes(role));
  if (!hasRole) {
    throw new AppError("Insufficient permissions to create an event", 403);
  }

  const { 
    title, content, visibility, targetGroupIds, 
    endDate, endTime, isAllDay, isOnline, meetingLink, reminderMinutes,
    ...eventFields 
  } = data;

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    // 1. Create Post
    const post = await postRepository.insertPost(client, {
      authorId: userId,
      title: title.trim(),
      content: content.trim(),
      category: 'event',
      visibility
    });

    let notifiedUsers = [];

    // 2. Targets & Notifications (DB inserts happen inside the transaction)
    if (visibility === "targeted" && targetGroupIds?.length > 0) {
      await postRepository.insertPostTargets(client, post.id, targetGroupIds, userId);
      notifiedUsers = await postRepository.insertNotificationsForTargets(
        client, 
        {
          title: `New Event: ${title.trim()}`,
          category: 'event',
          postId: post.id,
          targetGroupIds,
          authorId: userId
        }
      );
    } else {
      // Notify all students if not targeted
      notifiedUsers = await postRepository.insertNotificationsForAllStudents(
        client, 
        {
          title: `New Event: ${title.trim()}`,
          category: 'event',
          postId: post.id,
          authorId: userId
        }
      );
    }

    // 3. Create Event record
    const event = await eventRepository.insertEvent(client, {
      postId: post.id,
      endDate,
      endTime,
      isAllDay,
      isOnline,
      meetingLink,
      reminderMinutes,
      ...eventFields
    });

    await client.query("COMMIT");

    // BUG-06 fix: Push notifications are dispatched AFTER commit so they
    // never fire for rolled-back transactions.
    dispatchPushNotifications(notifiedUsers, post.id);

    // 4. Schedule Reminder (if applicable) — also after commit
    if (reminderMinutes && reminderMinutes > 0 && notifiedUsers && notifiedUsers.length > 0) {
      // NOTE: eventDate/eventTime are bare strings (YYYY-MM-DD / HH:MM).
      // They are treated as server-local time here. Ensure the server runs in UTC
      // or switch to UTC ISO timestamps in a future timezone refactor.
      const eventDateTime = new Date(`${eventFields.eventDate}T${eventFields.eventTime}`);
      const scheduledAt = new Date(eventDateTime.getTime() - (reminderMinutes * 60 * 1000));

      if (scheduledAt > new Date()) {
        setImmediate(async () => {
          for (const n of notifiedUsers) {
            try {
              await notificationService.scheduleReminder({
                userId: n.user_id,
                category: 'event_reminder',
                title: `Reminder: ${title.trim()}`,
                body: `Starts in ${reminderMinutes} minutes. Tap to view details.`,
                scheduledAt: scheduledAt.toISOString(),
                relatedEntity: `post:${post.id}`
              });
            } catch (err) {
              logger.error(`Failed to schedule reminder for user ${n.user_id}: ${err.message}`);
            }
          }
        });
      }
    }

    return { post, event };
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
};

const getEvents = async (userId, options) => {
  const client = await pool.connect();
  try {
    // BUG-17 fix: Use ?? instead of || so limit=0 is handled correctly
    const limit = options.limit ?? 50;
    const page = options.page ?? 1;
    const offset = (page - 1) * limit;

    const { data, total } = await eventRepository.findEvents(client, userId, {
      limit,
      offset,
      status: options.status,
      dateFrom: options.dateFrom,
      dateTo: options.dateTo,
    });

    const totalPages = Math.ceil(total / (limit || 1));

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages
      }
    };
  } finally {
    client.release();
  }
};

const getEventById = async (eventId, userId) => {
  const client = await pool.connect();
  try {
    const event = await eventRepository.findEventById(client, eventId, userId);
    if (!event) {
      throw new AppError("Event not found", 404);
    }
    return event;
  } finally {
    client.release();
  }
};

const updateEvent = async (eventId, userId, userRoles, data) => {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const existingEvent = await eventRepository.findEventById(client, eventId, userId);
    if (!existingEvent) {
      throw new AppError("Event not found", 404);
    }

    checkPermission(userRoles, existingEvent.authorId, userId);

    const { 
      title, content, category, 
      visibility,
      endDate, endTime, isAllDay, isOnline, meetingLink, reminderMinutes,
      ...eventFields 
    } = data;

    // Update post fields (title, content, visibility) if any are provided
    if (title !== undefined || content !== undefined || visibility !== undefined) {
      await postRepository.updatePost(client, existingEvent.postId, {
        title,
        content,
        category: 'event',
        // BUG-04 fix: visibility is now properly forwarded to updatePost
        visibility
      });
    }

    // Update event-specific fields
    await eventRepository.updateEvent(client, eventId, {
      endDate,
      endTime,
      isAllDay,
      isOnline,
      meetingLink,
      reminderMinutes,
      ...eventFields
    });

    // BUG-01 fix: Read refreshed view BEFORE committing so we use the
    // same still-open client — no dead-client or double-release risk.
    const refreshed = await eventRepository.findEventById(client, eventId, userId);

    await client.query("COMMIT");
    return refreshed;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
};

const deleteEvent = async (eventId, userId, userRoles) => {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const existingEvent = await eventRepository.findEventById(client, eventId, userId);
    if (!existingEvent) {
      throw new AppError("Event not found", 404);
    }

    checkPermission(userRoles, existingEvent.authorId, userId);

    // Deleting the post cascades to deleting the event
    await postRepository.deletePost(client, existingEvent.postId);

    await client.query("COMMIT");
    return true;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
};

const rsvpToEvent = async (eventId, userId, status) => {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    // BUG-21 fix: Lock the event row with FOR UPDATE so concurrent RSVPs are
    // serialized — prevents two users from both passing the capacity check for
    // the last remaining slot (TOCTOU race condition).
    const { rows: lockRows } = await client.query(
      `SELECT e.id, e.capacity, e.rsvp_enabled,
              (SELECT COUNT(*)::int FROM event_rsvps er WHERE er.event_id = e.id AND er.status = 'going') AS going_count,
              (SELECT er2.status FROM event_rsvps er2 WHERE er2.event_id = $1 AND er2.user_id = $2) AS my_rsvp
       FROM events e WHERE e.id = $1 FOR UPDATE`,
      [eventId, userId]
    );

    if (!lockRows.length) {
      throw new AppError("Event not found", 404);
    }

    const { capacity, rsvp_enabled, going_count, my_rsvp } = lockRows[0];

    if (!rsvp_enabled) {
      throw new AppError("RSVP is not enabled for this event", 400);
    }

    if (status === "going" && capacity && going_count >= capacity) {
      // Allow if user is already going (refreshing their RSVP)
      if (my_rsvp !== "going") {
        throw new AppError("Event is at full capacity", 400);
      }
    }

    const rsvp = await eventRepository.upsertRsvp(client, eventId, userId, status);
    const counts = await eventRepository.getEventCounts(client, eventId);

    await client.query("COMMIT");
    return { rsvp, counts };
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
};

const getEventRsvps = async (eventId, limit = 10, offset = 0) => {
  const client = await pool.connect();
  try {
    // BUG-07 fix: Simple existence check instead of loading the full event
    // with a fragile template-literal SQL branch.
    const { rows } = await client.query(
      'SELECT 1 FROM events WHERE id = $1',
      [eventId]
    );
    if (!rows.length) {
      throw new AppError("Event not found", 404);
    }
    
    // BUG-18 fix: findRsvpsByEventId now returns { rsvps, total }
    return await eventRepository.findRsvpsByEventId(client, eventId, limit, offset);
  } finally {
    client.release();
  }
};

module.exports = {
  createEvent,
  getEvents,
  getEventById,
  updateEvent,
  deleteEvent,
  rsvpToEvent,
  getEventRsvps
};
