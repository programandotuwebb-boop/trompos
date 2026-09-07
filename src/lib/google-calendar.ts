import { google } from "googleapis";

const BA_TIMEZONE = "America/Argentina/Buenos_Aires";
const BUSINESS_START_HOUR = 9;
const BUSINESS_END_HOUR = 20;
const SLOT_STEP_MINUTES = 30;
const BUSINESS_DAYS_PER_WEEK = 5; // lunes a viernes

export const SERVICES = {
  corte: { label: "Corte de pelo", durationMinutes: 45 },
  corte_barba: { label: "Corte + Barba", durationMinutes: 60 },
} as const;

export type ServiceKey = keyof typeof SERVICES;

export type DaySlot = { iso: string; label: string };
export type DayAvailability = { date: string; label: string; slots: DaySlot[] };
export type BookingSummary = {
  eventId: string;
  dateLabel: string;
  timeLabel: string;
  serviceLabel: string;
};

// Tag interno para distinguir turnos creados por el sitio de cualquier otro
// evento que pueda existir en el calendario (relevante sobre todo durante
// las pruebas, ya que se usa un calendario personal).
const BOOKING_SOURCE_TAG = "janeiro-web";

function getEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Falta configurar la variable de entorno ${name}`);
  }
  return value;
}

export function getCalendarId(): string {
  return getEnv("GOOGLE_CALENDAR_ID");
}

function getCalendarClient() {
  const email = getEnv("GOOGLE_CLIENT_EMAIL");
  const key = getEnv("GOOGLE_PRIVATE_KEY").replace(/\\n/g, "\n");

  const auth = new google.auth.JWT({
    email,
    key,
    scopes: ["https://www.googleapis.com/auth/calendar"],
  });

  return google.calendar({ version: "v3", auth });
}

/**
 * Medianoche de "hoy" en Buenos Aires, como instante real (Date con epoch
 * correcto). Único punto del módulo que necesita saber el offset -03:00;
 * de acá en adelante toda la aritmética de fechas es suma/resta de horas
 * reales sobre instantes ya correctos, sin más conversiones de timezone.
 */
function getTodayMidnightBA(): Date {
  const ymd = new Intl.DateTimeFormat("en-CA", {
    timeZone: BA_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
  return new Date(`${ymd}T00:00:00-03:00`);
}

function getWeekMonday(weekOffset: number): Date {
  const today = getTodayMidnightBA();
  const dow = today.getUTCDay(); // 0 = domingo ... 6 = sábado
  const diffToMonday = dow === 0 ? -6 : 1 - dow;
  const monday = new Date(today);
  monday.setUTCDate(monday.getUTCDate() + diffToMonday + weekOffset * 7);
  return monday;
}

function capitalize(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

function formatDayLabel(day: Date): string {
  const weekday = capitalize(
    new Intl.DateTimeFormat("es-AR", { weekday: "long", timeZone: BA_TIMEZONE }).format(day)
  );
  // Se arma "día/mes" a mano: el formato combinado de Intl para es-AR
  // devuelve "7-9" en vez de "7/9", que se confunde con un rango de fechas.
  const dayNumber = new Intl.DateTimeFormat("es-AR", { day: "numeric", timeZone: BA_TIMEZONE }).format(day);
  const monthNumber = new Intl.DateTimeFormat("es-AR", { month: "numeric", timeZone: BA_TIMEZONE }).format(day);
  return `${weekday} ${dayNumber}/${monthNumber}`;
}

function formatTimeLabel(date: Date): string {
  return new Intl.DateTimeFormat("es-AR", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: BA_TIMEZONE,
  }).format(date);
}

type BusyInterval = { start: number; end: number };

async function getBusyIntervals(
  timeMin: Date,
  timeMax: Date
): Promise<BusyInterval[]> {
  const calendar = getCalendarClient();
  const calendarId = getCalendarId();

  const response = await calendar.freebusy.query({
    requestBody: {
      timeMin: timeMin.toISOString(),
      timeMax: timeMax.toISOString(),
      items: [{ id: calendarId }],
    },
  });

  const busy = response.data.calendars?.[calendarId]?.busy ?? [];
  return busy.map((b) => ({
    start: new Date(b.start!).getTime(),
    end: new Date(b.end!).getTime(),
  }));
}

export async function getWeekAvailability(
  service: ServiceKey,
  weekOffset: number
): Promise<DayAvailability[]> {
  const durationMs = SERVICES[service].durationMinutes * 60 * 1000;
  const stepMs = SLOT_STEP_MINUTES * 60 * 1000;

  const monday = getWeekMonday(weekOffset);
  const weekEnd = new Date(monday);
  weekEnd.setUTCDate(weekEnd.getUTCDate() + BUSINESS_DAYS_PER_WEEK);

  const busyIntervals = await getBusyIntervals(monday, weekEnd);
  const now = Date.now();

  const days: DayAvailability[] = [];

  for (let i = 0; i < BUSINESS_DAYS_PER_WEEK; i++) {
    const day = new Date(monday);
    day.setUTCDate(monday.getUTCDate() + i);

    const dayStartMs = day.getTime() + BUSINESS_START_HOUR * 60 * 60 * 1000;
    const dayEndMs = day.getTime() + BUSINESS_END_HOUR * 60 * 60 * 1000;

    const slots: DaySlot[] = [];
    for (
      let slotStart = dayStartMs;
      slotStart + durationMs <= dayEndMs;
      slotStart += stepMs
    ) {
      if (slotStart < now) continue;

      const slotEnd = slotStart + durationMs;
      const overlapsBusy = busyIntervals.some(
        (b) => slotStart < b.end && slotEnd > b.start
      );
      if (overlapsBusy) continue;

      const slotDate = new Date(slotStart);
      slots.push({ iso: slotDate.toISOString(), label: formatTimeLabel(slotDate) });
    }

    days.push({
      date: new Intl.DateTimeFormat("en-CA", { timeZone: BA_TIMEZONE }).format(day),
      label: formatDayLabel(day),
      slots,
    });
  }

  return days;
}

export async function createBooking(input: {
  startISO: string;
  service: ServiceKey;
  name: string;
  phone: string;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const start = new Date(input.startISO);
  const end = new Date(start.getTime() + SERVICES[input.service].durationMinutes * 60 * 1000);

  const calendar = getCalendarClient();
  const calendarId = getCalendarId();

  // Revalidación justo antes de crear el evento: reduce a milisegundos la
  // ventana en la que dos personas podrían reservar el mismo horario a la vez.
  const stillFree = (await getBusyIntervals(start, end)).length === 0;
  if (!stillFree) {
    return { ok: false, error: "Ese horario ya no está disponible. Elegí otro, por favor." };
  }

  await calendar.events.insert({
    calendarId,
    requestBody: {
      summary: `Turno: ${input.name} - ${SERVICES[input.service].label}`,
      description: `Teléfono: ${input.phone}`,
      start: { dateTime: start.toISOString(), timeZone: BA_TIMEZONE },
      end: { dateTime: end.toISOString(), timeZone: BA_TIMEZONE },
      extendedProperties: {
        private: { source: BOOKING_SOURCE_TAG, service: input.service },
      },
    },
  });

  return { ok: true };
}

function onlyDigits(text: string): string {
  return text.replace(/\D/g, "");
}

function extractPhoneDigits(description?: string | null): string {
  if (!description) return "";
  const match = description.match(/Tel[eé]fono:\s*(.+)/i);
  return onlyDigits(match ? match[1] : description);
}

/**
 * NOTA DE SEGURIDAD: la identificación para buscar/cancelar turnos es solo
 * por número de teléfono, sin contraseña ni verificación adicional. Es
 * intencional — para el volumen y el riesgo de una barbería, pedir más que
 * el teléfono complicaría la experiencia sin necesidad real. La contra es
 * que cualquiera que sepa el teléfono de otra persona podría, en teoría,
 * ver y cancelar sus turnos. Si en el futuro hace falta más seguridad, una
 * mejora simple sería pedir también el nombre y exigir que coincida con el
 * de la reserva original.
 */
export async function findBookingsByPhone(phone: string): Promise<BookingSummary[]> {
  const targetDigits = onlyDigits(phone);
  if (!targetDigits) return [];

  const calendar = getCalendarClient();
  const calendarId = getCalendarId();

  const response = await calendar.events.list({
    calendarId,
    timeMin: new Date().toISOString(),
    singleEvents: true,
    orderBy: "startTime",
    privateExtendedProperty: [`source=${BOOKING_SOURCE_TAG}`],
    maxResults: 50,
  });

  const events = response.data.items ?? [];

  return events
    .filter((event) => extractPhoneDigits(event.description) === targetDigits)
    .map((event) => {
      const start = new Date(event.start?.dateTime ?? event.start?.date ?? "");
      const serviceKey = event.extendedProperties?.private?.service as ServiceKey | undefined;
      const serviceLabel =
        (serviceKey && SERVICES[serviceKey]?.label) ??
        event.summary?.split(" - ").slice(1).join(" - ") ??
        "Turno";

      return {
        eventId: event.id!,
        dateLabel: formatDayLabel(start),
        timeLabel: formatTimeLabel(start),
        serviceLabel,
      };
    });
}

export async function cancelBooking(input: {
  eventId: string;
  phone: string;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const calendar = getCalendarClient();
  const calendarId = getCalendarId();
  const targetDigits = onlyDigits(input.phone);

  let event;
  try {
    const response = await calendar.events.get({ calendarId, eventId: input.eventId });
    event = response.data;
  } catch {
    return { ok: false, error: "No encontramos ese turno." };
  }

  // Revalida contra el evento real (no confía ciegamente en el eventId que
  // manda el cliente) que sea un turno del sitio y que el teléfono coincida.
  const isOwnBooking = event.extendedProperties?.private?.source === BOOKING_SOURCE_TAG;
  const phoneMatches = extractPhoneDigits(event.description) === targetDigits;

  if (!isOwnBooking || !phoneMatches) {
    return { ok: false, error: "No encontramos ese turno con ese teléfono." };
  }

  await calendar.events.delete({ calendarId, eventId: input.eventId });
  return { ok: true };
}
