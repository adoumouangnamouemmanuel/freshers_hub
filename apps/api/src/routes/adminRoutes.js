/**
 * Platform Admin Routes
 *
 * ALL routes here require:
 *   1. requireAuth      — valid JWT
 *   2. requirePlatformAdmin — role check (returns 403, not 404)
 *
 * All mutating routes (POST/PATCH/DELETE/PUT) also apply auditAction() middleware,
 * which writes to audit_log after a successful 2xx response.
 *
 * Exception: POST /feed/posts/:id/delete has its own audit entry written inside
 * the service because it must snapshot the post content BEFORE deletion.
 *
 * Rate limits:
 *   - All admin routes share the API's global rate limiter.
 *   - Bulk/import endpoints have an additional, tighter per-IP limit.
 */

const express = require('express');
const { requireAuth, requirePlatformAdmin } = require('../middleware/authMiddleware');
const { auditAction } = require('../middleware/auditLog');
const validate = require('../middleware/validate');
const { rateLimit } = require('../middleware/rateLimiter');

const c = require('../controllers/adminController');

const {
  updateUserSchema,
  assignRoleSchema,
  bulkRolesSchema,
  bulkDeactivateSchema,
  createAcademicYearSchema,
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
} = require('../schemas/adminSchemas');

const router = express.Router();

// ── Gate the entire /admin namespace ────────────────────────────────────────
router.use(requireAuth, requirePlatformAdmin);

// ═══════════════════════════════════════════════════════════════════════════
// USERS
// GET  /admin/users
// GET  /admin/users/:id
// PATCH /admin/users/:id
// POST /admin/users/:id/roles
// DELETE /admin/users/:id/roles/:roleId
// POST /admin/users/bulk-roles
// POST /admin/users/bulk-deactivate
// POST /admin/users/import
// GET  /admin/roles
// ═══════════════════════════════════════════════════════════════════════════

router.get('/users',                       c.listUsers);
router.get('/users/:id',                   c.getUserById);
router.post('/users',                                                     auditAction('user.created', 'user'),       c.createUser);
router.patch('/users/:id',                 validate(updateUserSchema),    auditAction('user.updated', 'user'),       c.updateUser);
router.post('/users/:id/roles',            validate(assignRoleSchema),    auditAction('role.assigned', 'user'),      c.assignRole);
router.delete('/users/:id/roles/:roleId',                                 auditAction('role.removed', 'user'),       c.removeRole);
router.post('/users/bulk-roles',           validate(bulkRolesSchema),     auditAction('role.bulk_assigned', 'user'), rateLimit('adminBulk'), c.bulkAssignRoles);
router.post('/users/bulk-deactivate',      validate(bulkDeactivateSchema),auditAction('user.bulk_deactivated', 'user'), rateLimit('adminBulk'), c.bulkDeactivate);
router.post('/users/import',               rateLimit('adminBulk'),        auditAction('user.csv_import', 'user'),    c.csvUpload, c.importUsers);
router.get('/roles',                       c.listRoles);

// ═══════════════════════════════════════════════════════════════════════════
// ACADEMIC YEARS
// GET   /admin/academic-years
// POST  /admin/academic-years
// PATCH /admin/academic-years/:id/activate
// ═══════════════════════════════════════════════════════════════════════════

router.get('/academic-years',                  c.listAcademicYears);
router.post('/academic-years',                 validate(createAcademicYearSchema), auditAction('academic_year.created', 'academic_year'),  c.createAcademicYear);
router.patch('/academic-years/:id/activate',                                       auditAction('academic_year.activated', 'academic_year'), c.activateAcademicYear);

// ═══════════════════════════════════════════════════════════════════════════
// UNITS (aggregate-only — confidentiality boundary)
// ═══════════════════════════════════════════════════════════════════════════

router.get('/units/coaching/summary',     c.getCoachingSummary);
router.get('/units/coaching/coaches',     c.getCoachingCoaches);
router.get('/units/counselling/summary',  c.getCounsellingSummary);
router.get('/units/advising/summary',     c.getAdvisingSummary);
router.get('/units/buddy-up/summary',     c.getBuddyUpSummary);
router.post('/units/buddy-up/sync',       auditAction('buddy_up.sync_triggered', 'buddy_pairing'), c.triggerBuddyUpSync);
router.get('/units/buddy-up/sync-status', c.getBuddyUpSyncStatus);

// ═══════════════════════════════════════════════════════════════════════════
// CLUBS
// ═══════════════════════════════════════════════════════════════════════════

