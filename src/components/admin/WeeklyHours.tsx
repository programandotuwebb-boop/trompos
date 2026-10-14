"use client";
import { useState } from "react";
import type { Hours } from "@/lib/booking/availability";
import { hhmm, minutes, type Run } from "./types";
import styles from "../AdminPanel.module.css";
const days = [
  "Domingo",
  "Lunes",
  "Martes",
  "Miércoles",
  "Jueves",
  "Viernes",
  "Sábado",
];
export default function WeeklyHours({
  professionalId,
  initial,
  run,
  busy,
}: {
  professionalId: string;
  initial: Hours[];
  run: Run;
  busy: boolean;
}) {
  const [blocks, setBlocks] = useState<Hours[]>(
    initial.map(({ day_of_week, start_minute, end_minute }) => ({
      day_of_week,
      start_minute,
      end_minute,
    })),
  );
  const edit = (
    index: number,
    key: "start_minute" | "end_minute",
    value: string,
  ) =>
    setBlocks(
      blocks.map((b, i) => (i === index ? { ...b, [key]: minutes(value) } : b)),
    );
  return (
    <form
      className={styles.form}
      onSubmit={(e) => {
        e.preventDefault();
        void run({ action: "hours", professionalId, blocks });
      }}
    >
      <p className={styles.muted}>
        Este es tu horario habitual. Para cambiar solamente un día, hacelo desde
        Mi agenda.
      </p>
      {[1, 2, 3, 4, 5, 6, 0].map((day) => {
        const working = blocks.some((b) => b.day_of_week === day);
        return (
          <fieldset className={styles.weekDay} key={day}>
            <legend>{days[day]}</legend>
            <label className={styles.switch}>
              <input
                type="checkbox"
                role="switch"
                aria-label={`Trabajo ${days[day]}`}
                checked={working}
                onChange={(e) =>
                  setBlocks(
                    e.target.checked
                      ? [
                          ...blocks,
                          {
                            day_of_week: day,
                            start_minute: 600,
                            end_minute: 1140,
                          },
                        ]
                      : blocks.filter((b) => b.day_of_week !== day),
                  )
                }
              />
              <span>{working ? "Trabajo" : "No trabajo"}</span>
            </label>
            {blocks.map((b, i) =>
              b.day_of_week === day ? (
                <div className={styles.interval} key={i}>
                  <input
                    aria-label={`${days[day]} inicio ${i + 1}`}
                    required
                    type="time"
                    value={hhmm(b.start_minute)}
                    onChange={(e) => edit(i, "start_minute", e.target.value)}
                  />
                  <span>—</span>
                  <input
                    aria-label={`${days[day]} fin ${i + 1}`}
                    required
                    type="time"
                    value={hhmm(b.end_minute)}
                    onChange={(e) => edit(i, "end_minute", e.target.value)}
                  />
                  <button
                    type="button"
                    aria-label={`Eliminar intervalo ${days[day]} ${i + 1}`}
                    onClick={() => setBlocks(blocks.filter((_, j) => j !== i))}
                  >
                    ×
                  </button>
                </div>
              ) : null,
            )}
            {working && (
              <button
                type="button"
                className={styles.textButton}
                onClick={() =>
                  setBlocks([
                    ...blocks,
                    { day_of_week: day, start_minute: 840, end_minute: 1080 },
                  ])
                }
              >
                + Agregar intervalo
              </button>
            )}
          </fieldset>
        );
      })}
      <button className={styles.primary} disabled={busy}>
        Guardar horario habitual
      </button>
    </form>
  );
}
