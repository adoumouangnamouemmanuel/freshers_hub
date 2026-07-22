const helpRepository = require("../repositories/helpRepository");
const AppError = require("../utils/AppError");

const getOffices = async () => {
  return await helpRepository.getOffices();
};

const getOfficeById = async (id) => {
  const office = await helpRepository.getOfficeById(id);
  if (!office) {
    throw new AppError("Office not found", 404);
  }
  return office;
};

module.exports = {
  getOffices,
  getOfficeById
};
