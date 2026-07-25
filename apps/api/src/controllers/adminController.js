/**
 * Platform Admin Controller
 *
 * All handlers in this file are reachable ONLY via routes that require
 * requireAuth + requirePlatformAdmin. This file contains zero auth logic;
 * it delegates entirely to service modules and formats HTTP responses.
 *
 * Audit-log entries for mutations are written by the auditAction() middleware
 * applied per-route in adminRoutes.js, NOT manually here. This keeps the
 * controller free from cross-cutting concerns.
 *
 * Pattern:
 *  - Set res.locals.auditEntityId before responding so the audit middleware can
 *    capture it on res.finish.
 *  - Set res.locals.auditMetadata for any extra detail to store.
 */

const asyncHandler = require('../utils/asyncHandler');
const AppError     = require('../utils/AppError');
const multer       = require('multer');

const adminUsersService        = require('../services/adminUsersService');
const adminAcademicYearsService = require('../services/adminAcademicYearsService');
const adminUnitsService        = require('../services/adminUnitsService');
const adminClubsService        = require('../services/adminClubsService');
const adminOfficesService      = require('../services/adminOfficesService');
const adminFeedService         = require('../services/adminFeedService');
const adminAnalyticsService    = require('../services/adminAnalyticsService');
const adminSettingsService     = require('../services/adminSettingsService');
const adminAuditLogRepository  = require('../repositories/adminAuditLogRepository');

// Multer: memory storage, 5 MB limit, CSV only
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'text/csv' || file.originalname.endsWith('.csv')) {
      cb(null, true);
    } else {
      cb(new AppError('Only CSV files are accepted', 400));
    }
  },
});

// ── Expose multer upload for use in routes ─────────────────────────────────
const csvUpload = upload.single('file');

// ═══════════════════════════════════════════════════════════════════════════
// USERS
// ═══════════════════════════════════════════════════════════════════════════

const listUsers = asyncHandler(async (req, res) => {
  const result = await adminUsersService.listUsers(req.query);
  res.json(result);
});

const getUserById = asyncHandler(async (req, res) => {
  const user = await adminUsersService.getUserById(req.params.id);
  res.json(user);
});

const createUser = asyncHandler(async (req, res) => {
  const user = await adminUsersService.createUser(req.body);
  res.locals.auditEntityId = user.id;
  res.status(201).json(user);
});

const updateUser = asyncHandler(async (req, res) => {
  const user = await adminUsersService.updateUser(req.params.id, req.body);
  res.locals.auditEntityId = user?.id;
  res.locals.auditMetadata = { fields: Object.keys(req.body) };
  res.json(user);
});

const assignRole = asyncHandler(async (req, res) => {
  const { roleId, unitId } = req.body;
  const result = await adminUsersService.assignRole(req.params.id, roleId, unitId);
  res.locals.auditEntityId = req.params.id;
  res.locals.auditMetadata = { roleId, unitId };
  res.status(201).json(result);
});

const removeRole = asyncHandler(async (req, res) => {
  const result = await adminUsersService.removeRole(req.params.id, req.params.roleId);
  res.locals.auditEntityId = req.params.id;
  res.locals.auditMetadata = { roleId: req.params.roleId };
  res.json({ success: true, removed: result });
});

const bulkAssignRoles = asyncHandler(async (req, res) => {
  const { userIds, roleId, unitId } = req.body;
  const result = await adminUsersService.bulkAssignRole(userIds, roleId, unitId);
  res.locals.auditMetadata = { userIds, roleId, count: result.length };
  res.json({ success: true, assigned: result.length });
});

const bulkDeactivate = asyncHandler(async (req, res) => {
  const { userIds } = req.body;
  const result = await adminUsersService.bulkDeactivate(userIds);
  res.locals.auditMetadata = { userIds, count: result.length };
  res.json({ success: true, deactivated: result.length });
});

const importUsers = asyncHandler(async (req, res) => {
  if (!req.file) throw new AppError('No file uploaded', 400);
  const result = await adminUsersService.importUsers(req.file.buffer);
  res.locals.auditMetadata = { inserted: result.inserted, updated: result.updated, errors: result.errors.length };
  res.json(result);
});

const listRoles = asyncHandler(async (req, res) => {
  res.json(await adminUsersService.listRoles());
});

// ═══════════════════════════════════════════════════════════════════════════
// ACADEMIC YEARS
// ═══════════════════════════════════════════════════════════════════════════

const listAcademicYears = asyncHandler(async (req, res) => {
  res.json(await adminAcademicYearsService.list());
});

