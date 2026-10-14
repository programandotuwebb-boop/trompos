import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { readFile } from "node:fs/promises";
import { Pool } from "pg";
import { db } from "../../src/lib/booking/db";
import {
  reserve,
  changeBooking,
  availability,
} from "../../src/lib/booking/service";
import { executeAdmin } from "../../src/lib/booking/admin";
import { publicCatalog } from "../../src/lib/booking/repository";
import { localDate, midnight, DAY } from "../../src/lib/booking/time";

const testUrl = process.env.TEST_DATABASE_URL;
if (!testUrl || !new URL(testUrl).pathname.endsWith("_test"))
  throw new Error(
    "TEST_DATABASE_URL debe apuntar a una base terminada en _test",
  );
const schema = `test_${randomUUID().replaceAll("-", "")}`,
  bootstrap = new Pool({ connectionString: testUrl });
const url = new URL(testUrl);
url.searchParams.set("options", `-c search_path=${schema},public`);
process.env.DATABASE_URL = url.toString();
delete process.env.GOOGLE_CLIENT_EMAIL;
delete process.env.GOOGLE_PRIVATE_KEY;
delete process.env.GOOGLE_CALENDAR_ID;
let p: string, p2: string, s: string;
const iso = (day: number, time = "10:00") =>
  new Date(
    `${localDate(Date.now() + day * DAY)}T${time}:00-03:00`,
  ).toISOString();
