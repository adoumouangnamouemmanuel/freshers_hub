/**
 * Zod validation schemas for all Platform Admin endpoints.
 */

const { z } = require('zod');

// ── Users ────────────────────────────────────────────────────────────────────

const updateUserSchema = z.object({
  body: z.object({
    email:      z.string().email().optional(),
    full_name:  z.string().min(1).optional(),
    school_id:  z.string().optional(),
    role_id:    z.union([z.string(), z.number()]).optional(),
    role_ids:   z.array(z.union([z.string(), z.number()])).optional(),
    phone:      z.string().optional(),
    major:      z.string().optional(),
    class_year: z.number().int().optional(),
    country:    z.string().optional(),
    is_active:  z.boolean().optional(),
  }),
});

const assignRoleSchema = z.object({
  body: z.object({
    roleId: z.union([z.string(), z.number()]),
    unitId: z.union([z.string(), z.number()]).optional(),
  }),
});

const bulkRolesSchema = z.object({
  body: z.object({
    userIds: z.array(z.string().uuid()).min(1, 'At least one user required'),
    roleId:  z.union([z.string(), z.number()]),
    unitId:  z.union([z.string(), z.number()]).optional(),
  }),
});

const bulkDeactivateSchema = z.object({
  body: z.object({
    userIds: z.array(z.string().uuid()).min(1, 'At least one user required'),
  }),
});

// ── Academic Years ────────────────────────────────────────────────────────────

const createAcademicYearSchema = z.object({
  body: z.object({
    label:      z.string().min(1, 'Label is required'),
    start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD'),
    end_date:   z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD'),
  }),
});

const updateAcademicYearSchema = z.object({
  body: z.object({
    label:      z.string().min(1).optional(),
    start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
    end_date:   z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  }),
});

// ── Clubs ─────────────────────────────────────────────────────────────────────

const createClubSchema = z.object({
  body: z.object({
    name:        z.string().min(1, 'Name is required'),
    description: z.string().optional(),
    category:    z.string().optional(),
    leadUserId:  z.string().optional(),
    image_url:   z.string().url().optional().or(z.literal('')),
    cover_image: z.string().url().optional().or(z.literal('')),
  }),
});

const updateClubSchema = z.object({
  body: z.object({
    name:        z.string().min(1).optional(),
    description: z.string().optional(),
    category:    z.string().optional(),
    leadUserId:  z.string().optional(),
    is_active:   z.boolean().optional(),
    image_url:   z.string().url().optional().or(z.literal('')),
    cover_image: z.string().url().optional().or(z.literal('')),
  }),
});

const reassignLeadSchema = z.object({
  body: z.object({
    newLeadUserId: z.string().uuid('Invalid user ID'),
  }),
});

const addClubMembersSchema = z.object({
  body: z.object({
    userIds: z.array(z.string().uuid()).min(1),
  }),
});

// ── Offices ───────────────────────────────────────────────────────────────────

const createOfficeSchema = z.object({
  body: z.object({
    name:          z.string().min(1, 'Name is required'),
    description:   z.string().optional(),
    contactEmail:  z.string().email().optional(),
    contactPhone:  z.string().optional(),
    location:      z.string().optional(),
  }),
});

const updateOfficeSchema = z.object({
  body: z.object({
    name:          z.string().min(1).optional(),
    description:   z.string().optional(),
    contactEmail:  z.string().email().optional(),
    contactPhone:  z.string().optional(),
    location:      z.string().optional(),
    is_active:     z.boolean().optional(),
  }),
});

const addOfficeStaffSchema = z.object({
  body: z.object({
    userId: z.string().uuid('Invalid user ID'),
    title:  z.string().optional(),
  }),
});

const addOfficeLinkSchema = z.object({
  body: z.object({
    label: z.string().min(1, 'Label is required'),
    url:   z.string().url('Must be a valid URL'),
  }),
});

// ── Feed / Groups / Events ────────────────────────────────────────────────────

const createAdminPostSchema = z.object({
  body: z.object({
    title:    z.string().min(1, 'Title is required'),
    content:  z.string().min(1, 'Content is required'),
    category: z.string().optional().default('announcement'),
    audience: z.enum(['all', 'students', 'coaches', 'staff']).optional().default('all'),
  }),
});

const createGroupSchema = z.object({
  body: z.object({
    name: z.string().min(1, 'Name is required'),
    type: z.string().optional(),
  }),
});

const addGroupMembersSchema = z.object({
  body: z.object({
    userIds: z.array(z.string().uuid()).min(1),
  }),
});

/**
 * BUG-02 fix: Status enum corrected from ['active','cancelled'] to
 * ['scheduled','cancelled','completed'] to match the real DB constraint.
 * Added title, content, visibility (post-level) fields that were missing.
 */
const updateEventSchema = z.object({
  body: z.object({
    // Post-level fields
    title:       z.string().min(1).optional(),
    content:     z.string().min(1).optional(),
    visibility:  z.enum(['public', 'targeted', 'private']).optional(),
    // Event-level fields
    event_date:  z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
    event_time:  z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)/).optional(),
    end_date:    z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().nullable(),
    end_time:    z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)/).optional().nullable(),
    location:    z.string().optional().nullable(),
    organizer:   z.string().optional().nullable(),
    capacity:    z.number().int().positive().optional().nullable(),
    rsvp_enabled: z.boolean().optional(),
    is_online:   z.boolean().optional(),
    meeting_link: z.string().url().optional().nullable(),
    status:      z.enum(['scheduled', 'cancelled', 'completed']).optional(),
  }),
});

// ── Notifications ─────────────────────────────────────────────────────────────

const updateNotifCategorySchema = z.object({
  body: z.object({
    enabled: z.boolean(),
  }),
});

// ── Settings ──────────────────────────────────────────────────────────────────

const updateSettingSchema = z.object({
  body: z.object({
    value: z.record(z.unknown()),
  }),
});

// ── Admins ────────────────────────────────────────────────────────────────────

const grantAdminSchema = z.object({
  body: z.object({
    userId: z.string().uuid('Invalid user ID'),
  }),
});

// ── Audit Logs ────────────────────────────────────────────────────────────────
const listAuditLogsSchema = z.object({
  query: z.object({
    search: z.string().optional(),
    action: z.string().optional(),
    entity_type: z.string().optional(),
    startDate: z.string().optional(),
    endDate: z.string().optional(),
    page: z.string().regex(/^\d+$/).optional(),
    pageSize: z.string().regex(/^\d+$/).optional(),
  }),
});

// ─────────────────────────────────────────────────────────────────────────────

module.exports = {
  updateUserSchema,
  assignRoleSchema,
  bulkRolesSchema,
  bulkDeactivateSchema,
  createAcademicYearSchema,
  updateAcademicYearSchema,
  createClubSchema,
  updateClubSchema,
  reassignLeadSchema,
  addClubMembersSchema,
  createOfficeSchema,
  updateOfficeSchema,
  addOfficeStaffSchema,
  addOfficeLinkSchema,
  createAdminPostSchema,
  createGroupSchema,
  addGroupMembersSchema,
  updateEventSchema,
  updateNotifCategorySchema,
  updateSettingSchema,
  grantAdminSchema,
  listAuditLogsSchema,
};
