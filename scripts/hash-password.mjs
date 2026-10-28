// Membuat hash untuk ADMIN_PASSWORD_HASH (scrypt bawaan Node, tanpa library tambahan).
// Pemakaian: npm run hash-password -- "password-anda"
// Format hasil: scrypt.<salt-hex>.<hash-hex> (tanpa tanda "$" agar aman di file .env).
import { randomBytes, scryptSync } from "node:crypto";

const password = process.argv[2];

if (!password || password.length < 10) {
  console.error('Pemakaian: npm run hash-password -- "password-anda"');
  console.error("Password minimal 10 karakter.");
  process.exit(1);
}

const salt = randomBytes(16);
const hash = scryptSync(password, salt, 64);
console.log(
  `ADMIN_PASSWORD_HASH=scrypt.${salt.toString("hex")}.${hash.toString("hex")}`,
);
