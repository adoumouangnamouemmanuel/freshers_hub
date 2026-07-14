/**
 * seed-groups.js
 * Creates class-year groups from student_profiles and assigns users.
 * Also seeds sample events with targeted posts.
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

    // 1. Get distinct graduation years from student_profiles
    const { rows: years } = await client.query(
      `SELECT DISTINCT graduation_year FROM student_profiles WHERE graduation_year IS NOT NULL ORDER BY graduation_year`
    );

    console.log(`Found ${years.length} graduation years:`, years.map(y => y.graduation_year));

    // 2. Create class-year groups + assign members
    for (const { graduation_year } of years) {
      const groupName = `Class of ${graduation_year}`;

      // Upsert group
      const { rows: groupRows } = await client.query(
        `INSERT INTO groups (name, type) VALUES ($1, 'class_year')
         ON CONFLICT DO NOTHING
         RETURNING id`,
        [groupName]
      );

      let groupId;
      if (groupRows.length > 0) {
        groupId = groupRows[0].id;
        console.log(`Created group: ${groupName} (${groupId})`);
      } else {
        // Already exists, find it
        const { rows } = await client.query(
          `SELECT id FROM groups WHERE name = $1 AND type = 'class_year'`,
          [groupName]
        );
        groupId = rows[0]?.id;
        if (!groupId) {
          console.warn(`Could not find or create group: ${groupName}`);
          continue;
        }
        console.log(`Group already exists: ${groupName} (${groupId})`);
      }

      // Assign all users with this graduation year
      const { rowCount } = await client.query(
        `INSERT INTO group_members (group_id, user_id)
         SELECT $1, sp.user_id FROM student_profiles sp
         WHERE sp.graduation_year = $2
         ON CONFLICT DO NOTHING`,
        [groupId, graduation_year]
      );
      console.log(`  → Assigned ${rowCount} members to ${groupName}`);
    }

    // 3. Seed a sample targeted event
    // Find a staff/admin user to be the author
    const { rows: staffRows } = await client.query(
      `SELECT u.id FROM users u
       JOIN user_roles ur ON ur.user_id = u.id
       JOIN roles r ON r.id = ur.role_id
       WHERE r.name IN ('staff', 'admin', 'faculty')
       LIMIT 1`
    );

    if (staffRows.length > 0) {
      const authorId = staffRows[0].id;

      // Find the first class-year group
      const { rows: groupRows } = await client.query(
        `SELECT id, name FROM groups WHERE type = 'class_year' ORDER BY name LIMIT 1`
      );

      if (groupRows.length > 0) {
        const targetGroup = groupRows[0];

        // Create a targeted event post
        const { rows: postRows } = await client.query(
          `INSERT INTO posts (author_id, title, content, category, visibility)
           VALUES ($1, $2, $3, 'event', 'targeted')
           RETURNING id`,
          [
            authorId,
            "Freshers Orientation Ceremony",
            "Welcome to Ashesi! Join us for the official freshers orientation ceremony. Meet your peer coaches, faculty advisors, and fellow classmates. Refreshments will be served. Don't miss this important event!",
          ]
        );
        const postId = postRows[0].id;

        // Target this post at the class-year group
        await client.query(
          `INSERT INTO post_targets (post_id, target_type, target_id)
           VALUES ($1, 'group', $2)
           ON CONFLICT DO NOTHING`,
          [postId, targetGroup.id]
        );

        // Create the event
        const eventDate = new Date();
        eventDate.setDate(eventDate.getDate() + 7); // 1 week from now
        const dateStr = eventDate.toISOString().split("T")[0];

        const { rows: eventRows } = await client.query(
          `INSERT INTO events (post_id, event_date, event_time, location, organizer, capacity, rsvp_enabled)
           VALUES ($1, $2, '10:00', 'Ashesi Auditorium', 'Student Life', 200, true)
           RETURNING id`,
          [postId, dateStr]
        );

        console.log(`\nSeeded event: "Freshers Orientation Ceremony"`);
        console.log(`  → Post: ${postId}`);
        console.log(`  → Event: ${eventRows[0].id}`);
        console.log(`  → Targeted at: ${targetGroup.name} (${targetGroup.id})`);

        // Seed a second public event
        const { rows: pubPostRows } = await client.query(
          `INSERT INTO posts (author_id, title, content, category, visibility)
           VALUES ($1, $2, $3, 'event', 'public')
           RETURNING id`,
          [
            authorId,
            "Campus Clean-Up Day",
            "Let's come together and keep our campus beautiful! All students, faculty, and staff are welcome to participate in this community clean-up event. Supplies will be provided. Wear comfortable clothes.",
          ]
        );
        const pubPostId = pubPostRows[0].id;

        const cleanupDate = new Date();
        cleanupDate.setDate(cleanupDate.getDate() + 14); // 2 weeks from now

        await client.query(
          `INSERT INTO events (post_id, event_date, event_time, location, organizer, capacity, rsvp_enabled)
           VALUES ($1, $2, '08:00', 'Campus Green', 'Facilities', 500, true)`,
          [pubPostId, cleanupDate.toISOString().split("T")[0]]
        );

        console.log(`Seeded public event: "Campus Clean-Up Day"`);

        // Create notifications for target group members
        const { rows: memberRows } = await client.query(
          `SELECT user_id FROM group_members WHERE group_id = $1`,
          [targetGroup.id]
        );

        for (const member of memberRows) {
          await client.query(
            `INSERT INTO notifications (user_id, category, title, body, related_entity)
             VALUES ($1, 'event', $2, $3, $4)`,
            [
              member.user_id,
              "New Event: Freshers Orientation Ceremony",
              "You've been invited to the Freshers Orientation Ceremony. Tap to view details and RSVP.",
              `event:${eventRows[0].id}`,
            ]
          );
        }
        console.log(`  → Created ${memberRows.length} notifications for group members`);
      }
    } else {
      console.log("No staff/admin user found — skipping event seeding");
    }

    await client.query("COMMIT");
    console.log("\n✅ Group seeding completed successfully.");
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
