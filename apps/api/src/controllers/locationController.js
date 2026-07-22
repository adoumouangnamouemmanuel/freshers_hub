const locationRepository = require("../repositories/locationRepository");

const locationController = {
  async getLocations(req, res, next) {
    try {
      const locations = await locationRepository.getLocations();
      res.json({ locations });
    } catch (err) {
      next(err);
    }
  }
};

module.exports = locationController;
