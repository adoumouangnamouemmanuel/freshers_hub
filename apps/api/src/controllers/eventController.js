const asyncHandler = require("../utils/asyncHandler");
const eventService = require("../services/eventService");

const handleCreateEvent = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const userRoles = req.user.roles || [];
  const result = await eventService.createEvent(userId, userRoles, req.body);
  res.status(201).json(result);
});

const handleGetEvents = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const result = await eventService.getEvents(userId, req.query);
  res.json(result);
});

const handleGetEventById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;
  const event = await eventService.getEventById(id, userId);
  res.json({ event });
});

const handleUpdateEvent = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;
  const userRoles = req.user.roles || [];
  const event = await eventService.updateEvent(id, userId, userRoles, req.body);
  res.json({ success: true, event });
});

const handleDeleteEvent = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;
  const userRoles = req.user.roles || [];
  await eventService.deleteEvent(id, userId, userRoles);
  res.json({ success: true, message: "Event deleted successfully" });
});

const handleRsvp = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;
  const { status } = req.body;
  const result = await eventService.rsvpToEvent(id, userId, status);
  res.json(result);
});

const handleGetRsvps = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 10;
  const offset = (page - 1) * limit;

  // BUG-18 fix: getEventRsvps now returns { rsvps, total } — forward both to client
  const result = await eventService.getEventRsvps(id, limit, offset);
  res.json(result);
});

module.exports = {
  handleCreateEvent,
  handleGetEvents,
  handleGetEventById,
  handleUpdateEvent,
  handleDeleteEvent,
  handleRsvp,
  handleGetRsvps,
};
