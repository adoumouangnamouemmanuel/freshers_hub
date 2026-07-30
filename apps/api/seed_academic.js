const { pool } = require('./src/services/db');

const academic = [
  { 
    name: 'Apt Hall', 
    short_name: 'Apt Hall', 
    category: 'Academic',
    lon: -0.2198049, 
    lat: 5.7594346,
    description: 'Academic block housing various classrooms and faculty offices.',
    icon: 'building.columns.fill',
    emoji: '🏛️'
  },
  { 
    name: 'Jackson Hall', 
    short_name: 'Jackson Hall', 
    category: 'Academic',
    lon: -0.2201789, 
    lat: 5.7595239,
    description: 'A key academic building with lecture halls and seminar rooms.',
    icon: 'building.columns.fill',
    emoji: '🏛️'
  },
  { 
    name: 'Databank Foundation Hall', 
    short_name: 'Databank Hall', 
    category: 'Academic',
    lon: -0.2200698, 
    lat: 5.7592491,
    description: 'A central academic facility for students and staff.',
    icon: 'building.columns.fill',
    emoji: '🏛️'
  },
  { 
    name: 'Nutor Hall', 
    short_name: 'Nutor Hall', 
    category: 'Academic',
    lon: -0.219742, 
    lat: 5.7589484,
    description: 'Academic hall providing spaces for lectures and group work.',
    icon: 'building.columns.fill',
    emoji: '🏛️'
  },
  { 
    name: 'King Engineering Building', 
    short_name: 'Engineering Bldg', 
    category: 'Academic',
    lon: -0.2194715, 
    lat: 5.7593855,
    description: 'State-of-the-art facility for the Engineering department.',
    icon: 'building.2.fill',
    emoji: '⚙️'
  }
];

async function seed() {
  try {
    for (const a of academic) {
      await pool.query(`
        INSERT INTO locations (
          id, name, short_name, category, building, description, 
          icon, emoji, hours, latitude, longitude, floor_level, images
        )
        VALUES (
          gen_random_uuid(), $1, $2, $3, $1, $4, 
          $5, $6, '8:00 AM - 8:00 PM', $7, $8, 0, 
          '["https://images.unsplash.com/photo-1541339907198-e08756dedf3f?w=800&q=80"]'
        )
      `, [a.name, a.short_name, a.category, a.description, a.icon, a.emoji, a.lat, a.lon]);
    }
    
    console.log("Academic locations seeded successfully!");
  } catch (err) {
    console.error(err);
  } finally {
    pool.end();
  }
}

seed();
