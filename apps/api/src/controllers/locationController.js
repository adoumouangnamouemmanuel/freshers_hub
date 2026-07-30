const locationRepository = require("../repositories/locationRepository");

const locationController = {
  async getLocations(req, res, next) {
    try {
      const rawLocations = await locationRepository.getLocations();
      const locations = rawLocations.map(loc => {
        let isOpen = true; // Placeholder for complex hours parsing logic
        if (loc.hours && loc.hours.toLowerCase().includes('closed')) {
           isOpen = false;
        }
        return { ...loc, isOpen };
      });
      res.json({ locations });
    } catch (err) {
      next(err);
    }
  }
};

module.exports = locationController;
