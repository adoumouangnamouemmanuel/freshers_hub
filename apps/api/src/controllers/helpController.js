const helpService = require("../services/helpService");
const asyncHandler = require("../utils/asyncHandler");

const getOffices = asyncHandler(async (req, res) => {
  const offices = await helpService.getOffices();
  res.json({ success: true, data: offices });
});

const getOfficeById = asyncHandler(async (req, res) => {
  const office = await helpService.getOfficeById(req.params.id);
  res.json({ success: true, data: office });
});

module.exports = {
  getOffices,
  getOfficeById
};
