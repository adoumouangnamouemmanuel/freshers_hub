const adminNotificationsRepository = require('../repositories/adminNotificationsRepository');
const adminSettingsRepository      = require('../repositories/adminSettingsRepository');
const AppError = require('../utils/AppError');

const getCategoryStats    = ()             => adminNotificationsRepository.getCategoryStats();
const getCategoryDefaults = ()             => adminNotificationsRepository.getCategoryDefaults();
const updateCategoryDefault = (key, enabled) => adminNotificationsRepository.updateCategoryDefault(key, enabled);

const SETTINGS_KEYS = ['whatsapp_tracking', 'odip_integration', 'push_notifications'];

const getSettings = () => adminSettingsRepository.getAll(SETTINGS_KEYS);

const updateSetting = async (key, value, updatedBy) => {
  if (!SETTINGS_KEYS.includes(key)) throw new AppError(`Unknown setting key: ${key}`, 400);
  return adminSettingsRepository.set(key, value, updatedBy);
};

const listAdmins = () => adminSettingsRepository.listAdmins();

const grantPlatformAdmin = async (userId, grantedBy) => {
  const result = await adminSettingsRepository.grantPlatformAdmin(userId, grantedBy);
  if (!result) throw new AppError('User already has platform_admin role', 409);
  return result;
};

const revokePlatformAdmin = async (userId, revokedBy) => {
  if (userId === revokedBy) throw new AppError('Cannot revoke your own platform_admin role', 400);
  const result = await adminSettingsRepository.revokePlatformAdmin(userId);
  if (!result) throw new AppError('User does not have platform_admin role', 404);
  return result;
};

module.exports = {
  getCategoryStats, getCategoryDefaults, updateCategoryDefault,
  getSettings, updateSetting,
  listAdmins, grantPlatformAdmin, revokePlatformAdmin,
};
