import { loadEnvConfig } from "@next/env";
import { randomUUID } from "node:crypto";
import { db, transaction } from "../src/lib/booking/db";
import { getCalendarClient, getCalendarId } from "../src/lib/google-calendar";
loadEnvConfig(process.cwd());
async function main() {
  const p = (
    await db().query("SELECT * FROM professionals WHERE legacy_calendar")
  ).rows[0];
  if (!p) throw new Error("Ejecutá seed primero");
  const calendar = getCalendarClient(),
    calendarId = getCalendarId();
  let pageToken: string | undefined,
    failures = 0,
    imported = 0;
  do {
    const { data } = await calendar.events.list({
      calendarId,
      timeMin: new Date().toISOString(),
      singleEvents: true,
      privateExtendedProperty: ["source=janeiro-web"],
      maxResults: 2500,
      pageToken,
    });
    for (const e of data.items ?? []) {
      if (e.status === "cancelled") continue;
      try {
        await transaction(async (c) => {
          if (
            (
              await c.query(
                "SELECT 1 FROM bookings WHERE google_calendar_id=$1 AND google_event_id=$2",
                [calendarId, e.id],
              )
            ).rowCount
          )
            return;
          const meta = e.extendedProperties?.private ?? {},
            s = (
              await c.query("SELECT * FROM services WHERE legacy_key=$1", [
                meta.service,
              ])
            ).rows[0];
          const phone = (
            e.description?.match(/Tel[eé]fono:\s*([^\n]+)/i)?.[1] ?? ""
          ).replace(/\D/g, "");
          if (!s || !e.start?.dateTime || !e.end?.dateTime || !phone)
            throw new Error("Evento sin metadatos completos");
          const id = randomUUID(),
            duration =
              (Date.parse(e.end.dateTime) - Date.parse(e.start.dateTime)) /
              60000;
          await c.query(
            `INSERT INTO bookings(id,professional_id,service_id,customer_name,customer_phone,customer_email,start_at,end_at,status,notes,google_event_id,google_calendar_id,service_name,duration_minutes,price,synced_at)VALUES($1,$2,$3,$4,$5,$6,$7,$8,'CONFIRMED',$9,$10,$11,$12,$13,$14,now())`,
            [
              id,
              p.id,
              s.id,
              meta.name ?? "Cliente",
              phone,
              meta.email ?? null,
              e.start.dateTime,
              e.end.dateTime,
              e.description ?? "",
              e.id,
              calendarId,
              s.name,
              duration,
              s.price,
            ],
          );
          await c.query("INSERT INTO booking_holds VALUES($1,$2,$3,$4,$5)", [
            id,
            p.id,
            calendarId,
            e.start.dateTime,
            e.end.dateTime,
          ]);
          await c.query(
            "INSERT INTO booking_audit(booking_id,action)VALUES($1,'IMPORT_LEGACY')",
            [id],
          );
          imported++;
        });
      } catch (error) {
        failures++;
        console.error(
          "Revisar evento",
          e.id,
          error instanceof Error ? error.message : "Error",
        );
      }
    }
    pageToken = data.nextPageToken ?? undefined;
  } while (pageToken);
  console.log({ imported, failures });
  if (failures) process.exitCode = 1;
}
main().finally(() => db().end());
