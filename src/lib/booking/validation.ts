import { z } from "zod";
export const uuid = z.uuid();
export const phone = z
  .string()
  .max(40)
  .transform((s) => s.replace(/\D/g, ""))
  .pipe(z.string().regex(/^\d{10,13}$/));
export const instant = z.iso.datetime({ offset: true });
export const reservationInput = z.object({
  professionalId: uuid,
  service: uuid,
  startISO: instant,
  name: z.string().trim().min(2).max(120),
  phone,
  email: z.union([z.email().max(254), z.literal("")]).optional(),
  notes: z.string().trim().max(1000).default(""),
  idempotencyKey: uuid,
});
export class BookingError extends Error {
  constructor(
    message: string,
    public status = 400,
  ) {
    super(message);
  }
}
