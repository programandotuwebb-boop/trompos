"use client";
import { useState } from "react";
import { localDate, timeLabel, dayLabel } from "@/lib/booking/time";
import { states, type Booking, type Run } from "./types";
import styles from "../AdminPanel.module.css";
export default function BookingDetails({
  booking: b,
  run,
  busy,
  now,
}: {
  booking: Booking;
  run: Run;
  busy: boolean;
  now: number;
}) {
  const [action, setAction] = useState(""),
    [date, setDate] = useState(localDate(new Date(b.start_at))),
    [time, setTime] = useState(timeLabel(new Date(b.start_at)));
  return (
    <>
      <span className={styles.badge}>{states[b.status]}</span>
      <h3 className={styles.customer}>{b.customer_name}</h3>
      <a href={`tel:${b.customer_phone}`} className={styles.phone}>
        {b.customer_phone}
      </a>
      <dl className={styles.details}>
        <div>
          <dt>Servicio</dt>
          <dd>
            {b.service_name} · {b.duration_minutes} min
          </dd>
        </div>
        <div>
          <dt>Cuándo</dt>
          <dd>
            {dayLabel(new Date(b.start_at))} · {timeLabel(new Date(b.start_at))}
          </dd>
        </div>
        <div>
          <dt>Profesional</dt>
          <dd>{b.professional_name}</dd>
        </div>
      </dl>
      {b.notes && <p>{b.notes}</p>}
      {b.status === "CONFIRMED" && (
        <>
          <div className={styles.detailActions}>
            <button onClick={() => setAction("move")}>Reprogramar</button>
            <button onClick={() => setAction("cancel")}>Cancelar turno</button>
            <button
              disabled={Date.parse(b.start_at) > now || busy}
              onClick={() => setAction("COMPLETED")}
            >
              Completado
            </button>
            <button
              disabled={Date.parse(b.start_at) > now || busy}
              onClick={() => setAction("NO_SHOW")}
            >
              No asistió
            </button>
          </div>
          {action === "move" && (
            <form
              className={styles.form}
              onSubmit={async (e) => {
                e.preventDefault();
                if (
                  await run({
                    action: "move",
                    id: b.id,
                    startISO: new Date(
                      `${date}T${time}:00-03:00`,
                    ).toISOString(),
                  })
                )
                  setAction("");
              }}
            >
              <div className={styles.grid}>
                <label>
                  Nueva fecha
                  <input
                    required
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                  />
                </label>
                <label>
                  Nueva hora
                  <input
                    required
                    type="time"
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                  />
                </label>
              </div>
              <p className={styles.muted}>
                Si el nuevo horario no está libre, se conserva tu reserva
                original.
              </p>
              <button className={styles.primary} disabled={busy}>
                Guardar nuevo horario
              </button>
            </form>
          )}
          {action && action !== "move" && (
            <div className={styles.confirm}>
              <p>
                {action === "cancel"
                  ? "¿Cancelar este turno y liberar el horario?"
                  : `¿Marcar este turno como ${action === "COMPLETED" ? "completado" : "no asistió"}?`}
              </p>
              <div className={styles.row}>
                <button
                  disabled={busy}
                  onClick={async () => {
                    if (
                      await run(
                        action === "cancel"
                          ? { action: "cancel", id: b.id }
                          : { action: "status", id: b.id, status: action },
                      )
                    )
                      setAction("");
                  }}
                >
                  Sí, confirmar
                </button>
                <button onClick={() => setAction("")}>Volver</button>
              </div>
            </div>
          )}
        </>
      )}
    </>
  );
}
