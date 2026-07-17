const express = require("express");
const { z } = require("zod");
const { requireAuth } = require("../middleware/authMiddleware");
const validate = require("../middleware/validate");
const { 
  createEventSchema, 
  updateEventSchema, 
  rsvpSchema, 
  getEventsQuerySchema, 
  uuidSchema 
} = require("../schemas/eventSchemas");

const {
  handleCreateEvent,
  handleGetEvents,
  handleGetEventById,
  handleUpdateEvent,
  handleDeleteEvent,
  handleRsvp,
  handleGetRsvps,
} = require("../controllers/eventController");

const router = express.Router();

// All event routes require authentication
router.use(requireAuth);

router.post("/", validate(z.object({ body: createEventSchema })), handleCreateEvent);
router.get("/", validate(z.object({ query: getEventsQuerySchema })), handleGetEvents);
router.get("/:id", validate(z.object({ params: z.object({ id: uuidSchema }) })), handleGetEventById);
router.put("/:id", validate(z.object({ params: z.object({ id: uuidSchema }), body: updateEventSchema })), handleUpdateEvent);
router.delete("/:id", validate(z.object({ params: z.object({ id: uuidSchema }) })), handleDeleteEvent);
router.post("/:id/rsvp", validate(z.object({ params: z.object({ id: uuidSchema }), body: rsvpSchema })), handleRsvp);
router.get("/:id/rsvps", validate(z.object({ params: z.object({ id: uuidSchema }) })), handleGetRsvps);

module.exports = router;