router.get('/clubs',                      c.listClubs);
router.post('/clubs',                     validate(createClubSchema),    auditAction('club.created', 'club'),       c.createClub);
router.patch('/clubs/:id',                validate(updateClubSchema),    auditAction('club.updated', 'club'),       c.updateClub);
router.delete('/clubs/:id',                                               auditAction('club.deactivated', 'club'),   c.deleteClub);
router.get('/clubs/:id/members',          c.getClubMembers);
router.get('/clubs/:id/posts',            c.getClubPosts);
router.patch('/clubs/:id/reassign-lead',  validate(reassignLeadSchema),  auditAction('club.lead_reassigned', 'club'), c.reassignClubLead);

// ═══════════════════════════════════════════════════════════════════════════
// OFFICES
// ═══════════════════════════════════════════════════════════════════════════

router.get('/offices',                         c.listOffices);
router.post('/offices',                        validate(createOfficeSchema), auditAction('office.created', 'office'),       c.createOffice);
router.patch('/offices/:id',                   validate(updateOfficeSchema), auditAction('office.updated', 'office'),       c.updateOffice);
router.post('/offices/:id/staff',              validate(addOfficeStaffSchema), auditAction('office.staff_added', 'office'),   c.addOfficeStaff);
router.delete('/offices/:id/staff/:userId',                                    auditAction('office.staff_removed', 'office'), c.removeOfficeStaff);
router.post('/offices/:id/links',              validate(addOfficeLinkSchema), auditAction('office.link_added', 'office'),    c.addOfficeLink);
router.delete('/offices/:id/links/:linkId',                                    auditAction('office.link_removed', 'office'), c.removeOfficeLink);

// ═══════════════════════════════════════════════════════════════════════════
// FEED / GROUPS / EVENTS
// ═══════════════════════════════════════════════════════════════════════════

router.get('/feed/posts',                  c.listPosts);
// Note: deletePost has its own audit entry (content snapshot) — no auditAction middleware
router.delete('/feed/posts/:id',           c.deletePost);
router.post('/feed/posts',                 validate(createAdminPostSchema), auditAction('post.created', 'post'), c.createPost);

router.get('/groups',                      c.listGroups);
router.post('/groups',                     validate(createGroupSchema),    auditAction('group.created', 'group'), c.createGroup);
router.post('/groups/:id/members',         validate(addGroupMembersSchema),auditAction('group.members_added', 'group'), c.addGroupMembers);

router.get('/events',                      c.listEvents);
router.patch('/events/:id',                validate(updateEventSchema),    auditAction('event.updated', 'event'), c.updateEvent);

// ═══════════════════════════════════════════════════════════════════════════
// AUDIT LOG
// ═══════════════════════════════════════════════════════════════════════════

router.get('/audit-log',                   c.getAuditLog);

// ═══════════════════════════════════════════════════════════════════════════
// ANALYTICS
// ═══════════════════════════════════════════════════════════════════════════

router.get('/analytics/overview',          c.getAnalyticsOverview);
router.get('/analytics/unit-comparison',   c.getUnitComparison);
router.get('/analytics/cohort-speed',      c.getCohortSpeed);
router.get('/analytics/monthly-sessions',  c.getMonthlySessions);
router.get('/analytics/top-clubs',         c.getTopClubs);
router.get('/analytics/export',            c.exportAnalytics);

// ═══════════════════════════════════════════════════════════════════════════
// NOTIFICATIONS
// ═══════════════════════════════════════════════════════════════════════════

router.get('/notifications/categories',                      c.getNotificationCategories);
router.patch('/notifications/categories/:key/default',
  validate(updateNotifCategorySchema),
  auditAction('notification.category_default_updated', 'notification_category'),
  c.updateNotificationCategoryDefault
);

// ═══════════════════════════════════════════════════════════════════════════
// SETTINGS & ADMINS
// ═══════════════════════════════════════════════════════════════════════════

router.get('/settings',                    c.getSettings);
router.patch('/settings/:key',             validate(updateSettingSchema), auditAction('setting.updated', 'setting'), c.updateSetting);

router.get('/admins',                      c.listAdmins);
router.post('/admins',                     validate(grantAdminSchema),   auditAction('admin.granted', 'user'),  c.grantPlatformAdmin);
router.delete('/admins/:userId',                                          auditAction('admin.revoked', 'user'),  c.revokePlatformAdmin);

// ═══════════════════════════════════════════════════════════════════════════
// AUDIT LOGS
// ═══════════════════════════════════════════════════════════════════════════

const adminAuditController = require('../controllers/adminAuditController');
const { listAuditLogsSchema } = require('../schemas/adminSchemas');

router.get('/audit-logs', validate(listAuditLogsSchema), adminAuditController.listAuditLogs);

module.exports = router;
