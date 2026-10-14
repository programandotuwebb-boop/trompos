import type { PoolClient } from "pg";
import { db } from "./db";
import type { Hours, Exception } from "./availability";
export type Professional = {
  id: string;
  name: string;
  slug: string;
  photo: string;
  description: string;
  active: boolean;
  google_calendar_id: string | null;
  legacy_calendar: boolean;
};
export type Service = {
  id: string;
  name: string;
  duration_minutes: number;
  price: number;
  active: boolean;
  legacy_key: string | null;
};
export type Booking = {
  id: string;
  professional_id: string;
  service_id: string;
  customer_name: string;
  customer_phone: string;
  customer_email: string | null;
  start_at: Date;
  end_at: Date;
  status: string;
  notes: string;
  google_event_id: string | null;
  google_calendar_id: string | null;
  service_name: string;
  duration_minutes: number;
  price: number;
  pending_action: "CREATE" | "MOVE" | "CANCEL" | null;
  target_start: Date | null;
  target_end: Date | null;
  sync_error: string | null;
  idempotency_key: string;
  request_hash: string;
  professional_name?: string;
};
export async function publicCatalog() {
  const services = (
    await db().query<Service>(
      "SELECT * FROM services WHERE active ORDER BY price,name",
    )
  ).rows;
  const professionals = (
    await db().query<Professional & { service_ids: string[] }>(
      `SELECT p.*,coalesce(array_agg(ps.service_id) FILTER(WHERE ps.service_id IS NOT NULL),'{}') service_ids FROM professionals p LEFT JOIN professional_services ps ON ps.professional_id=p.id WHERE p.active GROUP BY p.id ORDER BY p.name`,
    )
  ).rows;
  return {
    services: services.map(({ id, name, duration_minutes, price }) => ({
      id,
      name,
      durationMinutes: duration_minutes,
      price,
    })),
    professionals: professionals.map(
      ({ id, name, photo, description, service_ids }) => ({
        id,
        name,
        photo,
        description,
        serviceIds: service_ids,
      }),
    ),
  };
}
export async function schedule(
  id: string,
  c: PoolClient | ReturnType<typeof db> = db(),
) {
  const hours = (
    await c.query<Hours>(
      "SELECT * FROM working_hours WHERE professional_id=$1",
      [id],
    )
  ).rows;
  const exceptions = (
    await c.query<Exception>(
      "SELECT *,date_from::text,date_to::text FROM availability_exceptions WHERE professional_id=$1",
      [id],
    )
  ).rows;
  return { hours, exceptions };
}
