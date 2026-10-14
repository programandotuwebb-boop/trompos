import { spawnSync } from "node:child_process";

if (
  process.env.VERCEL_ENV !== "production" ||
  process.env.TROMPOS_LEGACY_CALENDAR_IMPORT !== "1"
) {
  process.exit(0);
}

for (const script of ["db:migrate", "db:seed", "db:import-calendar"]) {
  const result = spawnSync("npm", ["run", script], { stdio: "inherit" });
  if (result.error) throw result.error;
  if (result.status !== 0) process.exit(result.status ?? 1);
}
