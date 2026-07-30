const { pool } = require('./src/services/db');

const dining = [
  { 
    name: 'Munchies', 
    short_name: 'Munchies', 
    category: 'Dining',
    lon: -0.2215233, 
    lat: 5.7591191,
    description: 'Campus cafeteria offering a variety of meals and snacks.',
    icon: 'fork.knife',
    emoji: '🍽️'
  },
  { 
    name: 'Hallmark', 
    short_name: 'Hallmark', 
    category: 'Dining',
    lon: -0.2199087, 
    lat: 5.7585207,
    description: 'A popular spot for delicious food and refreshing drinks.',
    icon: 'cup.and.saucer.fill',
    emoji: '☕'
  },
  { 
    name: 'Akorno', 
    short_name: 'Akorno', 
    category: 'Dining',
    lon: -0.219734, 
    lat: 5.7583421,
    description: 'Campus dining option perfect for quick bites between classes.',
    icon: 'takeoutbag.and.cup.and.straw.fill',
    emoji: '🍔'
  }
];

async function seed() {
  try {
    for (const d of dining) {
      await pool.query(`
        INSERT INTO locations (
          id, name, short_name, category, building, description, 
          icon, emoji, hours, latitude, longitude, floor_level, images
        )
        VALUES (
          gen_random_uuid(), $1, $2, $3, $1, $4, 
          $5, $6, '8:00 AM - 10:00 PM', $7, $8, 0, 
          '["https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800&q=80"]'
        )
      `, [d.name, d.short_name, d.category, d.description, d.icon, d.emoji, d.lat, d.lon]);
    }
    
    console.log("Dining locations seeded successfully!");
  } catch (err) {
    console.error(err);
  } finally {
    pool.end();
  }
}

seed();
