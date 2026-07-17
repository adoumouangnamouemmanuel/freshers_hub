const express = require("express");
const { requireAuth } = require("../middleware/authMiddleware");
const validate = require("../middleware/validateMiddleware");
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

router.post("/", validate({ body: createEventSchema }), handleCreateEvent);
router.get("/", validate({ query: getEventsQuerySchema }), handleGetEvents);
router.get("/:id", validate({ params: { id: uuidSchema } }), handleGetEventById);
router.put("/:id", validate({ params: { id: uuidSchema }, body: updateEventSchema }), handleUpdateEvent);
router.delete("/:id", validate({ params: { id: uuidSchema } }), handleDeleteEvent);
router.post("/:id/rsvp", validate({ params: { id: uuidSchema }, body: rsvpSchema }), handleRsvp);
router.get("/:id/rsvps", validate({ params: { id: uuidSchema } }), handleGetRsvps);

module.exports = router;
