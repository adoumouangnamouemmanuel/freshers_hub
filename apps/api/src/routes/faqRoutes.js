const express = require("express");
const { requireAuth, requireRoles } = require("../middleware/authMiddleware");
const validate = require("../middleware/validate");
const {
  createFaqSchema,
  updateFaqSchema,
  faqQuerySchema,
} = require("../schemas/faqSchemas");
const {
  getFaqs,
  getFaqById,
  createFaq,
  updateFaq,
  deleteFaq,
} = require("../controllers/faqController");

const { z } = require("zod");

const router = express.Router();

// Public routes (search and listing can be accessed by everyone)
router.get("/", validate(z.object({ query: faqQuerySchema })), getFaqs);
router.get("/search", validate(z.object({ query: faqQuerySchema })), getFaqs); // Backward compatibility
router.get("/:id", getFaqById);

// Admin only routes
router.use(requireAuth);
router.use(requireRoles("admin"));

router.post("/", validate(z.object({ body: createFaqSchema })), createFaq);
router.put("/:id", validate(z.object({ body: updateFaqSchema })), updateFaq);
router.delete("/:id", deleteFaq);

module.exports = router;
