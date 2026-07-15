/**
 * seed-clubs.js
 * Creates some realistic clubs (Ashesi Tech Club, Ashesi Debate Club, Ashesi Culture Club).
 * Assigns random existing users as club leaders.
 */
const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../../../.env") });

const { Client } = require("pg");

const databaseUrl =
  process.env.DATABASE_URL ||
  "postgres://postgres:postgres@localhost:5432/fresher_hub";

async function main() {
  const client = new Client({ connectionString: databaseUrl });
  await client.connect();

  try {
    await client.query("BEGIN");

    const clubs = [
      {
        name: "Ashesi Tech Club",
        description: "A community of tech enthusiasts building cool projects and sharing knowledge on software engineering, AI, and robotics.",
        category: "Technology",
        image_url: "https://images.unsplash.com/photo-1517048676732-d65bc937f952?q=80&w=600&auto=format&fit=crop"
      },
      {
        name: "Ashesi Debate Society",
        description: "Debate, public speaking, and leadership development. Join us to hone your argumentation and presentation skills.",
        category: "Academic",
        image_url: "https://images.unsplash.com/photo-1541339907198-e08756dedf3f?q=80&w=600&auto=format&fit=crop"
      },
      {
        name: "African Culture & Dance",
        description: "Join us to explore different cultures, foods, and languages across the African continent through dance, music, and art.",
        category: "Culture",
        image_url: "https://images.unsplash.com/photo-1511632765486-a01980e01a18?q=80&w=600&auto=format&fit=crop"
      }
    ];

    console.log("Seeding realistic clubs...");
    const createdGroups = [];
    
    for (const club of clubs) {
      // Check if group exists
      const { rows: existingRows } = await client.query(
        `SELECT id FROM groups WHERE name = $1`,
        [club.name]
      );
      
      let groupId;
      if (existingRows.length > 0) {
        groupId = existingRows[0].id;
        await client.query(
          `UPDATE groups SET description = $1, category = $2, image_url = $3 WHERE id = $4`,
          [club.description, club.category, club.image_url, groupId]
        );
        createdGroups.push({ id: groupId, name: club.name });
        console.log(`Updated group: ${club.name}`);
      } else {
        const { rows: newRows } = await client.query(
          `INSERT INTO groups (name, type, description, category, image_url)
           VALUES ($1, 'club', $2, $3, $4)
           RETURNING id, name`,
          [club.name, club.description, club.category, club.image_url]
        );
        createdGroups.push(newRows[0]);
        console.log(`Inserted group: ${newRows[0].name}`);
      }
    }

    // Pick 3 random users to be leaders
    const { rows: users } = await client.query(`SELECT id, full_name FROM users LIMIT 3`);
    if (users.length < 3) {
      console.warn("Not enough users to assign as leaders. Create some users first.");
    } else {
      for (let i = 0; i < Math.min(createdGroups.length, users.length); i++) {
        const group = createdGroups[i];
        const user = users[i];
        
        await client.query(
          `INSERT INTO group_members (group_id, user_id, is_leader)
           VALUES ($1, $2, true)
           ON CONFLICT (group_id, user_id) DO UPDATE SET is_leader = true`,
          [group.id, user.id]
        );
        console.log(`Assigned ${user.full_name} as leader of ${group.name}`);
      }
    }

    await client.query("COMMIT");
    console.log("✅ Clubs seeding completed successfully.");
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("Seeding failed:", err);
    throw err;
  } finally {
    await client.end();
  }
}

main().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});
