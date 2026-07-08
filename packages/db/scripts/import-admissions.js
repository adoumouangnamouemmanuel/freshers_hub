const fs = require("fs");
const path = require("path");

require("dotenv").config({ path: path.resolve(__dirname, "../../../.env") });

const { Client } = require("pg");

const databaseUrl =
  process.env.DATABASE_URL ||
  "postgres://postgres:postgres@localhost:5432/fresher_hub";

const defaultCsvPath = path.resolve(
  __dirname,
  "../seeds/mock_admissions_sample.csv",
);
const csvPath = process.argv[2]
  ? path.resolve(process.cwd(), process.argv[2])
  : defaultCsvPath;

function parseCsv(content) {
  const lines = content.trim().split(/\r?\n/);
  const headers = lines.shift().split(",");

  return lines.filter(Boolean).map((line) => {
    const values = [];
    let current = "";
    let inQuotes = false;

    for (let index = 0; index < line.length; index += 1) {
      const char = line[index];

      if (char === '"') {
        inQuotes = !inQuotes;
        continue;
      }

      if (char === "," && !inQuotes) {
        values.push(current);
        current = "";
        continue;
      }

      current += char;
    }

    values.push(current);

    return headers.reduce((record, header, index) => {
      record[header] = (values[index] || "").trim();
      return record;
    }, {});
  });
}

function splitSchoolId(schoolId) {
  const normalized = String(schoolId).trim();
  if (!/^\d{8}$/.test(normalized)) {
    throw new Error(
      `Invalid school_id "${schoolId}". Expected 8 digits like 30302027.`,
    );
  }

  return {
    identifier: normalized.slice(0, 4),
    graduationYear: Number(normalized.slice(4)),
  };
}

async function main() {
  if (!fs.existsSync(csvPath)) {
    throw new Error(`CSV file not found: ${csvPath}`);
  }

  const rows = parseCsv(fs.readFileSync(csvPath, "utf8"));
  const client = new Client({ connectionString: databaseUrl });

  await client.connect();

  try {
    await client.query("BEGIN");

    const studentRoleResult = await client.query(
      "SELECT id FROM roles WHERE name = 'student' LIMIT 1",
    );

    let studentRoleId = studentRoleResult.rows[0]?.id;

    if (!studentRoleId) {
      const insertedRole = await client.query(
        "INSERT INTO roles (name) VALUES ('student') RETURNING id",
      );
      studentRoleId = insertedRole.rows[0].id;
    }

    for (const row of rows) {
      const { identifier, graduationYear } = splitSchoolId(row.school_id);

      const userResult = await client.query(
        `
          INSERT INTO users (email, full_name, phone, class_year, country, major)
          VALUES ($1, $2, $3, $4, $5, $6)
          ON CONFLICT (email) DO UPDATE
          SET full_name = EXCLUDED.full_name,
              phone = EXCLUDED.phone,
              class_year = EXCLUDED.class_year,
              country = EXCLUDED.country,
              major = EXCLUDED.major,
              updated_at = now()
          RETURNING id
        `,
        [
          row.email,
          row.full_name,
          row.phone || null,
          row.class_year ? Number(row.class_year) : null,
          row.country || null,
          row.major || null,
        ],
      );

      const userId = userResult.rows[0].id;

      await client.query(
        "DELETE FROM student_profiles WHERE user_id = $1 AND school_id <> $2",
        [userId, row.school_id],
      );

      await client.query(
        `
          INSERT INTO student_profiles (user_id, school_id, identifier, graduation_year)
          VALUES ($1, $2, $3, $4)
          ON CONFLICT (school_id) DO UPDATE
          SET user_id = EXCLUDED.user_id,
              identifier = EXCLUDED.identifier,
              graduation_year = EXCLUDED.graduation_year
        `,
        [userId, row.school_id, identifier, graduationYear],
      );

      await client.query(
        `
          INSERT INTO user_roles (user_id, role_id)
          VALUES ($1, $2)
          ON CONFLICT (user_id, role_id, unit_id) DO NOTHING
        `,
        [userId, studentRoleId],
      );
    }

    await client.query("COMMIT");

    console.log(
      `Imported ${rows.length} students from ${path.relative(process.cwd(), csvPath)}`,
    );
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    await client.end();
  }
}

main().catch((error) => {
  console.error(error.message || error);
  process.exit(1);
});
