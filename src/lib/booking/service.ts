import { createHash, randomUUID } from "node:crypto";
import { db, transaction } from "./db";
import {
  type Booking,
  type Professional,
  type Service,
  schedule,
} from "./repository";

import { slotsForDay, datesInWeek } from "./availability";
import {
  DAY,
  MINUTE,
  weekStart,
  localDate,
  midnight,
  dayLabel,
  timeLabel,
} from "./time";
import { BookingError, reservationInput } from "./validation";
import type { z } from "zod";
import type { PoolClient } from "pg";
export async function availability(
  serviceId: string,
  professionalId: string,
  offset: number,
) {
  const service = (
    await db().query<Service>("SELECT * FROM services WHERE id=$1 AND active", [
      serviceId,
    ])
  ).rows[0];
  if (!service) throw new BookingError("Servicio no disponible.");
  const professionals = (
    await db().query<Professional>(
      `SELECT p.* FROM professionals p JOIN professional_services ps ON ps.professional_id=p.id WHERE p.active AND ps.service_id=$1 AND ($2='any' OR p.id::text=$2) ORDER BY p.name`,
      [service.id, professionalId],
    )
  ).rows;
  const start = weekStart(offset),
    dates = datesInWeek(start);
  const results = await Promise.all(
    professionals.map(async (p) => {
      const rules = await schedule(p.id);
      const holds = (
        await db().query(
          "SELECT start_at,end_at FROM booking_holds WHERE professional_id=$1 AND start_at<$3 AND end_at>$2",
          [p.id, new Date(start), new Date(start + 7 * DAY)],
        )
      ).rows.map((b) => ({
        start: new Date(b.start_at).getTime(),
        end: new Date(b.end_at).getTime(),
      }));
      return dates.map((date) =>
        slotsForDay({
          date,
          duration: service.duration_minutes,
          ...rules,
          busy: holds,
          now: Date.now(),
        })
          .filter((slot) => Date.parse(slot.iso) <= Date.now() + 56 * DAY)
          .map((s) => ({
            ...s,
            professionalId: p.id,
            professionalName: p.name,
          })),
      );
    }),
  );
  return dates.map((date, index) => ({
    date,
    label: dayLabel(midnight(date)),
    slots: results
      .flatMap((days) => days[index])
      .sort(
        (a, b) =>
          a.iso.localeCompare(b.iso) ||
          a.professionalName.localeCompare(b.professionalName),
      ),
  }));
}
async function validateSlot(
  c: PoolClient,
  p: Professional,
  s: Service,
  start: number,
) {
  if (
    !Number.isFinite(start) ||
    start <= Date.now() ||
    start > Date.now() + 56 * DAY
  )
    throw new BookingError("Fecha fuera del período de reservas.");
  const rules = await schedule(p.id, c);
  if (
    !slotsForDay({
      date: localDate(start),
      duration: s.duration_minutes,
      ...rules,
      busy: [],
      now: Date.now(),
    }).some((slot) => Date.parse(slot.iso) === start)
  )
    throw new BookingError(
      "Horario fuera de jornada, descanso o bloqueo.",
      409,
    );
}
export function bookingResult(b: Booking) {
  return {
    id: b.id,
    eventId: `db:${b.id}`,
    professionalId: b.professional_id,
    professionalName: b.professional_name,
    serviceLabel: b.service_name,
    dateLabel: dayLabel(b.start_at),
    timeLabel: timeLabel(b.start_at),
    durationMinutes: b.duration_minutes,
    status: b.status,
    startISO: new Date(b.start_at).toISOString(),
    price: b.price,
  };
}
async function getBooking(c: PoolClient, id: string) {
  return (
    await c.query<Booking>(
      "SELECT b.*,p.name professional_name FROM bookings b JOIN professionals p ON p.id=b.professional_id WHERE b.id=$1",
      [id],
    )
  ).rows[0];
}
export async function reserve(
  raw: z.input<typeof reservationInput>,
  actorId?: string,
) {
  const input = reservationInput.parse(raw),
    hash = createHash("sha256").update(JSON.stringify(input)).digest("hex");
  try {
    return await transaction(async (c) => {
      await c.query("SELECT pg_advisory_xact_lock(hashtextextended($1,0))", [
        input.idempotencyKey,
      ]);
      const existing = (
        await c.query<Booking>(
          "SELECT * FROM bookings WHERE idempotency_key=$1",
          [input.idempotencyKey],
        )
      ).rows[0];
      if (existing) {
        if (existing.request_hash !== hash)
          throw new BookingError(
            "La solicitud cambió; volvé a elegir un horario.",
            409,
          );
        if (existing.status !== "CONFIRMED")
          throw new BookingError(
            "Esta solicitud ya finalizó. Elegí un horario nuevamente.",
            409,
          );
        return getBooking(c, existing.id);
      }
      const p = (
        await c.query<Professional>(
          "SELECT * FROM professionals WHERE id=$1 AND active FOR UPDATE",
          [input.professionalId],
        )
      ).rows[0];
      const s = (
        await c.query<Service>(
          "SELECT s.* FROM services s JOIN professional_services ps ON ps.service_id=s.id WHERE s.id=$1 AND ps.professional_id=$2 AND s.active FOR SHARE OF s",
          [input.service, input.professionalId],
        )
      ).rows[0];
      if (!p || !s)
        throw new BookingError("Profesional o servicio no disponible.");
      const start = Date.parse(input.startISO);
      await validateSlot(c, p, s, start);
      const id = randomUUID(),
        end = new Date(start + s.duration_minutes * MINUTE);
      await c.query(
        `INSERT INTO bookings(id,professional_id,service_id,customer_name,customer_phone,customer_email,start_at,end_at,status,notes,service_name,duration_minutes,price,idempotency_key,request_hash) VALUES($1,$2,$3,$4,$5,$6,$7,$8,'CONFIRMED',$9,$10,$11,$12,$13,$14)`,
        [
          id,
          p.id,
          s.id,
          input.name,
          input.phone,
          input.email || null,
          new Date(start),
          end,
          input.notes,
          s.name,
          s.duration_minutes,
          s.price,
          input.idempotencyKey,
          hash,
        ],
      );
      await c.query(
        "INSERT INTO booking_holds(booking_id,professional_id,start_at,end_at) VALUES($1,$2,$3,$4)",
        [id, p.id, new Date(start), end],
      );
      await c.query(
        "INSERT INTO booking_audit(booking_id,actor_id,action)VALUES($1,$2,$3)",
        [id, actorId ?? null, "CREATE"],
      );
      return getBooking(c, id);
    });
  } catch (error) {
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === "23P01"
    )
      throw new BookingError(
        "Ese horario acaba de ser reservado. Elegí otro.",
        409,
      );
    throw error;
  }
}
export async function changeBooking(
  id: string,
  action: "CANCEL" | "MOVE" | "COMPLETED" | "NO_SHOW",
  input: {
    phone?: string;
    actor?: { id: string; role: string; professional_id: string | null };
    startISO?: string;
  },
) {
  return transaction(async (c) => {
    const initial = (
      await c.query<Booking>("SELECT * FROM bookings WHERE id=$1", [id])
    ).rows[0];
    if (!initial) throw new BookingError("Reserva no encontrada.", 404);
    if (input.actor) {
      if (
        input.actor.role !== "OWNER" &&
        input.actor.professional_id !== initial.professional_id
      )
        throw new BookingError("Sin permiso.", 403);
    } else if (action !== "CANCEL" || initial.customer_phone !== input.phone)
      throw new BookingError("Reserva no encontrada.", 404);
    const p = (
      await c.query<Professional>(
        "SELECT * FROM professionals WHERE id=$1 FOR UPDATE",
        [initial.professional_id],
      )
    ).rows[0];
    await c.query("SELECT pg_advisory_xact_lock(hashtextextended($1,0))", [id]);
    const b = (
      await c.query<Booking>("SELECT * FROM bookings WHERE id=$1 FOR UPDATE", [
        id,
      ])
    ).rows[0];
    if (b.status === "CANCELLED" && action === "CANCEL")
      return getBooking(c, id);
    if (b.status !== "CONFIRMED")
      throw new BookingError("El turno ya finalizó o fue cancelado.", 409);
    if (
      (action === "COMPLETED" || action === "NO_SHOW") &&
      new Date(b.start_at).getTime() > Date.now()
    )
      throw new BookingError("No podés finalizar un turno futuro.", 409);
    if (action === "MOVE") {
      if (!input.startISO) throw new BookingError("Falta horario.");
      const start = Date.parse(input.startISO),
        end = new Date(start + b.duration_minutes * MINUTE);
      await validateSlot(
        c,
        p,
        { duration_minutes: b.duration_minutes } as Service,
        start,
      );
      await c.query(
        "UPDATE booking_holds SET start_at=$2,end_at=$3 WHERE booking_id=$1",
        [id, new Date(start), end],
      );
      await c.query(
        "UPDATE bookings SET start_at=$2,end_at=$3,updated_at=now() WHERE id=$1",
        [id, new Date(start), end],
      );
    } else {
      if (action === "CANCEL")
        await c.query("DELETE FROM booking_holds WHERE booking_id=$1", [id]);
      await c.query(
        "UPDATE bookings SET status=$2,updated_at=now() WHERE id=$1",
        [id, action === "CANCEL" ? "CANCELLED" : action],
      );
    }
    await c.query(
      "INSERT INTO booking_audit(booking_id,actor_id,action)VALUES($1,$2,$3)",
      [id, input.actor?.id ?? null, action],
    );
    return getBooking(c, id);
  });
}