const input = (day: number, professionalId = p) => ({
  professionalId,
  service: s,
  startISO: iso(day),
  name: "Cliente de prueba",
  phone: "1155551234",
  notes: "",
  idempotencyKey: randomUUID(),
});
const owner = {
  id: randomUUID(),
  email: "owner@example.test",
  role: "OWNER" as const,
  professional_id: null,
  can_block: true,
};
before(async () => {
  await bootstrap.query(
    "CREATE EXTENSION IF NOT EXISTS btree_gist WITH SCHEMA public",
  );
  await bootstrap.query(`CREATE SCHEMA ${schema}`);
  await db().query(
    await readFile("db/migrations/001_multi_professional.sql", "utf8"),
  );
  await db().query(
    await readFile("db/migrations/002_postgres_agenda.sql", "utf8"),
  );
  p = (
    await db().query(
      "INSERT INTO professionals(name,slug,active)VALUES('Uno','uno',true)RETURNING id",
    )
  ).rows[0].id;
  p2 = (
    await db().query(
      "INSERT INTO professionals(name,slug,active)VALUES('Dos','dos',true)RETURNING id",
    )
  ).rows[0].id;
  s = (
    await db().query(
      "INSERT INTO services(name,duration_minutes,price)VALUES('Corte',45,30000)RETURNING id",
    )
  ).rows[0].id;
  for (const professional of [p, p2]) {
    await db().query("INSERT INTO professional_services VALUES($1,$2)", [
      professional,
      s,
    ]);
    for (let day = 0; day < 7; day++)
      await db().query(
        "INSERT INTO working_hours(professional_id,day_of_week,start_minute,end_minute)VALUES($1,$2,540,1200)",
        [professional, day],
      );
  }
  await db().query(
    "INSERT INTO admin_users(id,email,password_hash,role)VALUES($1,$2,'test','OWNER')",
    [owner.id, owner.email],
  );
});
after(async () => {
  await db().end();
  await bootstrap.query(`DROP SCHEMA ${schema} CASCADE`);
  await bootstrap.end();
});
test("two simultaneous requests cannot book overlapping durations", async () => {
  const a = input(1),
    b = { ...input(1), startISO: iso(1, "10:15") };
  const results = await Promise.allSettled([reserve(a), reserve(b)]);
  assert.equal(results.filter((r) => r.status === "fulfilled").length, 1);
  assert.equal(results.filter((r) => r.status === "rejected").length, 1);
  assert.equal((await db().query("SELECT * FROM booking_holds")).rowCount, 1);
});
test("idempotent concurrent retry creates one confirmed booking without Google", async () => {
  const body = input(2);
  const [a, b] = await Promise.all([reserve(body), reserve(body)]);
  assert.equal(a.id, b.id);
  assert.equal(a.status, "CONFIRMED");
  assert.equal(a.google_event_id, null);
  assert.equal(
    (
      await db().query("SELECT 1 FROM bookings WHERE idempotency_key=$1", [
        body.idempotencyKey,
      ])
    ).rowCount,
    1,
  );
  await assert.rejects(reserve({ ...body, name: "Otra persona" }));
});
test("different professionals can book same time and any option retains identity", async () => {
  const [a, b] = await Promise.all([reserve(input(5)), reserve(input(5, p2))]);
  assert.notEqual(a.professional_id, b.professional_id);
  const days = await availability(s, "any", 1);
  assert(
    days
      .flatMap((d) => d.slots)
      .every((slot) => [p, p2].includes(slot.professionalId)),
  );
  const catalog = await publicCatalog();
  assert(!("google_calendar_id" in catalog.professionals[0]));
});
test("past/off-grid/out-of-hours and ineligible professional reject", async () => {
  await assert.rejects(reserve({ ...input(6), startISO: iso(-1) }));
  await assert.rejects(reserve({ ...input(6), startISO: iso(6, "10:07") }));
  await assert.rejects(reserve({ ...input(6), startISO: iso(6, "19:30") }));
  await assert.rejects(reserve({ ...input(6), professionalId: randomUUID() }));
});
test("reschedule is atomic on conflict and cancellation immediately frees the interval", async () => {
  const b = await reserve(input(7));
  await reserve({ ...input(7), startISO: iso(7, "12:00") });
  await assert.rejects(
    changeBooking(b.id, "MOVE", { actor: owner, startISO: iso(7, "12:15") }),
  );
  assert.equal(
    new Date(
      (await db().query("SELECT start_at FROM bookings WHERE id=$1", [b.id]))
        .rows[0].start_at,
    ).toISOString(),
    iso(7),
  );
  await assert.rejects(reserve(input(7)));
  const moved = await changeBooking(b.id, "MOVE", {
    actor: owner,
    startISO: iso(7, "11:00"),
  });
  assert.equal(moved.id, b.id);
  assert.equal(new Date(moved.start_at).toISOString(), iso(7, "11:00"));
  await reserve(input(7));
  await assert.rejects(changeBooking(b.id, "CANCEL", { phone: "1199999999" }));
  assert.equal(
    (await changeBooking(b.id, "CANCEL", { phone: b.customer_phone })).status,
    "CANCELLED",
  );
  assert.equal(
    (await reserve({ ...input(7), startISO: iso(7, "11:00") })).status,
    "CONFIRMED",
  );
});
test("professional manages own schedule and bookings but cannot administer another identity", async () => {
  const actor = {
    ...owner,
    role: "PROFESSIONAL" as const,
    professional_id: p,
    can_block: false,
  };
  await assert.rejects(
    executeAdmin(actor, {
      action: "service",
      name: "x",
      durationMinutes: 45,
      price: 1,
      active: true,
    }),
  );
  const body = {
    action: "exception",
    professionalId: p2,
    dateFrom: localDate(Date.now() + 10 * DAY),
    dateTo: localDate(Date.now() + 10 * DAY),
    kind: "CLOSED",
    startMinute: 0,
    endMinute: 1440,
    reason: "Día libre",
  };
  await assert.rejects(executeAdmin({ ...actor, can_block: true }, body));
  await assert.rejects(
    executeAdmin(actor, { action: "hours", professionalId: p2, blocks: [] }),
  );
  await assert.rejects(
    executeAdmin(actor, { action: "reserve", booking: input(9, p2) }),
  );
  const own = (await executeAdmin(actor, {
    action: "reserve",
    booking: input(9),
  })) as { id: string };
  await executeAdmin(actor, { action: "cancel", id: own.id });
  await executeAdmin(
    { ...actor, can_block: true },
    { ...body, professionalId: p },
  );
  await assert.rejects(reserve(input(10)));
});
test("blocking exception cannot silently invalidate a booked interval", async () => {
  await reserve(input(11));
  const date = localDate(Date.now() + 11 * DAY);
  await assert.rejects(
    executeAdmin(owner, {
      action: "exception",
      professionalId: p,
      dateFrom: date,
      dateTo: date,
      kind: "BLOCK",
      startMinute: 600,
      endMinute: 660,
      reason: "Bloqueo",
    }),
  );
});
test("exclusion constraint works even without application locks", async () => {
  const start = new Date(
      midnight(localDate(Date.now() + 12 * DAY)) + 10 * 3600000,
    ),
    end = new Date(start.getTime() + 3600000);
  const ids = [randomUUID(), randomUUID()];
  for (const id of ids)
    await db().query(
      "INSERT INTO bookings(id,professional_id,service_id,customer_name,customer_phone,start_at,end_at,status,google_event_id,google_calendar_id,service_name,duration_minutes,price)VALUES($1,$2,$3,'Test','1155555555',$4,$5,'CONFIRMED',$6,'one','Corte',60,1)",
      [id, p, s, start, end, id],
    );
  const results = await Promise.allSettled(
    ids.map((id) =>
      db().query("INSERT INTO booking_holds VALUES($1,$2,$3,$4,$5)", [
        id,
        p,
        "one",
        start,
        end,
      ]),
    ),
  );
  assert.equal(results.filter((r) => r.status === "fulfilled").length, 1);
  assert.equal(results.filter((r) => r.status === "rejected").length, 1);
});

