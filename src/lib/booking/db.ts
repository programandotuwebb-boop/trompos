import { Pool, type PoolClient } from "pg";
const globalDb = globalThis as unknown as { bookingPool?: Pool };
export function db() {
  if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL no configurada");
  if (globalDb.bookingPool) return globalDb.bookingPool;
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    max: 5,
    connectionTimeoutMillis: 5000,
    idleTimeoutMillis: 10000,
  });
  pool.on("error", () => {
    console.error("PostgreSQL: se perdió una conexión inactiva del pool");
  });
  globalDb.bookingPool = pool;
  return pool;
}
export async function transaction<T>(
  run: (client: PoolClient) => Promise<T>,
): Promise<T> {
  const client = await db().connect();
  try {
    await client.query("BEGIN");
    const result = await run(client);
    await client.query("COMMIT");
    return result;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}
