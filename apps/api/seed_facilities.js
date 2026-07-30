const { pool } = require('./src/services/db');

const facilities = [
  { 
    name: 'Fab Lab', 
    short_name: 'Fab Lab', 
    category: 'Academic',
    lon: -0.2182589, 
    lat: 5.7595383,
    description: 'A fabrication laboratory for innovation, prototyping, and invention.',
    icon: 'hammer.fill',
    emoji: '🛠️'
  },
  { 
    name: 'Natemba Health Centre', 
    short_name: 'Health Centre', 
    category: 'Services',
    lon: -0.2179856, 
    lat: 5.7593537,
    description: 'On-campus medical facility providing comprehensive health and wellness services.',
    icon: 'cross.case.fill',
    emoji: '🏥'
  },
  { 
    name: 'Engineering Workshop', 
    short_name: 'Engineering', 
    category: 'Academic',
    lon: -0.2176384, 
    lat: 5.7591433,
    description: 'A dedicated workspace for engineering students to work on practical projects.',
    icon: 'building.2.fill',
    emoji: '⚙️'
  },
  { 
    name: 'Warren Library', 
    short_name: 'Library', 
    category: 'Academic',
    lon: -0.2197293, 
    lat: 5.7597803,
    description: 'The main library offering a quiet space for study, research, and collaboration.',
    icon: 'book.fill',
    emoji: '📚'
  },
  { 
    name: 'Archer Cornfield courtyard', 
    short_name: 'Courtyard', 
    category: 'Recreation',
    lon: -0.2199639, 
    lat: 5.7597398,
    description: 'An open courtyard perfect for relaxation, socializing, and informal meetings.',
    icon: 'building.columns.fill',
    emoji: '⛲'
  }
];

async function seed() {
  try {
    for (const f of facilities) {
      await pool.query(`
        INSERT INTO locations (
          id, name, short_name, category, building, description, 
          icon, emoji, hours, latitude, longitude, floor_level, images
        )
        VALUES (
          gen_random_uuid(), $1, $2, $3, $1, $4, 
          $5, $6, '9:00 AM - 5:00 PM', $7, $8, 0, 
          '["https://images.unsplash.com/photo-1541339907198-e08756dedf3f?w=800&q=80"]'
        )
      `, [f.name, f.short_name, f.category, f.description, f.icon, f.emoji, f.lat, f.lon]);
    }
    
    console.log("Facilities seeded successfully!");
  } catch (err) {
    console.error(err);
  } finally {
    pool.end();
  }
}

seed();
