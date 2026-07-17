const { z } = require("zod");

const createFaqSchema = z.object({
  category: z.string().min(2, "Category must be at least 2 characters long").max(100, "Category cannot exceed 100 characters"),
  question: z.string().min(5, "Question must be at least 5 characters long").max(500, "Question cannot exceed 500 characters"),
  answer: z.string().min(5, "Answer must be at least 5 characters long"),
});

const updateFaqSchema = createFaqSchema.partial();

const faqQuerySchema = z.object({
  q: z.string().optional(),
  category: z.string().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});

module.exports = {
  createFaqSchema,
  updateFaqSchema,
  faqQuerySchema,
};
