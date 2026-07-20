const adminOfficesRepository = require('../repositories/adminOfficesRepository');
const AppError = require('../utils/AppError');

const list   = ()    => adminOfficesRepository.list();
const create = (data) => adminOfficesRepository.create(data);

const getById = async (id) => {
  const office = await adminOfficesRepository.getById(id);
  if (!office) throw new AppError('Office not found', 404);
  return office;
};

const update = async (id, fields) => {
  const office = await adminOfficesRepository.getById(id);
  if (!office) throw new AppError('Office not found', 404);
  return adminOfficesRepository.update(id, fields);
};

const addStaff    = (officeId, userId, title)  => adminOfficesRepository.addStaff(officeId, userId, title);
const removeStaff = (officeId, userId)         => adminOfficesRepository.removeStaff(officeId, userId);
const addLink     = (officeId, label, url)     => adminOfficesRepository.addLink(officeId, label, url);
const removeLink  = (linkId, officeId)         => adminOfficesRepository.removeLink(linkId, officeId);

module.exports = { list, getById, create, update, addStaff, removeStaff, addLink, removeLink };
