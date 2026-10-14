"use client";
import { useState } from "react";
import type { Data, Service, Run } from "./types";
import styles from "../AdminPanel.module.css";
export default function ServiceEditor({
  service,
  data,
  run,
  busy,
  onSaved,
}: {
  service: Service | null;
  data: Data;
  run: Run;
  busy: boolean;
  onSaved: () => void;
}) {
  const [name, setName] = useState(service?.name ?? ""),
    [duration, setDuration] = useState(service?.duration_minutes ?? 45),
    [price, setPrice] = useState(service?.price ?? 0),
    [active, setActive] = useState(service?.active ?? true),
    [people, setPeople] = useState(
      data.professionals
        .filter((p) => service && p.service_ids.includes(service.id))
        .map((p) => p.id),
    );
  return (
    <form
      className={styles.form}
      onSubmit={async (e) => {
        e.preventDefault();
        if (
          await run({
            action: "service",
            id: service?.id,
            name,
            durationMinutes: duration,
            price,
            active,
            professionalIds: people,
          })
        )
          onSaved();
      }}
    >
      <label>
        Nombre
        <input
          required
          minLength={2}
          maxLength={100}
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </label>
      <div className={styles.grid}>
        <label>
          Duración (minutos)
          <input
            required
            type="number"
            min={5}
            max={480}
            value={duration}
            onChange={(e) => setDuration(Number(e.target.value))}
          />
        </label>
        <label>
          Precio ($)
          <input
            required
            type="number"
            min={0}
            max={100000000}
            value={price}
            onChange={(e) => setPrice(Number(e.target.value))}
          />
        </label>
      </div>
      <label className={styles.switch}>
        <input
          type="checkbox"
          checked={active}
          onChange={(e) => setActive(e.target.checked)}
        />
        <span>Disponible para reservar</span>
      </label>
      <fieldset className={styles.choices}>
        <legend>Profesionales que lo realizan</legend>
        {data.professionals.map((p) => (
          <label key={p.id}>
            <input
              type="checkbox"
              checked={people.includes(p.id)}
              onChange={(e) =>
                setPeople(
                  e.target.checked
                    ? [...people, p.id]
                    : people.filter((id) => id !== p.id),
                )
              }
            />
            <span>{p.name}</span>
          </label>
        ))}
      </fieldset>
      <button className={styles.primary} disabled={busy}>
        Guardar servicio
      </button>
    </form>
  );
}
