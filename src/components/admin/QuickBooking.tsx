"use client";
import { useEffect, useRef, useState } from "react";
import { DAY, midnight, weekStart, localDate } from "@/lib/booking/time";
import type { Actor } from "@/lib/booking/auth";
import type { Context, Data } from "./types";
import styles from "../AdminPanel.module.css";
export default function QuickBooking({
  data,
  actor,
  context,
  onSaved,
  onLock,
}: {
  data: Data;
  actor: Actor;
  context: Context;
  onSaved: () => void;
  onLock: (locked: boolean) => void;
}) {
  const [professional, setProfessional] = useState(
      actor.professional_id ?? context.professionalId,
    ),
    [service, setService] = useState(""),
    [date, setDate] = useState(context.date),
    [time, setTime] = useState(context.time),
    [name, setName] = useState(""),
    [phone, setPhone] = useState("");
  const [error, setError] = useState(""),
    [busy, setBusy] = useState(false),
    [uncertain, setUncertain] = useState(false),
    [loaded, setLoaded] = useState<{
      key: string;
      slots: { iso: string; label: string }[];
      error?: string;
    } | null>(null);
  useEffect(() => {
    onLock(busy || uncertain);
    return () => onLock(false);
  }, [busy, uncertain, onLock]);
  const [today] = useState(() => localDate());
  const lastDay = localDate(midnight(today) + 56 * DAY);
  const inRange = date >= today && date <= lastDay;
  const identity = useRef({ payload: "", key: "" });
  const services = data.services.filter(
    (s) =>
      s.active &&
      (actor.role === "PROFESSIONAL" ||
        data.professionals
          .find((p) => p.id === professional)
          ?.service_ids.includes(s.id)),
  );
  const selectedService = services.find((s) => s.id === service);
  const query = [professional, service, date].join(":");
  useEffect(() => {
    if (!professional || !service || !date) return;
    const controller = new AbortController();
    const week = (weekStart(0, midnight(date)) - weekStart(0)) / (7 * DAY);
    if (week < 0 || week > 8) return;
    fetch(
      `/api/booking/availability?service=${service}&professionalId=${professional}&weekOffset=${week}`,
      { cache: "no-store", signal: controller.signal },
    )
      .then(async (r) => {
        const d = await r.json();
        if (!r.ok) throw new Error(d.error);
        setLoaded({
          key: query,
          slots:
            d.days.find((d: { date: string }) => d.date === date)?.slots ?? [],
        });
      })
      .catch((e) => {
        if (e.name !== "AbortError")
          setLoaded({ key: query, slots: [], error: e.message });
      });
    return () => controller.abort();
  }, [professional, service, date, query]);
  const current = loaded?.key === query ? loaded : null,
    slot = current?.slots.find((s) => s.label === time);
  return (
    <form
      className={styles.form}
      onSubmit={async (e) => {
        e.preventDefault();
        if (!selectedService || (!slot && !uncertain)) return;
        setBusy(true);
        setError("");
        const booking = {
          professionalId: professional,
          service,
          startISO: new Date(`${date}T${time}:00-03:00`).toISOString(),
          name,
          phone,
          notes: "",
        };
        const payload = JSON.stringify(booking);
        if (identity.current.payload !== payload)
          identity.current = { payload, key: crypto.randomUUID() };
        try {
          const r = await fetch("/api/admin/action", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              action: "reserve",
              booking: { ...booking, idempotencyKey: identity.current.key },
            }),
          });
          const d = await r.json();
          if (!r.ok) {
            setUncertain(r.status >= 500);
            setError(d.error);
            return;
          }
          onSaved();
        } catch {
          setUncertain(true);
          setError(
            "No pudimos verificar la respuesta. Reintentá con estos mismos datos para evitar duplicados.",
          );
        } finally {
          setBusy(false);
        }
      }}
    >
      {error && (
        <p role="alert" className={styles.error}>
          {error}
        </p>
      )}
      <fieldset disabled={busy || uncertain} className={styles.form}>
        {actor.role === "OWNER" && (
          <label>
            Profesional
            <select
              required
              value={professional}
              onChange={(e) => {
                setProfessional(e.target.value);
                setService("");
              }}
            >
              <option value="">Elegir profesional</option>
              {data.professionals
                .filter((p) => p.active)
                .map((p) => (
                  <option value={p.id} key={p.id}>
                    {p.name}
                  </option>
                ))}
            </select>
          </label>
        )}
        <label>
          Nombre del cliente
          <input
            required
            minLength={2}
            maxLength={100}
            autoComplete="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </label>
        <label>
          Teléfono
          <input
            required
            type="tel"
            autoComplete="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />
        </label>
        <label>
          Servicio
          <select
            required
            value={service}
            onChange={(e) => setService(e.target.value)}
          >
            <option value="">Elegir servicio</option>
            {services.map((s) => (
              <option value={s.id} key={s.id}>
                {s.name} · {s.duration_minutes} min
              </option>
            ))}
          </select>
        </label>
        <div className={styles.grid}>
          <label>
            Fecha
            <input
              required
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </label>
          <label>
            Hora
            <select
              required
              value={time}
              onChange={(e) => setTime(e.target.value)}
            >
              <option value="">Elegir hora</option>
              {time && !slot && (
                <option value={time} disabled>
                  {time} — elegí un horario disponible
                </option>
              )}
              {current?.slots.map((s) => (
                <option key={s.iso} value={s.label}>
                  {s.label}
                </option>
              ))}
            </select>
          </label>
        </div>
        {service && (
          <p className={styles.muted}>
            {!inRange
              ? "Elegí una fecha entre hoy y las próximas 8 semanas."
              : (current?.error ??
                (!current
                  ? "Consultando disponibilidad…"
                  : current.slots.length
                    ? "Horarios libres para la duración completa del servicio."
                    : "No hay horarios disponibles para este servicio en esa fecha."))}
          </p>
        )}
      </fieldset>
      <button
        className={styles.primary}
        disabled={busy || (!slot && !uncertain) || !selectedService}
      >
        {busy
          ? "Guardando…"
          : uncertain
            ? "Verificar y guardar"
            : "Guardar turno"}
      </button>
    </form>
  );
}
