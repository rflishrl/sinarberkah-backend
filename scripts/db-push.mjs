import fs from "node:fs";
import path from "node:path";
import { neon } from "@neondatabase/serverless";

// Automatically load local env file if not already provided via shell
for (const envFile of [".env.local", ".env.production.local", ".env"]) {
  const envPath = path.resolve(process.cwd(), envFile);
  if (fs.existsSync(envPath)) {
    try {
      process.loadEnvFile(envPath);
      break;
    } catch {}
  }
}

const databaseUrl =
  process.env.DATABASE_URI ||
  process.env.DATABASE_URL ||
  process.env.POSTGRES_URL;

if (!databaseUrl) {
  console.error(
    "Error: DATABASE_URI, DATABASE_URL, or POSTGRES_URL is not set.",
  );
  process.exit(1);
}

const sqlFile = path.resolve(process.cwd(), "scripts/schema.sql");
const sqlContent = fs.readFileSync(sqlFile, "utf-8");

console.log("Applying schema to Neon PostgreSQL...");
const sql = neon(databaseUrl);

try {
  // Execute individual DDL statements split by semicolon via sql.query()
  const statements = sqlContent
    .split(";")
    .map((s) => s.trim())
    .filter((s) => s.length > 0);

  for (const statement of statements) {
    await sql.query(statement);
  }
  console.log("Schema applied successfully.");
} catch (err) {
  console.error("Failed to apply schema:", err);
  process.exit(1);
}
