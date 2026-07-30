const { pool } = require('./src/services/db');

const hostels = [
  { 
    name: 'Hostel 2E', 
    short_name: '2E', 
    lon: -0.22087290600572437, 
    lat: 5.757203426049161,
    description: 'A modern student residence offering comfortable living arrangements and easy campus access.',
  },
  { 
    name: 'Hostel 2E Building E1', 
    short_name: '2E-E1', 
    lon: -0.22064662372123753, 
    lat: 5.75729273041277,
    description: 'Building E1, located within the Hostel 2E complex.',
  },
  { 
    name: 'Hostel 2E Building E2', 
    short_name: '2E-E2', 
    lon: -0.22096684597683186, 
    lat: 5.757254586453043,
    description: 'Building E2, located within the Hostel 2E complex.',
  },
  { 
    name: 'Hostel 2E Building E3', 
    short_name: '2E-E3', 
    lon: -0.22106882660971017, 
    lat: 5.757103516380094,
    description: 'Building E3, located within the Hostel 2E complex.',
  },
  { 
    name: 'Hostel 2E Building E4', 
    short_name: '2E-E4', 
    lon: -0.22090140132735028, 
    lat: 5.757112569684546,
    description: 'Building E4, located within the Hostel 2E complex.',
  },
  { 
    name: 'Hostel 2E Building E5', 
    short_name: '2E-E5', 
    lon: -0.22067756100168737, 
    lat: 5.757138824266805,
    description: 'Building E5, located within the Hostel 2E complex.',
  },
  { 
    name: 'Hostel 2E Lobby', 
    short_name: '2E Lobby', 
    lon: -0.22082445276009582, 
    lat: 5.757292956753343,
    description: 'The main lobby and reception area for Hostel 2E.',
  }
];

async function seed() {
  try {
    for (const h of hostels) {
      await pool.query(`
        INSERT INTO locations (
          id, name, short_name, category, building, description, 
          icon, emoji, hours, latitude, longitude, floor_level, images
        )
        VALUES (
          gen_random_uuid(), $1, $2, 'Hostel', $1, $3, 
          'bed.double.fill', '🛏️', '24/7', $4, $5, 0, 
          '["https://images.unsplash.com/photo-1555854877-bab0e564b8d5?w=800&q=80"]'
        )
      `, [h.name, h.short_name, h.description, h.lat, h.lon]);
    }
    
    console.log("Hostel 2E richly seeded successfully!");
  } catch (err) {
    console.error(err);
  } finally {
    pool.end();
  }
}

seed();
