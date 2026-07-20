const adminAcademicYearsRepository = require('../repositories/adminAcademicYearsRepository');
const AppError = require('../utils/AppError');

const list = async () => adminAcademicYearsRepository.list();

const create = async (label, startDate, endDate) => {
  if (new Date(endDate) <= new Date(startDate)) {
    throw new AppError('end_date must be after start_date', 400);
  }
  return adminAcademicYearsRepository.create(label, startDate, endDate);
};

const activate = async (id) => {
  const year = await adminAcademicYearsRepository.getById(id);
  if (!year) throw new AppError('Academic year not found', 404);
  if (year.is_current) throw new AppError('Academic year is already active', 409);
  return adminAcademicYearsRepository.activate(id);
};

const getCurrent = async () => adminAcademicYearsRepository.getCurrent();

module.exports = { list, create, activate, getCurrent };
