/**
 * Admin Users Service — business logic layer.
 * Controllers call this; this calls the repository.
 */

const adminUsersRepository = require('../repositories/adminUsersRepository');
const AppError = require('../utils/AppError');
const { parse } = require('csv-parse/sync');

const listUsers = async (filters) => {
  return adminUsersRepository.listUsers(filters);
};

const getUserById = async (id) => {
  const user = await adminUsersRepository.getUserById(id);
  if (!user) throw new AppError('User not found', 404);
  return user;
};

const updateUser = async (id, fields) => {
  const user = await adminUsersRepository.getUserById(id);
  if (!user) throw new AppError('User not found', 404);
  return adminUsersRepository.updateUser(id, fields);
};

const assignRole = async (userId, roleId, unitId) => {
  const user = await adminUsersRepository.getUserById(userId);
  if (!user) throw new AppError('User not found', 404);
  return adminUsersRepository.assignRole(userId, roleId, unitId);
};

const removeRole = async (userId, roleId) => {
  const removed = await adminUsersRepository.removeRole(userId, roleId);
  if (!removed) throw new AppError('Role assignment not found', 404);
  return removed;
};

const bulkAssignRole = async (userIds, roleId, unitId) => {
  if (!userIds?.length) throw new AppError('No users specified', 400);
  return adminUsersRepository.bulkAssignRole(userIds, roleId, unitId);
};

const bulkDeactivate = async (userIds) => {
  if (!userIds?.length) throw new AppError('No users specified', 400);
  return adminUsersRepository.deactivateUsers(userIds);
};

const listRoles = async () => {
  return adminUsersRepository.listRoles();
};

/**
 * Parse CSV buffer and import rows.
 * Returns { inserted, updated, errors[] }.
 */
const importUsers = async (fileBuffer) => {
  let rows;
  try {
    rows = parse(fileBuffer, {
      columns: true,          // First row is header
      skip_empty_lines: true,
      trim: true,
      bom: true,
    });
  } catch (err) {
    throw new AppError(`CSV parse error: ${err.message}`, 400);
  }

  if (!rows.length) throw new AppError('CSV file is empty', 400);

  return adminUsersRepository.importUsers(rows);
};

const createUser = async (fields) => {
  if (!fields.email || !fields.full_name) {
    throw new AppError('Email and full_name are required', 400);
  }
  return adminUsersRepository.createUser(fields);
};

module.exports = { listUsers, getUserById, createUser, updateUser, assignRole, removeRole, bulkAssignRole, bulkDeactivate, listRoles, importUsers };
