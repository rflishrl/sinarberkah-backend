// Membuat atau memperbarui akun admin di database Neon PostgreSQL.
// Password diketik di terminal dan tidak ditampilkan di shell history.
//
// Butuh di .env.local: DATABASE_URI atau DATABASE_URL.
// Pemakaian: npm run create-admin -- admin@sinarberkah.com

import { randomBytes, scryptSync } from "node:crypto";
import { createInterface } from "node:readline";
import { neon } from "@neondatabase/serverless";

const databaseUrl = process.env.DATABASE_URI || process.env.DATABASE_URL;
const email = process.argv[2]?.trim().toLowerCase();

if (!databaseUrl) {
  console.error("Isi DATABASE_URI atau DATABASE_URL di .env.local.");
  process.exit(1);
}
if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
  console.error("Pemakaian: npm run create-admin -- admin@domain.com");
  process.exit(1);
}

function hashPassword(password) {
  const salt = randomBytes(16).toString("hex");
  const derivedKey = scryptSync(password, salt, 64);
  return `${salt}:${derivedKey.toString("hex")}`;
}

function askHidden(question) {
  return new Promise((resolve) => {
    const rl = createInterface({
      input: process.stdin,
      output: process.stdout,
      terminal: true,
    });
    let muted = false;
    rl._writeToOutput = (text) => {
      if (!muted) rl.output.write(text);
    };
    rl.question(question, (answer) => {
      rl.close();
      process.stdout.write("\n");
      resolve(answer);
    });
    muted = true;
  });
}

const password = await askHidden(
  `Password untuk ${email} (minimal 8 karakter): `,
);
if (password.length < 8) {
  console.error("Password minimal 8 karakter.");
  process.exit(1);
}
const again = await askHidden("Ulangi password: ");
if (again !== password) {
  console.error("Password tidak sama.");
  process.exit(1);
}

const sql = neon(databaseUrl);
const passwordHash = hashPassword(password);

try {
  const rows = await sql`
    INSERT INTO admin_users (email, password_hash, role)
    VALUES (${email}, ${passwordHash}, 'admin')
    ON CONFLICT (email) DO UPDATE
    SET
      password_hash = ${passwordHash},
      role = 'admin',
      updated_at = NOW()
    RETURNING id, email, role
  `;

  console.log(
    `Akun admin berhasil disimpan: ${rows[0].email} (ID: ${rows[0].id})`,
  );
} catch (err) {
  console.error("Gagal menyimpan akun admin:", err);
  process.exit(1);
}
