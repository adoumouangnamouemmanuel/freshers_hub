const { pool } = require('./src/services/db');

const hostels = [
  { 
    name: 'Walter Sisulu Hostel', 
    short_name: 'Sisulu', 
    lon: -0.2209488, 
    lat: 5.7587643,
    description: 'A vibrant student residence offering modern amenities and a strong community spirit, named after the prominent South African anti-apartheid activist.',
  },
  { 
    name: 'Oteng Korankye II Hostel', 
    short_name: 'Oteng', 
    lon: -0.2208933, 
    lat: 5.7592046,
    description: 'Named in honor of the Chief of Berekuso, providing a comfortable and serene living environment for students.',
  },
  { 
    name: 'Sutherland Hostel', 
    short_name: 'Sutherland', 
    lon: -0.2205702, 
    lat: 5.7592006,
    description: 'A welcoming residential space dedicated to fostering student collaboration, named in honor of Efua Sutherland.',
  },
  { 
    name: 'Kofi Tawiah Hostel', 
    short_name: 'Tawiah', 
    lon: -0.2210543, 
    lat: 5.7580904,
    description: 'A premium student housing facility with excellent study spaces and recreational areas.',
  },
  { 
    name: 'Hostel 2D', 
    short_name: '2D', 
    lon: -0.2210569, 
    lat: 5.7575541,
    description: 'Part of the newer residential blocks, offering modern living spaces with great views of the campus.',
  },
  { 
    name: 'Hostel 2C', 
    short_name: '2C', 
    lon: -0.2203825, 
    lat: 5.7575558,
    description: 'A contemporary student residence block situated in the beautiful lower section of the campus.',
  },
  { 
    name: 'Wangari Maathai Hostel', 
    short_name: 'Maathai', 
    lon: -0.2204607, 
    lat: 5.7580956,
    description: 'An eco-friendly student residence celebrating the legacy of the renowned environmental activist.',
  },
  { 
    name: 'Amu Hostel', 
    short_name: 'Amu', 
    lon: -0.2205126, 
    lat: 5.7587585,
    description: 'A dynamic living space named in honor of Ephraim Amu, blending rich heritage with modern student life.',
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
    
    console.log("Richly seeded successfully!");
  } catch (err) {
    console.error(err);
  } finally {
    pool.end();
  }
}

seed();
