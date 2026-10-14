import { z } from "zod";
import { db, transaction } from "./db";
import { type Actor } from "./auth";
import { BookingError, uuid, instant, reservationInput } from "./validation";
import { reserve, changeBooking } from "./service";
import { hashPassword } from "./password";
import { DAY, localDate, midnight } from "./time";
import { slotsForDay, type Hours, type Exception } from "./availability";
import { schedule, type Booking, type Professional } from "./repository";
const date = z.iso.date();
const hours = z
  .object({
    day_of_week: z.number().int().min(0).max(6),
    start_minute: z.number().int().min(0).max(1439),
    end_minute: z.number().int().min(1).max(1440),
  })
  .refine((h) => h.start_minute < h.end_minute);
const photo = z
  .string()
  .max(500)
  .refine(
    (s) => /^\/images\/[a-zA-Z0-9/_\-.]+$/.test(s),
    "Usá una imagen de /images/",
  );
export const adminCommand = z.discriminatedUnion("action", [
  z.object({
    action: z.literal("professional"),
    id: uuid.optional(),
    name: z.string().trim().min(2).max(80),
    slug: z
      .string()
      .regex(/^[a-z0-9-]+$/)
      .max(80),
    photo,
    description: z.string().max(500),
    active: z.boolean(),
    serviceIds: z.array(uuid).max(100),
  }),
  z.object({ action: z.literal("deleteProfessional"), id: uuid }),
  z.object({
    action: z.literal("service"),
    id: uuid.optional(),
    name: z.string().trim().min(2).max(100),
    durationMinutes: z.number().int().min(5).max(480),
    price: z.number().int().min(0).max(100000000),
    active: z.boolean(),
    professionalIds: z.array(uuid).max(1000).optional(),
  }),
  z.object({
    action: z.literal("hours"),
    professionalId: uuid,
    blocks: z.array(hours).max(28),
  }),
  z.object({
    action: z.literal("exception"),
    professionalId: uuid,
    dateFrom: date,
    dateTo: date,
    kind: z.enum(["BLOCK", "CLOSED", "HOURS", "EXTRA"]),
    startMinute: z.number().int().min(0).max(1439),
    endMinute: z.number().int().min(1).max(1440),
    reason: z.string().max(300),
  }),
  z.object({ action: z.literal("deleteException"), id: uuid }),
  z.object({ action: z.literal("reserve"), booking: reservationInput }),
  z.object({ action: z.literal("cancel"), id: uuid }),
  z.object({ action: z.literal("move"), id: uuid, startISO: instant }),
  z.object({
    action: z.literal("status"),
    id: uuid,
    status: z.enum(["COMPLETED", "NO_SHOW"]),
  }),
  z.object({
    action: z.literal("user"),
    email: z.email().transform((s) => s.toLowerCase()),
    password: z.string().min(12).max(256),
    role: z.enum(["OWNER", "PROFESSIONAL"]),
    professionalId: uuid.nullable(),
    canBlock: z.boolean().default(true),
  }),
  z.object({
    action: z.literal("userAccess"),
    id: uuid,
    active: z.boolean(),
    canBlock: z.boolean().default(true),
  }),
]);
export async function executeAdmin(actor: Actor, raw: unknown) {
  const command = adminCommand.parse(raw);
  if (
    actor.role !== "OWNER" &&
    ![
      "exception",
      "deleteException",
      "hours",
      "reserve",
      "cancel",
      "move",
      "status",
    ].includes(command.action)
  )
    throw new BookingError("Sin permiso.", 403);
  switch (command.action) {
    case "reserve":
      if (
        actor.role !== "OWNER" &&
        actor.professional_id !== command.booking.professionalId
      )
        throw new BookingError("Sin permiso.", 403);
      return reserve(command.booking, actor.id);
    case "cancel":
      return changeBooking(command.id, "CANCEL", { actor });
    case "move":
      return changeBooking(command.id, "MOVE", {
        actor,
        startISO: command.startISO,
      });
    case "status":
      return changeBooking(command.id, command.status, { actor });
    case "professional":
      return transaction(async (c) => {
        const old = command.id
          ? (
              await c.query<Professional>(
                "SELECT * FROM professionals WHERE id=$1 FOR UPDATE",
                [command.id],
              )
            ).rows[0]
          : null;
        if (command.id && !old)
          throw new BookingError("Profesional inexistente.", 404);
        const values = [
          command.name,
          command.slug,
          command.photo,
          command.description,
          command.active,
        ];
        const result = command.id
          ? await c.query(
              "UPDATE professionals SET name=$1,slug=$2,photo=$3,description=$4,active=$5 WHERE id=$6 RETURNING id",
              [...values, command.id],
            )
          : await c.query(
              "INSERT INTO professionals(name,slug,photo,description,active)VALUES($1,$2,$3,$4,$5)RETURNING id",
              values,
            );
        const id = result.rows[0].id;
        await c.query(
          "DELETE FROM professional_services WHERE professional_id=$1",
          [id],
        );
        for (const service of new Set(command.serviceIds))
          await c.query("INSERT INTO professional_services VALUES($1,$2)", [
            id,
            service,
          ]);
        return { id };
      });
    case "deleteProfessional":
      await db().query("DELETE FROM professionals WHERE id=$1", [command.id]);
      return {};
    case "service":
      return transaction(async (c) => {
        // Same lock order as reservations/profile edits: professional before service.
        if (command.professionalIds)
          await c.query("SELECT id FROM professionals ORDER BY id FOR UPDATE");
        const args = [
          command.name,
          command.durationMinutes,
          command.price,
          command.active,
        ];
        const result = command.id
          ? await c.query(
              "UPDATE services SET name=$1,duration_minutes=$2,price=$3,active=$4 WHERE id=$5 RETURNING id",
              [...args, command.id],
            )
          : await c.query(
              "INSERT INTO services(name,duration_minutes,price,active)VALUES($1,$2,$3,$4)RETURNING id",
              args,
            );
        const id = result.rows[0]?.id;
        if (!id) throw new BookingError("Servicio inexistente.", 404);
        if (command.professionalIds) {
          await c.query(
            "DELETE FROM professional_services WHERE service_id=$1",
            [id],
          );
          for (const professionalId of new Set(command.professionalIds))
            await c.query(
              "INSERT INTO professional_services(professional_id,service_id)VALUES($1,$2)",
              [professionalId, id],
            );
        }
        return { id };
      });
    case "hours":
      if (
        actor.role !== "OWNER" &&
        actor.professional_id !== command.professionalId
      )
        throw new BookingError("Sin permiso.", 403);
      return transaction(async (c) => {
        await c.query("SELECT id FROM professionals WHERE id=$1 FOR UPDATE", [
          command.professionalId,
        ]);
        const rules = await schedule(command.professionalId, c);
        const bookings = (
          await c.query<Booking>(
            "SELECT * FROM bookings WHERE professional_id=$1 AND status='CONFIRMED' AND end_at>now()",
            [command.professionalId],
          )
        ).rows;
        assertBookingsFit(bookings, command.blocks, rules.exceptions);
        await c.query("DELETE FROM working_hours WHERE professional_id=$1", [
          command.professionalId,
        ]);
        for (const h of command.blocks)
          await c.query(
            "INSERT INTO working_hours(professional_id,day_of_week,start_minute,end_minute)VALUES($1,$2,$3,$4)",
            [
              command.professionalId,
              h.day_of_week,
              h.start_minute,
              h.end_minute,
            ],
          );
        await c.query(
          "INSERT INTO booking_audit(actor_id,action)VALUES($1,$2)",
          [actor.id, JSON.stringify(command)],
        );
        return {};
      });
    case "exception":
      return transaction(async (c) => {
        if (
          actor.role !== "OWNER" &&
          actor.professional_id !== command.professionalId
        )
          throw new BookingError("Sin permiso.", 403);
        if (
          command.dateFrom > command.dateTo ||
          command.startMinute >= command.endMinute
        )
          throw new BookingError("Intervalo inválido.");
        await c.query("SELECT id FROM professionals WHERE id=$1 FOR UPDATE", [
          command.professionalId,
        ]);
        const start = midnight(command.dateFrom),
          end = midnight(command.dateTo) + DAY;
        if (end - start > 366 * DAY)
          throw new BookingError("Máximo un año por excepción.");
        const rules = await schedule(command.professionalId, c);
        const future = [
          ...rules.exceptions,
          {
            date_from: command.dateFrom,
            date_to: command.dateTo,
            kind: command.kind,
            start_minute: command.startMinute,
            end_minute: command.endMinute,
          },
        ];
        const bookings = (
          await c.query<Booking>(
            "SELECT * FROM bookings WHERE professional_id=$1 AND status='CONFIRMED' AND ((start_at<$3 AND end_at>$2) OR (target_start<$3 AND target_end>$2))",
            [command.professionalId, new Date(start), new Date(end)],
          )
        ).rows;
        assertBookingsFit(bookings, rules.hours, future);
        await c.query(
          "INSERT INTO availability_exceptions(professional_id,date_from,date_to,kind,start_minute,end_minute,reason)VALUES($1,$2,$3,$4,$5,$6,$7)",
          [
            command.professionalId,
            command.dateFrom,
            command.dateTo,
            command.kind,
            command.startMinute,
            command.endMinute,
            command.reason,
          ],
        );
        await c.query(
          "INSERT INTO booking_audit(actor_id,action)VALUES($1,$2)",
          [actor.id, JSON.stringify(command)],
        );
        return {};
      });
    case "deleteException":
      return transaction(async (c) => {
        const e = (
          await c.query(
            "SELECT *,date_from::text,date_to::text FROM availability_exceptions WHERE id=$1",
            [command.id],
          )
        ).rows[0];
        if (!e) throw new BookingError("Excepción inexistente.", 404);
        if (
          actor.role !== "OWNER" &&
          actor.professional_id !== e.professional_id
        )
          throw new BookingError("Sin permiso.", 403);
        await c.query("SELECT id FROM professionals WHERE id=$1 FOR UPDATE", [
          e.professional_id,
        ]);
        await c.query("DELETE FROM availability_exceptions WHERE id=$1", [
          command.id,
        ]);
        if (e.kind === "HOURS" || e.kind === "EXTRA") {
          const rules = await schedule(e.professional_id, c);
          const bookings = (
            await c.query<Booking>(
              "SELECT * FROM bookings WHERE professional_id=$1 AND status='CONFIRMED' AND ((start_at<$3 AND end_at>$2) OR (target_start<$3 AND target_end>$2))",
              [
                e.professional_id,
                new Date(midnight(e.date_from)),
                new Date(midnight(e.date_to) + DAY),
              ],
            )
          ).rows;
          assertBookingsFit(bookings, rules.hours, rules.exceptions);
        }
        await c.query(
          "INSERT INTO booking_audit(actor_id,action)VALUES($1,$2)",
          [actor.id, JSON.stringify(command)],
        );
        return {};
      });
    case "user": {
      if (command.role === "PROFESSIONAL" && !command.professionalId)
        throw new BookingError("Falta profesional.");
      const hash = await hashPassword(command.password);
      await db().query(
        "INSERT INTO admin_users(email,password_hash,role,professional_id,can_block)VALUES($1,$2,$3,$4,$5)",
        [
          command.email,
          hash,
          command.role,
          command.role === "OWNER" ? null : command.professionalId,
          command.canBlock,
        ],
      );
      return {};
    }
    case "userAccess": {
      if (command.id === actor.id && !command.active)
        throw new BookingError("No podés desactivar tu propia cuenta.");
      await transaction(async (c) => {
        await c.query(
          "UPDATE admin_users SET active=$2,can_block=$3 WHERE id=$1",
          [command.id, command.active, command.canBlock],
        );
        await c.query("DELETE FROM admin_sessions WHERE user_id=$1", [
          command.id,
        ]);
      });
      return {};
    }
  }
}

function assertBookingsFit(
  bookings: Booking[],
  hours: Hours[],
  exceptions: Exception[],
) {
  for (const booking of bookings) {
    for (const value of [booking.start_at, booking.target_start]) {
      if (!value) continue;
      const start = new Date(value).getTime();
      if (
        !slotsForDay({
          date: localDate(start),
          duration: booking.duration_minutes,
          hours,
          exceptions,
          busy: [],
          now: 0,
        }).some((slot) => Date.parse(slot.iso) === start)
      ) {
        throw new BookingError(
          "El cambio afectaría una reserva existente o pendiente. Reprogramala o cancelala primero.",
          409,
        );
      }
    }
  }
}
