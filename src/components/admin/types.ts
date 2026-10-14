import type { Actor } from "@/lib/booking/auth";
import type { Hours, Exception } from "@/lib/booking/availability";
export type Professional = {
  id: string;
  name: string;
  slug: string;
  photo: string;
  description: string;
  active: boolean;
  service_ids: string[];
};
export type Service = {
  id: string;
  name: string;
  duration_minutes: number;
  price: number;
  active: boolean;
};
export type Booking = {
  id: string;
  professional_id: string;
  professional_name: string;
  service_id: string;
  customer_name: string;
  customer_phone: string;
  customer_email: string | null;
  service_name: string;
  start_at: string;
  end_at: string;
  duration_minutes: number;
  status: string;
  notes: string;
};
export type ScheduleBlock = Hours & { professional_id: string };
export type DayChange = Exception & {
  id: string;
  professional_id: string;
  reason: string;
};
export type Data = {
  actor: Actor;
  bookings: Booking[];
  professionals: Professional[];
  services: Service[];
  hours: ScheduleBlock[];
  exceptions: DayChange[];
  users: (Actor & { active: boolean })[];
  pagination: { page: number; total: number; hasMore: boolean };
};
export type Run = (command: Record<string, unknown>) => Promise<boolean>;
export type Context = { professionalId: string; date: string; time: string };
export const states: Record<string, string> = {
  CONFIRMED: "Confirmado",
  CANCELLED: "Cancelado",
  COMPLETED: "Completado",
  NO_SHOW: "No asistió",
};
export const hhmm = (n: number) =>
  `${String(Math.floor(n / 60)).padStart(2, "0")}:${String(n % 60).padStart(2, "0")}`;
export const minutes = (s: string) => {
  const [h, m] = s.split(":").map(Number);
  return h * 60 + m;
};