const createAcademicYear = asyncHandler(async (req, res) => {
  const { label, start_date, end_date } = req.body;
  const year = await adminAcademicYearsService.create(label, start_date, end_date);
  res.locals.auditEntityId = year.id;
  res.locals.auditMetadata = { label };
  res.status(201).json(year);
});

const updateAcademicYear = asyncHandler(async (req, res) => {
  const { label, start_date, end_date } = req.body;
  const year = await adminAcademicYearsService.update(req.params.id, label, start_date, end_date);
  res.locals.auditEntityId = year.id;
  res.locals.auditMetadata = { label };
  res.json(year);
});

const activateAcademicYear = asyncHandler(async (req, res) => {
  const year = await adminAcademicYearsService.activate(req.params.id);
  res.locals.auditEntityId = year.id;
  res.locals.auditMetadata = { label: year.label };
  res.json(year);
});

// ═══════════════════════════════════════════════════════════════════════════
// UNITS
// ═══════════════════════════════════════════════════════════════════════════

const getCoachingSummary = asyncHandler(async (req, res) => {
  res.json(await adminUnitsService.getCoachingSummary(req.query.academicYearId));
});

const getCoachingCoaches = asyncHandler(async (req, res) => {
  res.json(await adminUnitsService.getCoachingCoaches(req.query.academicYearId));
});

const getCounsellingSummary = asyncHandler(async (req, res) => {
  res.json(await adminUnitsService.getCounsellingSummary(req.query.academicYearId));
});

const getCounsellingCases = asyncHandler(async (req, res) => {
  res.json(await adminUnitsService.getCounsellingCases(req.query.academicYearId, req.query.status));
});

const getCounsellors = asyncHandler(async (req, res) => {
  res.json(await adminUnitsService.getCounsellors(req.query.academicYearId));
});

const assignCounsellingCase = asyncHandler(async (req, res) => {
  const result = await adminUnitsService.assignCounsellingCase({
    ...req.body,
    assignedBy: req.user.id
  });
  res.locals.auditEntityId = result.id;
  res.locals.auditMetadata = { studentSchoolId: req.body.studentSchoolId, peerCounsellorId: req.body.peerCounsellorId };
  res.status(201).json(result);
});

const resolveCounsellingCase = asyncHandler(async (req, res) => {
  const result = await adminUnitsService.resolveCounsellingCase(req.params.id);
  res.locals.auditEntityId = req.params.id;
  res.json(result);
});

const getAdvisingSummary = asyncHandler(async (req, res) => {
  res.json(await adminUnitsService.getAdvisingSummary(req.query.academicYearId));
});

const getBuddyUpSummary = asyncHandler(async (req, res) => {
  res.json(await adminUnitsService.getBuddyUpSummary(req.query.academicYearId));
});

const triggerBuddyUpSync = asyncHandler(async (req, res) => {
  const result = await adminUnitsService.triggerBuddyUpSync(req.user.id, req.body.academicYearId);
  res.locals.auditMetadata = { synced: result.synced };
  res.json(result);
});

const getBuddyUpSyncStatus = asyncHandler(async (req, res) => {
  res.json(await adminUnitsService.getSyncStatus());
});

// ═══════════════════════════════════════════════════════════════════════════
// CLUBS
// ═══════════════════════════════════════════════════════════════════════════

const listClubs = asyncHandler(async (req, res) => {
  res.json(await adminClubsService.list(req.query));
});

const createClub = asyncHandler(async (req, res) => {
  const club = await adminClubsService.create(req.body);
  res.locals.auditEntityId = club.id;
  res.locals.auditMetadata = { name: club.name };
  res.status(201).json(club);
});

const updateClub = asyncHandler(async (req, res) => {
  const club = await adminClubsService.update(req.params.id, req.body);
  res.locals.auditEntityId = club.id;
  res.json(club);
});

const deleteClub = asyncHandler(async (req, res) => {
  await adminClubsService.softDelete(req.params.id);
  res.locals.auditEntityId = req.params.id;
  res.json({ success: true });
});

const getClubMembers = asyncHandler(async (req, res) => {
  res.json(await adminClubsService.getMembers(req.params.id, req.query));
});

const getClubPosts = asyncHandler(async (req, res) => {
  res.json(await adminClubsService.getPosts(req.params.id, req.query));
});

const reassignClubLead = asyncHandler(async (req, res) => {
  const club = await adminClubsService.reassignLead(req.params.id, req.body.newLeadUserId);
  res.locals.auditEntityId = req.params.id;
  res.locals.auditMetadata = { newLeadUserId: req.body.newLeadUserId };
  res.json(club);
});

