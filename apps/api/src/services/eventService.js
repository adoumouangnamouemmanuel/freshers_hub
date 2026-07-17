const AppError = require("../utils/AppError");
const { pool } = require("../services/db");
const eventRepository = require("../repositories/eventRepository");
const postRepository = require("../repositories/postRepository");

// Shared roles allowed to manipulate events
const ALLOWED_ROLES = ["staff", "faculty", "student_leader", "admin", "club_lead"];

const checkPermission = (userRoles, authorId, userId) => {
  const hasRole = userRoles.some(role => ALLOWED_ROLES.includes(role));
  const isAuthor = authorId === userId;
  if (!hasRole && !isAuthor) {
    throw new AppError("Not authorized to manage this event", 403);
  }
};

const createEvent = async (userId, userRoles, data) => {
  const hasRole = userRoles.some(role => ALLOWED_ROLES.includes(role));
  if (!hasRole) {
    throw new AppError("Insufficient permissions to create an event", 403);
  }

  const { title, content, visibility, targetGroupIds, ...eventFields } = data;

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

    // 2. Targets & Notifications
    if (visibility === "targeted" && targetGroupIds?.length > 0) {
      await postRepository.insertPostTargets(client, post.id, targetGroupIds);
      await postRepository.insertNotificationsForTargets(
        client, 
        {
          title: `New Event: ${title.trim()}`,
          category: 'event',
          postId: post.id,
          targetGroupIds,
          authorId: userId
        }
      );
    }

    // 3. Create Event
    const event = await eventRepository.insertEvent(client, {
      postId: post.id,
      ...eventFields
    });

    await client.query("COMMIT");
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
    const limit = options.limit || 50;
    const page = options.page || 1;
    const offset = (page - 1) * limit;

    const { data, total } = await eventRepository.findEvents(client, userId, {
      limit,
      offset,
      status: options.status
    });

    const totalPages = Math.ceil(total / limit);

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

    const { title, content, visibility, ...eventFields } = data;

    // Update post if needed
    if (title || content || visibility) {
      await postRepository.updatePost(client, existingEvent.postId, { title, content, category: 'event', visibility });
    }

    // Update event if needed
    const updatedEvent = await eventRepository.updateEvent(client, eventId, eventFields);

    await client.query("COMMIT");
    
    // Return completely refreshed view
    return await eventRepository.findEventById(client, eventId, userId);
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

    const event = await eventRepository.findEventById(client, eventId, userId);
    if (!event) {
      throw new AppError("Event not found", 404);
    }

    if (!event.rsvpEnabled) {
      throw new AppError("RSVP is not enabled for this event", 400);
    }

    if (status === "going" && event.capacity && event.goingCount >= event.capacity) {
      // Allow overriding if the user is ALREADY going (e.g. updating RSVP just refreshes timestamp)
      if (event.myRsvp !== "going") {
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

const getEventRsvps = async (eventId) => {
  const client = await pool.connect();
  try {
    const event = await eventRepository.findEventById(client, eventId);
    if (!event) {
      throw new AppError("Event not found", 404);
    }
    
    return await eventRepository.findRsvpsByEventId(client, eventId);
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
