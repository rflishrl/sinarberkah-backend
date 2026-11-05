import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { neon } from "@neondatabase/serverless";

const databaseUrl = process.env.DATABASE_URI || process.env.DATABASE_URL;
if (!databaseUrl) {
  console.error("Error: DATABASE_URI or DATABASE_URL is not set.");
  process.exit(1);
}

const sqlFile = resolve(process.cwd(), "scripts/schema.sql");
const sqlContent = readFileSync(sqlFile, "utf-8");

console.log("Applying schema to Neon PostgreSQL...");
const sql = neon(databaseUrl);

try {
  // Execute individual DDL statements split by semicolon
  const statements = sqlContent
    .split(";")
    .map((s) => s.trim())
    .filter((s) => s.length > 0);

  for (const statement of statements) {
    await sql(statement);
  }
  console.log("Schema applied successfully.");
} catch (err) {
  console.error("Failed to apply schema:", err);
  process.exit(1);
}
