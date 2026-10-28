// Dijalankan Vercel saat build (script `vercel-build` di package.json).
// - Production: terapkan migrasi database dulu, lalu build.
// - Preview: hanya build. Migrasi dilewati agar deploy percobaan tidak mengubah database produksi.
import { spawnSync } from "node:child_process";

function run(args) {
  const result = spawnSync("npx", args, {
    stdio: "inherit",
    shell: process.platform === "win32",
  });
  if (result.status !== 0) process.exit(result.status ?? 1);
}

if (process.env.VERCEL_ENV === "production") {
  console.log("[vercel-build] Production: menerapkan migrasi database...");
  run(["drizzle-kit", "migrate"]);
} else {
  console.log(
    `[vercel-build] ${process.env.VERCEL_ENV ?? "lokal"}: migrasi dilewati.`,
  );
}

run(["next", "build"]);
