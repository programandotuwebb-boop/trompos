import { loadEnvConfig } from "@next/env";
import { z } from "zod";
import { db, transaction } from "../src/lib/booking/db";
import { hashPassword } from "../src/lib/booking/password";
loadEnvConfig(process.cwd());
async function main() {
  const email = z.email().parse(process.env.ADMIN_EMAIL).toLowerCase();
  const password = z
    .string()
    .min(12)
    .max(256)
    .parse(process.env.ADMIN_PASSWORD);
  const role = z
    .enum(["OWNER", "PROFESSIONAL"])
    .parse(process.env.ADMIN_ROLE ?? "OWNER");
  const professional =
    role === "PROFESSIONAL"
      ? z.uuid().parse(process.env.ADMIN_PROFESSIONAL_ID)
      : null;
  const hash = await hashPassword(password);
  await transaction(async (c) => {
    const { rows } = await c.query(
      "INSERT INTO admin_users(email,password_hash,role,professional_id)VALUES($1,$2,$3,$4) ON CONFLICT(email) DO UPDATE SET password_hash=$2,role=$3,professional_id=$4,active=true RETURNING id",
      [email, hash, role, professional],
    );
    await c.query("DELETE FROM admin_sessions WHERE user_id=$1", [rows[0].id]);
  });
  console.log("Cuenta guardada. Las sesiones anteriores fueron revocadas.");
}
main().finally(() => db().end());
