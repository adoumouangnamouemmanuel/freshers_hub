const fs = require("fs");
const path = require("path");

require("dotenv").config({ path: path.resolve(__dirname, "../../../.env") });

const { Client } = require("pg");

const databaseUrl =
  process.env.DATABASE_URL ||
  "postgres://postgres:postgres@localhost:5432/fresher_hub";
const seedsDir = path.resolve(__dirname, "../seeds");

async function main() {
  const client = new Client({ connectionString: databaseUrl });

  await client.connect();

  try {
    const files = fs
      .readdirSync(seedsDir)
      .filter((file) => file.endsWith(".sql"))
      .sort();

    for (const file of files) {
      const sql = fs.readFileSync(path.join(seedsDir, file), "utf8");
      await client.query("BEGIN");
      try {
        await client.query(sql);
        await client.query("COMMIT");
        console.log(`Applied ${file}`);
      } catch (error) {
        await client.query("ROLLBACK");
        throw error;
      }
    }

    console.log("Database seed completed successfully.");
  } finally {
    await client.end();
  }
}

main().catch((error) => {
  console.error(error.message || error);
  process.exit(1);
});
