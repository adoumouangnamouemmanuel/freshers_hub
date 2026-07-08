import "dotenv/config";
import { defineConfig } from "drizzle-kit";
import process from "node:process";

export default defineConfig({
  schema: "./src/schema/index.ts",
  out: "./migrations",
  dialect: "postgresql",
  dbCredentials: {
    url:
      process.env.DATABASE_URL ??
      "postgres://postgres:postgres@localhost:5432/fresher_hub",
  },
});
