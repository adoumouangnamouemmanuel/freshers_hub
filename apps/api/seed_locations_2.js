const { pool } = require('./src/services/db');

const locations = [
  { 
    name: 'New Lobby', 
    short_name: 'New Lobby', 
    category: 'Services',
    lon: -0.2205653, 
    lat: 5.7584623,
    description: 'The main reception and lobby area for visitors and students.',
    icon: 'building.2.fill',
    emoji: '🏢'
  },
  { 
    name: 'Hakuna Cafe', 
    short_name: 'Hakuna Cafe', 
    category: 'Dining',
    lon: -0.2205344, 
    lat: 5.7589727,
    description: 'Campus cafe offering coffee, snacks, and a place to relax.',
    icon: 'cup.and.saucer.fill',
    emoji: '☕'
  },
  { 
    name: 'The Grill', 
    short_name: 'The Grill', 
    category: 'Dining',
    lon: -0.2201204, 
    lat: 5.7589491,
    description: 'A great place to hang out and grab a bite to eat.',
    icon: 'fork.knife',
    emoji: '🍽️'
  },
  { 
    name: 'Ashesi Shop', 
    short_name: 'Shop', 
    category: 'Services',
    lon: -0.2199447, 
    lat: 5.759118,
    description: 'The campus shop for all your stationery and merchandise needs.',
    icon: 'takeoutbag.and.cup.and.straw.fill',
    emoji: '🛒'
  },
  { 
    name: 'Old Lobby', 
    short_name: 'Old Lobby', 
    category: 'Services',
    lon: -0.2205493, 
    lat: 5.759293,
    description: 'The historic lobby of the main building.',
    icon: 'building.2.fill',
    emoji: '🏛️'
  },
  { 
    name: 'Writing Centre', 
    short_name: 'Writing Centre', 
    category: 'Academic',
    lon: -0.2196884, 
    lat: 5.7585958,
    description: 'Support center to help students improve their writing skills.',
    icon: 'pencil',
    emoji: '✍️'
  },
  { 
    name: 'Isolation Wards', 
    short_name: 'Isolation Wards', 
    category: 'Services',
    lon: -0.2212735, 
    lat: 5.7572399,
    description: 'Medical isolation wards for student health and safety.',
    icon: 'cross.case.fill',
    emoji: '🏥'
  }
];

async function seed() {
  try {
    for (const loc of locations) {
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
      `, [loc.name, loc.short_name, loc.category, loc.description, loc.icon, loc.emoji, loc.lat, loc.lon]);
    }
    
    console.log("Locations seeded successfully!");
  } catch (err) {
    console.error(err);
  } finally {
    pool.end();
  }
}

seed();
