const { pool } = require('./src/services/db');

const sports = [
  { 
    name: 'Old Basketball Court', 
    short_name: 'Old Court', 
    lon: -0.2207004, 
    lat: 5.7587557,
    description: 'The original basketball court, perfect for pickup games and practice sessions.',
    icon: 'basketball.fill',
    emoji: '🏀'
  },
  { 
    name: 'New Basketball Court', 
    short_name: 'New Court', 
    lon: -0.2207221, 
    lat: 5.7577415,
    description: 'A modern, recently built basketball court with excellent surfacing for competitive matches.',
    icon: 'basketball.fill',
    emoji: '🏀'
  },
  { 
    name: 'Ashesi Football Pitch', 
    short_name: 'Football Pitch', 
    lon: -0.2167673, 
    lat: 5.7575062,
    description: 'The main grass field for soccer matches, intramural games, and outdoor sports.',
    icon: 'soccerball',
    emoji: '⚽'
  },
  { 
    name: 'The Gym', 
    short_name: 'Gym', 
    lon: -0.2172430, 
    lat: 5.7577561,
    description: 'Fully equipped fitness center with weights, cardio machines, and training equipment.',
    icon: 'dumbbell.fill',
    emoji: '🏋️‍♂️'
  }
];

async function seed() {
  try {
    for (const h of sports) {
      await pool.query(`
        INSERT INTO locations (
          id, name, short_name, category, building, description, 
          icon, emoji, hours, latitude, longitude, floor_level, images
        )
        VALUES (
          gen_random_uuid(), $1, $2, 'Recreation', $1, $3, 
          $4, $5, '24/7', $6, $7, 0, 
          '["https://images.unsplash.com/photo-1579952363873-27f3bade9f55?w=800&q=80"]'
        )
      `, [h.name, h.short_name, h.description, h.icon, h.emoji, h.lat, h.lon]);
    }
    
    console.log("Sports locations seeded successfully!");
  } catch (err) {
    console.error(err);
  } finally {
    pool.end();
  }
}

seed();
