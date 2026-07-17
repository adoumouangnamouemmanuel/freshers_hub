const { z } = require("zod");

const uuidSchema = z.string().uuid("Invalid notification ID format");

const notificationQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(50),
});

module.exports = {
  uuidSchema,
  notificationQuerySchema,
};