test("professional can extend a single day; deleting booked extra hours is rejected", async () => {
  const actor = {
    ...owner,
    role: "PROFESSIONAL" as const,
    professional_id: p,
    can_block: false,
  };
  const date = localDate(Date.now() + 15 * DAY);
  await executeAdmin(actor, {
    action: "exception",
    professionalId: p,
    dateFrom: date,
    dateTo: date,
    kind: "EXTRA",
    startMinute: 1200,
    endMinute: 1320,
    reason: "Extra",
  });
  const b = (await executeAdmin(actor, {
    action: "reserve",
    booking: { ...input(15), startISO: iso(15, "20:00") },
  })) as { id: string };
  const exception = (
    await db().query(
      "SELECT id FROM availability_exceptions WHERE professional_id=$1 AND date_from=$2",
      [p, date],
    )
  ).rows[0];
  await assert.rejects(
    executeAdmin(actor, { action: "deleteException", id: exception.id }),
  );
  await executeAdmin(actor, { action: "cancel", id: b.id });
  await executeAdmin(actor, { action: "deleteException", id: exception.id });
  await assert.rejects(reserve({ ...input(15), startISO: iso(15, "20:00") }));
  const rules = (
    await db().query(
      "SELECT day_of_week,start_minute,end_minute FROM working_hours WHERE professional_id=$1",
      [p],
    )
  ).rows;
  await executeAdmin(actor, {
    action: "hours",
    professionalId: p,
    blocks: rules,
  });
});
test("concurrent move and new reservation have only one winner and preserve failed move", async () => {
  const b = await reserve(input(16));
  const results = await Promise.allSettled([
    changeBooking(b.id, "MOVE", { actor: owner, startISO: iso(16, "12:00") }),
    reserve({ ...input(16), startISO: iso(16, "12:15") }),
  ]);
  assert.equal(results.filter((r) => r.status === "fulfilled").length, 1);
  const current = (
    await db().query(
      "SELECT b.start_at,h.start_at hold_start FROM bookings b JOIN booking_holds h ON h.booking_id=b.id WHERE b.id=$1",
      [b.id],
    )
  ).rows[0];
  assert.equal(
    current.start_at.toISOString(),
    current.hold_start.toISOString(),
  );
  assert.equal(
    current.start_at.toISOString(),
    results[0].status === "fulfilled" ? iso(16, "12:00") : iso(16),
  );
});
test("eight-week horizon and completed/no-show transitions are server validated", async () => {
  await assert.rejects(reserve(input(57)));
  const b = await reserve(input(17));
  await assert.rejects(changeBooking(b.id, "COMPLETED", { actor: owner }));
  await assert.rejects(
    changeBooking(b.id, "NO_SHOW", {
      actor: { ...owner, role: "PROFESSIONAL", professional_id: p2 },
    }),
  );
  await db().query(
    "UPDATE bookings SET start_at=now()-interval '2 hours',end_at=now()-interval '1 hour' WHERE id=$1",
    [b.id],
  );
  await db().query(
    "UPDATE booking_holds SET start_at=now()-interval '2 hours',end_at=now()-interval '1 hour' WHERE booking_id=$1",
    [b.id],
  );
  assert.equal(
    (await changeBooking(b.id, "COMPLETED", { actor: owner })).status,
    "COMPLETED",
  );
  await assert.rejects(
    changeBooking(b.id, "MOVE", { actor: owner, startISO: iso(18) }),
  );
});

test("owner edits service assignments atomically; professional cannot alter them", async () => {
  const command = {
    action: "service",
    id: s,
    name: "Corte",
    durationMinutes: 45,
    price: 30000,
    active: true,
    professionalIds: [p2],
  };
  await assert.rejects(
    executeAdmin(
      { ...owner, role: "PROFESSIONAL", professional_id: p },
      command,
    ),
  );
  await executeAdmin(owner, command);
  assert.deepEqual(
    (
      await db().query(
        "SELECT professional_id FROM professional_services WHERE service_id=$1",
        [s],
      )
    ).rows.map((r) => r.professional_id),
    [p2],
  );
  await assert.rejects(
    executeAdmin(owner, {
      ...command,
      price: 99999,
      professionalIds: [randomUUID()],
    }),
  );
  assert.equal(
    (await db().query("SELECT price FROM services WHERE id=$1", [s])).rows[0]
      .price,
    30000,
  );
  assert.equal(
    (
      await db().query(
        "SELECT 1 FROM professional_services WHERE service_id=$1 AND professional_id=$2",
        [s, p2],
      )
    ).rowCount,
    1,
  );
});
