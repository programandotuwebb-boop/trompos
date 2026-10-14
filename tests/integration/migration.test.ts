import { test } from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { readFile } from "node:fs/promises";
import { Client } from "pg";
test("Calendar migration preserves imported bookings and resolves durable intents atomically", async () => {
  const url = process.env.TEST_DATABASE_URL;
  if (!url || !new URL(url).pathname.endsWith("_test"))
    throw new Error("Use TEST_DATABASE_URL ending _test");
  const c = new Client({ connectionString: url });
  await c.connect();
  const schema = `migration_${randomUUID().replaceAll("-", "")}`;
  try {
    await c.query("BEGIN");
    await c.query(`CREATE SCHEMA ${schema}`);
    await c.query(`SET LOCAL search_path=${schema},public`);
    await c.query(
      await readFile("db/migrations/001_multi_professional.sql", "utf8"),
    );
    const p = (
      await c.query(
        "INSERT INTO professionals(name,slug)VALUES('Imported','imported')RETURNING id",
      )
    ).rows[0].id;
    const s = (
      await c.query(
        "INSERT INTO services(name,duration_minutes,price)VALUES('Corte',45,100)RETURNING id",
      )
    ).rows[0].id;
    const ids = [];
    for (const [i, status, action] of [
      [0, "CONFIRMED", null],
      [1, "MOVE_PENDING", "MOVE"],
      [2, "CANCEL_PENDING", "CANCEL"],
      [3, "SYNC_ERROR", "CREATE"],
    ] as const) {
      const id = randomUUID();
      ids.push(id);
      const start = new Date(Date.UTC(2030, 0, 8 + i, 13));
      const end = new Date(+start + 2700000);
      await c.query(
        "INSERT INTO bookings(id,professional_id,service_id,customer_name,customer_phone,start_at,end_at,status,google_event_id,google_calendar_id,service_name,duration_minutes,price,pending_action)VALUES($1,$2,$3,'Cliente','1155551234',$4,$5,$6,$7,'old-calendar','Corte',45,100,$8)",
        [id, p, s, start, end, status, `original-${i}`, action],
      );
      await c.query(
        "INSERT INTO booking_holds VALUES($1,$2,'old-calendar',$3,$4)",
        [id, p, start, action === "MOVE" ? new Date(+end + 3600000) : end],
      );
      if (action === "MOVE")
        await c.query(
          "UPDATE bookings SET target_start=start_at+interval '1 hour',target_end=end_at+interval '1 hour' WHERE id=$1",
          [id],
        );
    }
    await c.query(
      await readFile("db/migrations/002_postgres_agenda.sql", "utf8"),
    );
    const rows = (
      await c.query("SELECT * FROM bookings ORDER BY google_event_id")
    ).rows;
    assert.deepEqual(
      rows.map((b) => b.status),
      ["CONFIRMED", "CONFIRMED", "CANCELLED", "CONFIRMED"],
    );
    assert.deepEqual(
      rows.map((b) => b.google_event_id),
      ["original-0", "original-1", "original-2", "original-3"],
    );
    assert(
      rows.every(
        (b) => b.pending_action === null && b.customer_name === "Cliente",
      ),
    );
    assert.equal(rows[1].start_at.toISOString(), "2030-01-09T14:00:00.000Z");
    assert.equal((await c.query("SELECT 1 FROM booking_holds")).rowCount, 3);
    assert.equal(
      (
        await c.query(
          "SELECT 1 FROM booking_holds h JOIN bookings b ON b.id=h.booking_id WHERE h.start_at<>b.start_at OR h.end_at<>b.end_at",
        )
      ).rowCount,
      0,
    );
    assert.equal((await c.query("SELECT 1 FROM booking_audit")).rowCount, 4);
  } finally {
    await c.query("ROLLBACK");
    await c.end();
  }
});
