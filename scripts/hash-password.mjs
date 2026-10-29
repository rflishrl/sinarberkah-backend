// Membuat hash untuk ADMIN_PASSWORD_HASH (scrypt bawaan Node, tanpa library tambahan).
// Pemakaian: npm run hash-password -- "password-anda"
// Format hasil: scrypt.<N>.<r>.<p>.<salt-hex>.<hash-hex>
// (tanpa tanda "$" agar aman di file .env). Parameter biaya disimpan di hash,
// jadi bisa dinaikkan nanti tanpa merusak hash lama. Samakan dengan SCRYPT_PARAMS
// di src/lib/auth.ts.
import { randomBytes, scryptSync } from "node:crypto";

const N = 16384;
const r = 8;
const p = 1;

const password = process.argv[2];

if (!password || password.length < 6) {
  console.error('Pemakaian: npm run hash-password -- "password-anda"');
  console.error("Password minimal 6 karakter.");
  process.exit(1);
}

const salt = randomBytes(16);
const hash = scryptSync(password, salt, 64, { N, r, p, maxmem: 256 * N * r });
console.log(
  `ADMIN_PASSWORD_HASH=scrypt.${N}.${r}.${p}.${salt.toString("hex")}.${hash.toString("hex")}`,
);
