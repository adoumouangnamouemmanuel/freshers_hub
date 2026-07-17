const { z } = require("zod");

const createGroupSchema = z.object({
  name: z.string().min(3, "Group name must be at least 3 characters long").max(100, "Group name cannot exceed 100 characters"),
  type: z.string().min(3, "Group type must be at least 3 characters").max(50),
  description: z.string().min(5, "Description must be at least 5 characters long").optional(),
  category: z.string().min(3, "Category must be at least 3 characters").max(50).optional(),
  cover_image: z.string().url("Cover image must be a valid URL").optional(),
  image_url: z.string().url("Image URL must be a valid URL").optional(),
});

const updateGroupSchema = createGroupSchema.partial();

const groupQuerySchema = z.object({
  q: z.string().optional(),
  type: z.string().optional(),
  category: z.string().optional(),
  page: z.string().regex(/^\d+$/).transform(Number).default("1"),
  limit: z.string().regex(/^\d+$/).transform(Number).default("10"),
});

const uuidSchema = z.string().uuid("Invalid ID format");

module.exports = {
  createGroupSchema,
  updateGroupSchema,
  groupQuerySchema,
  uuidSchema,
};
