const fs = require("fs");
const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../../../.env") });
const { Client } = require("pg");
const crypto = require("crypto");

const databaseUrl = process.env.DATABASE_URL || "postgres://postgres:postgres@localhost:5432/fresher_hub";

function uuidv4() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

async function main() {
  const client = new Client({ connectionString: databaseUrl });
  await client.connect();

  try {
    await client.query("BEGIN");
    
    // Get roles and units
    const { rows: roles } = await client.query("SELECT id, name FROM roles");
    const { rows: units } = await client.query("SELECT id, name FROM units");
    
    const roleMap = roles.reduce((acc, r) => ({...acc, [r.name]: r.id}), {});
    const unitMap = units.reduce((acc, u) => ({...acc, [u.name]: u.id}), {});
    
    const adminId = '44444444-4444-4444-4444-444444444444'; // Yvonne

    console.log("Seeding 6 Peer Coaches...");
    const coaches = [];
    for(let i = 1; i <= 6; i++) {
      const id = uuidv4();
      const year = [2027, 2028, 2029][i % 3];
      coaches.push(id);
      
      await client.query(`
        INSERT INTO users (id, email, full_name, phone, class_year, country, major)
        VALUES ($1, $2, $3, $4, $5, 'Ghana', 'CS')
      `, [id, `coach${i}@ashesi.edu.gh`, `Coach ${i}`, `+23320000001${i}`, year]);
      
      await client.query(`
        INSERT INTO student_profiles (user_id, school_id, identifier, graduation_year)
        VALUES ($1, $2, $3, $4)
      `, [id, `3030${year}${i}`, `C${i}`, year]);
      
      await client.query(`
        INSERT INTO user_roles (user_id, role_id, unit_id, assigned_by)
        VALUES ($1, $2, NULL, NULL), ($1, $3, $4, $5)
      `, [id, roleMap['student'], roleMap['peer_coach'], unitMap['coaching'], adminId]);
      
      await client.query(`
        INSERT INTO credentials (user_id, password_hash, is_activated, activated_at)
        VALUES ($1, NULL, false, NULL)
      `, [id]);
      
      await client.query(`
        INSERT INTO activation_codes (user_id, otp_hash, expires_at)
        VALUES ($1, crypt('123456', gen_salt('bf')), now() + interval '30 days')
      `, [id]);
    }
    
    console.log("Seeding 15 Freshers (2030)...");
    for(let i = 1; i <= 15; i++) {
      const id = uuidv4();
      
      await client.query(`
        INSERT INTO users (id, email, full_name, phone, class_year, country, major)
        VALUES ($1, $2, $3, $4, 2030, 'Ghana', 'CS')
      `, [id, `fresher${i}@ashesi.edu.gh`, `Extra Fresher ${i}`, `+23320000002${i}`]);
      
      await client.query(`
        INSERT INTO student_profiles (user_id, school_id, identifier, graduation_year)
        VALUES ($1, $2, $3, 2030)
      `, [id, `2030${i}`, `F${i}`]);
      
      await client.query(`
        INSERT INTO user_roles (user_id, role_id, unit_id, assigned_by)
        VALUES ($1, $2, NULL, NULL)
      `, [id, roleMap['student']]);
      
      await client.query(`
        INSERT INTO credentials (user_id, password_hash, is_activated, activated_at)
        VALUES ($1, NULL, false, NULL)
      `, [id]);
      
      await client.query(`
        INSERT INTO activation_codes (user_id, otp_hash, expires_at)
        VALUES ($1, crypt('123456', gen_salt('bf')), now() + interval '30 days')
      `, [id]);
    }

    await client.query("COMMIT");
    console.log("Extra users seeded successfully!");
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Failed to seed extra users:", error);
  } finally {
    await client.end();
  }
}

main();
