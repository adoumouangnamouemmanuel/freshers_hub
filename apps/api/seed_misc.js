const { pool } = require('./src/services/db');

const locations = [
  { 
    name: 'Admin Car Park', 
    short_name: 'Admin Parking', 
    lon: -0.2204332246989333, 
    lat: 5.759886198428387,
    category: 'Services',
    icon: 'parkingsign',
    emoji: '🅿️',
    description: 'Parking area for administrative staff.',
  },
  { 
    name: 'Collins Courtyard', 
    short_name: 'Courtyard', 
    lon: -0.22002757010996465, 
    lat: 5.759399534323467,
    category: 'Recreation',
    icon: 'leaf',
    emoji: '🌳',
    description: 'A central outdoor space for students and staff to relax and gather.',
  },
  { 
    name: 'NORTON-MOTULSKY HALL A', 
    short_name: 'Norton-Motulsky A', 
    lon: -0.21943294917496572, 
    lat: 5.759404864800969,
    category: 'Academic',
    icon: 'book',
    emoji: '📚',
    description: 'An academic building hosting various lectures and faculty offices.',
  },
  { 
    name: 'Staff Eatery', 
    short_name: 'Eatery', 
    lon: -0.2196823423619204, 
    lat: 5.758677086478208,
    category: 'Dining',
    icon: 'fork.knife',
    emoji: '🍽️',
    description: 'Dining area for university staff and faculty.',
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
    
    console.log("Miscellaneous locations seeded successfully!");
  } catch (err) {
    console.error(err);
  } finally {
    pool.end();
  }
}

seed();
