import { cookies } from "next/headers";
import { createHash, randomBytes } from "node:crypto";
import { db } from "./db";
import { BookingError } from "./validation";
import { checkPassword, hashPassword } from "./password";
export type Actor = {
  id: string;
  email: string;
  role: "OWNER" | "PROFESSIONAL";
  professional_id: string | null;
  can_block: boolean;
};
const COOKIE = "trompos_admin";
const digest = (value: string) =>
  createHash("sha256").update(value).digest("hex");
export async function rateLimit(key: string, limit: number, seconds = 900) {
  const { rows } = await db().query(
    `INSERT INTO rate_limits(key,count,expires_at)VALUES($1,1,now()+$2*interval '1 second') ON CONFLICT(key)DO UPDATE SET count=CASE WHEN rate_limits.expires_at<now() THEN 1 ELSE rate_limits.count+1 END,expires_at=CASE WHEN rate_limits.expires_at<now() THEN now()+$2*interval '1 second' ELSE rate_limits.expires_at END RETURNING count`,
    [digest(key), seconds],
  );
  if (rows[0].count > limit)
    throw new BookingError("Demasiados intentos. Esperá unos minutos.", 429);
}
export function checkOrigin(request: Request) {
  const expected =
    process.env.APP_ORIGIN ??
    (process.env.NODE_ENV === "production"
      ? null
      : new URL(request.url).origin);
  if (!expected || request.headers.get("origin") !== expected)
    throw new BookingError("Origen no permitido.", 403);
}
export async function currentActor(): Promise<Actor | null> {
  if (!process.env.DATABASE_URL) return null;
  const token = (await cookies()).get(COOKIE)?.value;
  if (!token) return null;
  const { rows } = await db().query<Actor>(
    `SELECT u.id,u.email,u.role,u.professional_id,u.can_block FROM admin_sessions s JOIN admin_users u ON u.id=s.user_id LEFT JOIN professionals p ON p.id=u.professional_id WHERE s.token_hash=$1 AND s.expires_at>now() AND u.active AND (u.role='OWNER' OR p.active)`,
    [digest(token)],
  );
  return rows[0] ?? null;
}
export async function requireActor(owner = false) {
  const actor = await currentActor();
  if (!actor) throw new BookingError("Iniciá sesión.", 401);
  if (owner && actor.role !== "OWNER")
    throw new BookingError("Sin permiso.", 403);
  return actor;
}
export async function login(email: string, password: string) {
  await rateLimit(`login:${email}`, 8);
  const user = (
    await db().query<Actor & { password_hash: string }>(
      "SELECT u.* FROM admin_users u LEFT JOIN professionals p ON p.id=u.professional_id WHERE u.email=$1 AND u.active AND (u.role='OWNER' OR p.active)",
      [email],
    )
  ).rows[0];
  const hash =
    user?.password_hash ?? (await hashPassword("dummy-password-no-user"));
  if (!(await checkPassword(password, hash)) || !user)
    throw new BookingError("Email o contraseña incorrectos.", 401);
  const token = randomBytes(32).toString("hex");
  await db().query(
    "INSERT INTO admin_sessions VALUES($1,$2,now()+interval '12 hours')",
    [digest(token), user.id],
  );
  (await cookies()).set(COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: 43200,
  });
}
export async function logout() {
  const jar = await cookies(),
    token = jar.get(COOKIE)?.value;
  if (token)
    await db().query("DELETE FROM admin_sessions WHERE token_hash=$1", [
      digest(token),
    ]);
  jar.delete(COOKIE);
}
