const { pool } = require('./src/services/db');

const locations = [
  { 
    name: 'The Hive', 
    short_name: 'The Hive', 
    lon: -0.2195835, 
    lat: 5.7584759,
    category: 'Recreation',
    icon: 'gamecontroller',
    emoji: '🐝',
    description: 'A popular student spot on campus.',
  },
  { 
    name: 'Ashesi Wastewater treatment facility', 
    short_name: 'Wastewater', 
    lon: -0.2215963, 
    lat: 5.7582886,
    category: 'Services',
    icon: 'drop.triangle',
    emoji: '💧',
    description: 'Campus wastewater treatment and management facility.',
  }
];

async function seed() {
  try {
    for (const l of locations) {
      await pool.query(`
        INSERT INTO locations (
          id, name, short_name, category, building, description, 
          icon, emoji, hours, latitude, longitude, floor_level, images
        )
        VALUES (
          gen_random_uuid(), $1, $2, $3, $1, $4, 
          $5, $6, 'Daytime', $7, $8, 0, 
          '[]'
        )
      `, [l.name, l.short_name, l.category, l.description, l.icon, l.emoji, l.lat, l.lon]);
    }
    
    console.log("Mapbox locations seeded successfully!");
  } catch (err) {
    console.error(err);
  } finally {
    pool.end();
  }
}

seed();