// ═══════════════════════════════════════════════════════════════════════════
// OFFICES
// ═══════════════════════════════════════════════════════════════════════════

const listOffices = asyncHandler(async (req, res) => {
  res.json(await adminOfficesService.list());
});

const createOffice = asyncHandler(async (req, res) => {
  const office = await adminOfficesService.create(req.body);
  res.locals.auditEntityId = office.id;
  res.locals.auditMetadata = { name: office.name };
  res.status(201).json(office);
});

const updateOffice = asyncHandler(async (req, res) => {
  const office = await adminOfficesService.update(req.params.id, req.body);
  res.locals.auditEntityId = req.params.id;
  res.json(office);
});

const addOfficeStaff = asyncHandler(async (req, res) => {
  const { userId, title } = req.body;
  const result = await adminOfficesService.addStaff(req.params.id, userId, title);
  res.locals.auditEntityId = req.params.id;
  res.locals.auditMetadata = { userId, title };
  res.status(201).json(result);
});

const removeOfficeStaff = asyncHandler(async (req, res) => {
  const result = await adminOfficesService.removeStaff(req.params.id, req.params.userId);
  res.locals.auditEntityId = req.params.id;
  res.locals.auditMetadata = { userId: req.params.userId };
  res.json({ success: true, removed: result });
});

const addOfficeLink = asyncHandler(async (req, res) => {
  const { label, url } = req.body;
  const result = await adminOfficesService.addLink(req.params.id, label, url);
  res.locals.auditEntityId = req.params.id;
  res.status(201).json(result);
});

const removeOfficeLink = asyncHandler(async (req, res) => {
  const result = await adminOfficesService.removeLink(req.params.linkId, req.params.id);
  res.locals.auditEntityId = req.params.id;
  res.json({ success: true, removed: result });
});

// ═══════════════════════════════════════════════════════════════════════════
// FEED / GROUPS / EVENTS
// ═══════════════════════════════════════════════════════════════════════════

const listPosts = asyncHandler(async (req, res) => {
  res.json(await adminFeedService.listPosts(req.query));
});

const deletePost = asyncHandler(async (req, res) => {
  // Note: audit log for post removal is written INSIDE adminFeedService.deletePost
  // (it snapshots content before deletion). The auditAction middleware is NOT
  // applied to this route because the service owns the audit entry.
  const result = await adminFeedService.deletePost(req.params.id, req.user.id, req.ip);
  res.json({ success: true, id: result.id });
});

const createPost = asyncHandler(async (req, res) => {
  const post = await adminFeedService.createPost({ ...req.body, authorId: req.user.id });
  res.locals.auditEntityId = post.id;
  res.status(201).json(post);
});

const listGroups = asyncHandler(async (req, res) => {
  res.json(await adminFeedService.listGroups(req.query));
});

const createGroup = asyncHandler(async (req, res) => {
  const group = await adminFeedService.createGroup(req.body);
  res.locals.auditEntityId = group.id;
  res.status(201).json(group);
});

const addGroupMembers = asyncHandler(async (req, res) => {
  const result = await adminFeedService.addGroupMembers(req.params.id, req.body.userIds);
  res.locals.auditEntityId = req.params.id;
  res.locals.auditMetadata = { count: result.added };
  res.json(result);
});

const listEvents = asyncHandler(async (req, res) => {
  res.json(await adminFeedService.listEvents(req.query));
});

const updateEvent = asyncHandler(async (req, res) => {
  const event = await adminFeedService.updateEvent(req.params.id, req.body);
  res.locals.auditEntityId = req.params.id;
  res.locals.auditMetadata = { fields: Object.keys(req.body) };
  res.json(event);
});

// ═══════════════════════════════════════════════════════════════════════════
// AUDIT LOG
// ═══════════════════════════════════════════════════════════════════════════

const getAuditLog = asyncHandler(async (req, res) => {
  res.json(await adminAuditLogRepository.list(req.query));
});

// ═══════════════════════════════════════════════════════════════════════════
// ANALYTICS
// ═══════════════════════════════════════════════════════════════════════════

const getAnalyticsOverview = asyncHandler(async (req, res) => {
  res.json(await adminAnalyticsService.getOverview(req.query.academicYearId));
});

const getUnitComparison = asyncHandler(async (req, res) => {
  res.json(await adminAnalyticsService.getUnitComparison(req.query.academicYearId));
});

