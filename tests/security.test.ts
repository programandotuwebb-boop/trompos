import { test } from "node:test";
import assert from "node:assert/strict";
import { checkOrigin } from "../src/lib/booking/auth";
import { hashPassword, checkPassword } from "../src/lib/booking/password";
import { reservationInput } from "../src/lib/booking/validation";
import { randomUUID } from "node:crypto";
test("admin writes reject missing or foreign Origin", () => {
  const old = process.env.APP_ORIGIN;
  process.env.APP_ORIGIN = "https://barber.example";
  try {
    assert.throws(() =>
      checkOrigin(new Request("https://barber.example/api/admin/action")),
    );
    assert.throws(() =>
      checkOrigin(
        new Request("https://barber.example/api/admin/action", {
          headers: { Origin: "https://attacker.example" },
        }),
      ),
    );
    assert.doesNotThrow(() =>
      checkOrigin(
        new Request("https://barber.example/api/admin/action", {
          headers: { Origin: "https://barber.example" },
        }),
      ),
    );
  } finally {
    if (old === undefined) delete process.env.APP_ORIGIN;
    else process.env.APP_ORIGIN = old;
  }
});
test("passwords use salted hashes and wrong passwords fail", async () => {
  const a = await hashPassword("twelve-character-password"),
    b = await hashPassword("twelve-character-password");
  assert.notEqual(a, b);
  assert(await checkPassword("twelve-character-password", a));
  assert(!(await checkPassword("wrong", a)));
});
test("client cannot override price/duration and must name concrete professional", () => {
  const body = {
    professionalId: randomUUID(),
    service: randomUUID(),
    startISO: "2030-01-01T12:00:00Z",
    name: "Cliente",
    phone: "+54 11 5555 1234",
    idempotencyKey: randomUUID(),
    price: 1,
    durationMinutes: 1,
  };
  const parsed = reservationInput.parse(body);
  assert(!("price" in parsed));
  assert(!("durationMinutes" in parsed));
  assert.equal(parsed.phone, "541155551234");
  assert.throws(() =>
    reservationInput.parse({ ...body, professionalId: "any" }),
  );
  assert.throws(() =>
    reservationInput.parse({ ...body, startISO: "2030-01-01T12:00:00" }),
  );
});
