"use client";
import { slotsForDay } from "@/lib/booking/availability";
import {
  DAY,
  MINUTE,
  localDate,
  midnight,
  weekStart,
  timeLabel,
  dayLabel,
} from "@/lib/booking/time";
import { hhmm, states, type Data, type Booking, type Context } from "./types";
import styles from "../AdminPanel.module.css";
export default function Agenda({
  data,
  date,
  view,
  professional,
  now,
  onFree,
  onBooking,
  onDate,
}: {
  data: Data;
  date: string;
  view: "day" | "week";
  professional: string;
  now: number;
  onFree: (c: Context) => void;
  onBooking: (b: Booking) => void;
  onDate: (d: string) => void;
}) {
  const people = data.professionals.filter(
    (p) => !professional || p.id === professional,
  );
  const dates =
    view === "day"
      ? [date]
      : Array.from({ length: 7 }, (_, i) =>
          localDate(weekStart(0, midnight(date)) + i * DAY),
        );
  const columns = dates.flatMap((d) =>
    people.map((p) => {
      const base = midnight(d),
        bookings = data.bookings.filter(
          (b) =>
            b.professional_id === p.id &&
            localDate(new Date(b.start_at)) === d &&
            b.status !== "CANCELLED",
        );
      const schedule = {
        date: d,
        duration: 15,
        hours: data.hours.filter((h) => h.professional_id === p.id),
        exceptions: data.exceptions.filter((e) => e.professional_id === p.id),
        now: 0,
      };
      const working = slotsForDay({ ...schedule, busy: [] });
      const free = slotsForDay({
        ...schedule,
        busy: bookings.map((b) => ({
          start: Date.parse(b.start_at),
          end: Date.parse(b.end_at),
        })),
      });
      return { date: d, person: p, base, bookings, working, free };
    }),
  );
  const starts = columns.flatMap((c) => [
    ...c.working.map((s) => (Date.parse(s.iso) - c.base) / MINUTE),
    ...c.bookings.map((b) => (Date.parse(b.start_at) - c.base) / MINUTE),
  ]);
  const ends = columns.flatMap((c) => [
    ...c.working.map((s) => (Date.parse(s.iso) - c.base) / MINUTE + 15),
    ...c.bookings.map((b) => (Date.parse(b.end_at) - c.base) / MINUTE),
  ]);
  const from = starts.length
      ? Math.max(0, Math.floor(Math.min(...starts) / 60) * 60)
      : 540,
    to = ends.length
      ? Math.min(1440, Math.ceil(Math.max(...ends) / 60) * 60)
      : 1140;
  const scale = 1.3,
    height = (to - from) * scale;
  return (
    <>
      {view === "week" && (
        <div className={styles.mobileWeek}>
          {dates.map((d) => {
            const items = data.bookings.filter(
              (b) =>
                localDate(new Date(b.start_at)) === d &&
                (!professional || b.professional_id === professional) &&
                b.status !== "CANCELLED",
            );
            return (
              <section className={styles.weekSummary} key={d}>
                <button className={styles.dayLink} onClick={() => onDate(d)}>
                  {dayLabel(midnight(d))}
                  <span>Ver día →</span>
                </button>
                {items.length ? (
                  items.map((b) => (
                    <button
                      className={styles.listBooking}
                      key={b.id}
                      onClick={() => onBooking(b)}
                    >
                      <strong>
                        {timeLabel(new Date(b.start_at))} · {b.customer_name}
                      </strong>
                      <span>
                        {b.professional_name} · {b.service_name} ·{" "}
                        {b.duration_minutes} min
                      </span>
                    </button>
                  ))
                ) : (
                  <p className={styles.muted}>
                    Sin turnos. Abrí el día para ver disponibilidad.
                  </p>
                )}
              </section>
            );
          })}
        </div>
      )}
      <div
        className={`${styles.calendarScroll} ${view === "week" ? styles.desktopWeek : ""}`}
        tabIndex={0}
        aria-label="Agenda por horario; desplazá para ver más profesionales y horas"
      >
        <div
          className={styles.calendar}
          style={{
            gridTemplateColumns: `52px repeat(${Math.max(columns.length, 1)},minmax(${view === "week" ? 165 : 210}px,1fr))`,
          }}
        >
          <div className={styles.columnHead}>Hora</div>
          {columns.map((c) => (
            <div className={styles.columnHead} key={c.date + c.person.id}>
              {view === "week" && <small>{dayLabel(midnight(c.date))}</small>}
              <strong>{c.person.name}</strong>
              {!c.working.length && <small>No trabaja</small>}
            </div>
          ))}
          <div className={styles.timeAxis} style={{ height }}>
            {Array.from({ length: Math.ceil((to - from) / 60) }, (_, i) => (
              <span key={i} style={{ top: i * 60 * scale }}>
                {hhmm(from + i * 60)}
              </span>
            ))}
          </div>
          {columns.map((c) => (
            <div
              className={styles.dayColumn}
              key={c.date + c.person.id}
              style={{ height, backgroundSize: `100% ${60 * scale}px` }}
            >
              {c.working.map((s) => (
                <div
                  key={s.iso}
                  className={styles.workingCell}
                  style={{
                    top: ((Date.parse(s.iso) - c.base) / MINUTE - from) * scale,
                    height: 15 * scale,
                  }}
                />
              ))}
              {c.free.map((s) => (
                <button
                  type="button"
                  key={s.iso}
                  disabled={
                    Date.parse(s.iso) <= now ||
                    Date.parse(s.iso) > now + 56 * DAY ||
                    c.person.active === false
                  }
                  className={styles.freeCell}
                  style={{
                    top: ((Date.parse(s.iso) - c.base) / MINUTE - from) * scale,
                    height: 15 * scale,
                  }}
                  aria-label={`${c.person.name}, ${c.date}, ${s.label}: crear turno o bloquear horario`}
                  onClick={() =>
                    onFree({
                      professionalId: c.person.id,
                      date: c.date,
                      time: s.label,
                    })
                  }
                >
                  <span>{s.label} ＋</span>
                </button>
              ))}
              {c.bookings.map((b) => (
                <button
                  key={b.id}
                  className={`${styles.booking} ${b.status !== "CONFIRMED" ? styles.finished : ""}`}
                  style={{
                    top:
                      ((Date.parse(b.start_at) - c.base) / MINUTE - from) *
                      scale,
                    height: Math.max(
                      20,
                      ((Date.parse(b.end_at) - Date.parse(b.start_at)) /
                        MINUTE) *
                        scale -
                        2,
                    ),
                  }}
                  onClick={() => onBooking(b)}
                  aria-label={`${timeLabel(new Date(b.start_at))} ${b.customer_name}, ${b.service_name}, ${b.duration_minutes} minutos, ${states[b.status]}`}
                >
                  <strong>
                    {timeLabel(new Date(b.start_at))} · {b.customer_name}
                  </strong>
                  <span>
                    {b.service_name} · {b.duration_minutes} min
                  </span>
                  {b.status !== "CONFIRMED" && (
                    <small>{states[b.status]}</small>
                  )}
                </button>
              ))}
            </div>
          ))}
        </div>
      </div>
      {!people.length && (
        <p className={styles.empty}>
          Agregá un profesional en Equipo para comenzar.
        </p>
      )}
      <p className={styles.legend}>
        <span>▱ Libre</span>
        <span>▰ Turno</span>
        <span>▧ No disponible</span>
        <span>Tocá un espacio libre para crear un turno o bloquearlo.</span>
      </p>
    </>
  );
}