const getCohortSpeed = asyncHandler(async (req, res) => {
  res.json(await adminAnalyticsService.getCohortSpeed(req.query.academicYearId, req.query.unit));
});

const getMonthlySessions = asyncHandler(async (req, res) => {
  res.json(await adminAnalyticsService.getMonthlySessions(req.query.academicYearId));
});

const getTopClubs = asyncHandler(async (req, res) => {
  res.json(await adminAnalyticsService.getTopClubs());
});

const exportAnalytics = asyncHandler(async (req, res) => {
  // Pass the Express response object directly to the service for streaming
  await adminAnalyticsService.exportData(res, req.query.academicYearId);
});

// ═══════════════════════════════════════════════════════════════════════════
// NOTIFICATIONS
// ═══════════════════════════════════════════════════════════════════════════

const getNotificationCategories = asyncHandler(async (req, res) => {
  const [stats, defaults] = await Promise.all([
    adminSettingsService.getCategoryStats(),
    adminSettingsService.getCategoryDefaults(),
  ]);
  res.json({ stats, defaults });
});

const updateNotificationCategoryDefault = asyncHandler(async (req, res) => {
  const { enabled } = req.body;
  const result = await adminSettingsService.updateCategoryDefault(req.params.key, enabled);
  res.locals.auditEntityId = null;
  res.locals.auditMetadata = { key: req.params.key, enabled };
  res.json(result);
});

// ═══════════════════════════════════════════════════════════════════════════
// SETTINGS & ADMINS
// ═══════════════════════════════════════════════════════════════════════════

const getSettings = asyncHandler(async (req, res) => {
  const settings = await adminSettingsService.getSettings();
  // Mask credentials — never return full secrets
  const safe = settings.map(s => {
    const val = { ...s.value };
    if (val.api_key) val.api_key = '****' + String(val.api_key).slice(-4);
    if (val.secret)  val.secret  = '****' + String(val.secret).slice(-4);
    return { ...s, value: val };
  });
  res.json(safe);
});

const updateSetting = asyncHandler(async (req, res) => {
  const setting = await adminSettingsService.updateSetting(req.params.key, req.body.value, req.user.id);
  res.locals.auditEntityId = null;
  res.locals.auditMetadata = { key: req.params.key };
  res.json({ success: true, setting });
});

const listAdmins = asyncHandler(async (req, res) => {
  res.json(await adminSettingsService.listAdmins());
});

const grantPlatformAdmin = asyncHandler(async (req, res) => {
  const { userId } = req.body;
  const result = await adminSettingsService.grantPlatformAdmin(userId, req.user.id);
  res.locals.auditEntityId = userId;
  res.locals.auditMetadata = { grantedBy: req.user.id };
  res.status(201).json({ success: true, result });
});

const revokePlatformAdmin = asyncHandler(async (req, res) => {
  await adminSettingsService.revokePlatformAdmin(req.params.userId, req.user.id);
  res.locals.auditEntityId = req.params.userId;
  res.locals.auditMetadata = { revokedBy: req.user.id };
  res.json({ success: true });
});

// ─────────────────────────────────────────────────────────────────────────────

module.exports = {
  // Users
  listUsers, getUserById, createUser, updateUser, assignRole, removeRole,
  bulkAssignRoles, bulkDeactivate, importUsers, listRoles, csvUpload,
  // Academic Years
  listAcademicYears, createAcademicYear, updateAcademicYear, activateAcademicYear,
  // Units
  getCoachingSummary, getCoachingCoaches, getCounsellingSummary,
  getCounsellingCases, getCounsellors, assignCounsellingCase, resolveCounsellingCase,
  getAdvisingSummary, getBuddyUpSummary, triggerBuddyUpSync, getBuddyUpSyncStatus,
  // Clubs
  listClubs, createClub, updateClub, deleteClub, getClubMembers, getClubPosts, reassignClubLead,
  // Offices
  listOffices, createOffice, updateOffice, addOfficeStaff, removeOfficeStaff, addOfficeLink, removeOfficeLink,
  // Feed / Groups / Events
  listPosts, deletePost, createPost, listGroups, createGroup, addGroupMembers, listEvents, updateEvent,
  // Audit
  getAuditLog,
  // Analytics
  getAnalyticsOverview, getUnitComparison, getCohortSpeed, getMonthlySessions, getTopClubs, exportAnalytics,
  // Notifications
  getNotificationCategories, updateNotificationCategoryDefault,
  // Settings & Admins
  getSettings, updateSetting, listAdmins, grantPlatformAdmin, revokePlatformAdmin,
};
