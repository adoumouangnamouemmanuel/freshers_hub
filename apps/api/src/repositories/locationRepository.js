const { pool } = require("../services/db");

const locationRepository = {
  async getLocations() {
    const { rows } = await pool.query(`
      SELECT 
        id, 
        name, 
        short_name as "shortName", 
        category, 
        building, 
        description, 
        icon, 
        emoji, 
        hours, 
        latitude, 
        longitude,
        floor_level,
        images
      FROM locations
      ORDER BY category ASC, name ASC
    `);
    
    // Map latitude and longitude into a coordinate object for the frontend
    return rows.map(loc => ({
      ...loc,
      latitude: parseFloat(loc.latitude),
      longitude: parseFloat(loc.longitude),
      coordinate: {
        latitude: parseFloat(loc.latitude),
        longitude: parseFloat(loc.longitude)
      }
    }));
  }
};

module.exports = locationRepository;
