"use client";
import { useState } from "react";
import { hhmm, minutes, type Context, type Data, type Run } from "./types";
import styles from "../AdminPanel.module.css";
export default function AvailabilityEditor({
  data,
  context,
  run,
  busy,
  owner,
}: {
  data: Data;
  context: Context;
  run: Run;
  busy: boolean;
  owner: boolean;
}) {
  const [professional, setProfessional] = useState(context.professionalId),
    [date, setDate] = useState(context.date),
    [kind, setKind] = useState(context.time ? "BLOCK" : "CLOSED"),
    [start, setStart] = useState(context.time || "10:00"),
    [end, setEnd] = useState(
      hhmm(Math.min(1439, minutes(context.time || "10:00") + 60)),
    );
  const changes = data.exceptions.filter(
    (e) =>
      e.professional_id === professional &&
      e.date_from <= date &&
      e.date_to >= date,
  );
  return (
    <>
      <form
        className={styles.form}
        onSubmit={(e) => {
          e.preventDefault();
          void run({
            action: "exception",
            professionalId: professional,
            dateFrom: date,
            dateTo: date,
            kind,
            startMinute: kind === "CLOSED" ? 0 : minutes(start),
            endMinute: kind === "CLOSED" ? 1440 : minutes(end),
            reason: "Cambio desde la agenda",
          });
        }}
      >
        {owner && (
          <label>
            Profesional
            <select
              required
              value={professional}
              onChange={(e) => setProfessional(e.target.value)}
            >
              <option value="">Elegir profesional</option>
              {data.professionals.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </label>
        )}
        <label>
          Fecha
          <input
            required
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
        </label>
        <fieldset className={styles.choices}>
          <legend>¿Qué cambia este día?</legend>
          {[
            ["CLOSED", "No trabajo este día"],
            ["BLOCK", "Bloquear algunas horas"],
            ["HOURS", "Trabajar en otro horario este día"],
            ["EXTRA", "Sumar horas a mi horario de este día"],
          ].map(([value, label]) => (
            <label key={value}>
              <input
                type="radio"
                name="availability-kind"
                checked={kind === value}
                onChange={() => setKind(value)}
              />
              <span>{label}</span>
            </label>
          ))}
        </fieldset>
        {kind !== "CLOSED" && (
          <div className={styles.grid}>
            <label>
              Desde
              <input
                required
                type="time"
                value={start}
                onChange={(e) => setStart(e.target.value)}
              />
            </label>
            <label>
              Hasta
              <input
                required
                type="time"
                value={end}
                onChange={(e) => setEnd(e.target.value)}
              />
            </label>
          </div>
        )}
        {kind === "HOURS" && (
          <p className={styles.muted}>
            Este intervalo reemplaza el horario habitual de la fecha. Podés
            sumar otro intervalo para incluir un descanso. Los cambios ya
            guardados aparecen abajo.
          </p>
        )}
        <p className={styles.muted}>
          Si hay turnos afectados, primero tendrás que reprogramarlos o
          cancelarlos. No se cancelará ningún turno automáticamente.
        </p>
        <button className={styles.primary} disabled={busy || !professional}>
          Guardar cambio de este día
        </button>
      </form>
      {!!changes.length && (
        <section className={styles.section}>
          <h3>Cambios de este día</h3>
          <p className={styles.muted}>
            Para volver a trabajar en un horario cerrado, quitá el cierre
            correspondiente.
          </p>
          {changes.map((e) => (
            <div className={styles.change} key={e.id}>
              <span>
                {e.kind === "CLOSED"
                  ? "No trabaja"
                  : `${e.kind === "BLOCK" ? "No disponible" : e.kind === "EXTRA" ? "Horas agregadas" : "Horario de este día"}: ${hhmm(e.start_minute!)}–${hhmm(e.end_minute!)}`}
                {e.date_from !== e.date_to && (
                  <small>
                    Del {e.date_from} al {e.date_to}
                  </small>
                )}
              </span>
              <button
                disabled={busy}
                onClick={() => {
                  if (
                    e.date_from === e.date_to ||
                    window.confirm(
                      `Este cambio abarca del ${e.date_from} al ${e.date_to}. ¿Quitar todo el período?`,
                    )
                  )
                    void run({ action: "deleteException", id: e.id });
                }}
              >
                Quitar
              </button>
            </div>
          ))}
        </section>
      )}
    </>
  );
}
