const adminClubsRepository = require('../repositories/adminClubsRepository');
const AppError = require('../utils/AppError');

const list       = (filters) => adminClubsRepository.list(filters);
const create     = (data)    => adminClubsRepository.create(data);
const getMembers = (id, pagination) => adminClubsRepository.getMembers(id, pagination);
const getPosts   = (id, pagination) => adminClubsRepository.getPosts(id, pagination);

const update = async (id, fields) => {
  const club = await adminClubsRepository.getById(id);
  if (!club) throw new AppError('Club not found', 404);
  return adminClubsRepository.update(id, fields);
};

const softDelete = async (id) => {
  const club = await adminClubsRepository.getById(id);
  if (!club) throw new AppError('Club not found', 404);
  return adminClubsRepository.softDelete(id);
};

const reassignLead = async (id, newLeadUserId) => {
  const club = await adminClubsRepository.getById(id);
  if (!club) throw new AppError('Club not found', 404);
  return adminClubsRepository.reassignLead(id, newLeadUserId);
};

module.exports = { list, create, update, softDelete, reassignLead, getMembers, getPosts };
