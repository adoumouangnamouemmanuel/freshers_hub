const { z } = require("zod");

// Reusable fields
const uuidSchema = z.string().uuid("Invalid UUID format");
const optionalUuidSchema = z.string().uuid("Invalid UUID format").optional().nullable();
const eventStatusSchema = z.enum(["scheduled", "cancelled", "completed"]);

// Schemas
const createEventSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters").max(100, "Title is too long"),
  content: z.string().min(5, "Content must be at least 5 characters").max(5000, "Content is too long"),
  eventDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format (YYYY-MM-DD)"),
  eventTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)(:([0-5]\d))?$/, "Invalid time format (HH:MM)"),
  location: z.string().max(255, "Location is too long").optional().nullable(),
  organizer: z.string().max(100, "Organizer is too long").optional().nullable(),
  dressCode: z.string().max(100, "Dress code is too long").optional().nullable(),
  capacity: z.number().int().positive().optional().nullable(),
  rsvpEnabled: z.boolean().default(true),
  visibility: z.enum(["public", "targeted", "private"]).default("public"),
  targetGroupIds: z.array(uuidSchema).optional().default([]),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format (YYYY-MM-DD)").optional().nullable(),
  endTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)(:([0-5]\d))?$/, "Invalid time format (HH:MM)").optional().nullable(),
  isAllDay: z.boolean().optional().default(false),
  isOnline: z.boolean().optional().default(false),
  meetingLink: z.string().max(500, "Meeting link is too long").optional().nullable(),
  reminderMinutes: z.number().int().min(0).optional().nullable(),
});

const updateEventSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters").max(100, "Title is too long").optional(),
  content: z.string().min(5, "Content must be at least 5 characters").max(5000, "Content is too long").optional(),
  eventDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format (YYYY-MM-DD)").optional(),
  eventTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)(:([0-5]\d))?$/, "Invalid time format (HH:MM)").optional(),
  location: z.string().max(255, "Location is too long").optional().nullable(),
  organizer: z.string().max(100, "Organizer is too long").optional().nullable(),
  dressCode: z.string().max(100, "Dress code is too long").optional().nullable(),
  capacity: z.number().int().positive().optional().nullable(),
  rsvpEnabled: z.boolean().optional(),
  visibility: z.enum(["public", "targeted", "private"]).optional(),
  status: eventStatusSchema.optional(),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format (YYYY-MM-DD)").optional().nullable(),
  endTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)(:([0-5]\d))?$/, "Invalid time format (HH:MM)").optional().nullable(),
  isAllDay: z.boolean().optional().nullable(),
  isOnline: z.boolean().optional().nullable(),
  meetingLink: z.string().max(500, "Meeting link is too long").optional().nullable(),
  reminderMinutes: z.number().int().min(0).optional().nullable(),
  targetGroupIds: z.array(uuidSchema).optional().nullable(),
});

const rsvpSchema = z.object({
  status: z.enum(["going", "maybe", "declined"], {
    errorMap: () => ({ message: "Status must be going, maybe, or declined" })
  }),
});

const getEventsQuerySchema = z.object({
  page: z.string().regex(/^\d+$/).transform(Number).default("1"),
  limit: z.string().regex(/^\d+$/).transform(Number).default("50"),
  status: eventStatusSchema.optional().default("scheduled"),
});

module.exports = {
  createEventSchema,
  updateEventSchema,
  rsvpSchema,
  getEventsQuerySchema,
  uuidSchema,
};
