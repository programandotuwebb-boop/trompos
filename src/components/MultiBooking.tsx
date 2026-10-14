"use client";
import Image from "next/image";
import { useEffect, useState, useRef } from "react";
import { formatPrice } from "@/lib/format";
export type Catalog = {
  services: {
    id: string;
    name: string;
    durationMinutes: number;
    price: number;
  }[];
  professionals: {
    id: string;
    name: string;
    photo: string;
    description: string;
    serviceIds: string[];
  }[];
};
type Slot = {
  iso: string;
  label: string;
  professionalId: string;
  professionalName: string;
};
type Day = { date: string; label: string; slots: Slot[] };
type Confirmation = {
  id: string;
  professionalName: string;
  serviceLabel: string;
  dateLabel: string;
  timeLabel: string;
  durationMinutes: number;
  price: number;
};
const button =
  "border border-white/20 px-5 py-3 text-sm text-white transition-colors hover:border-bronze focus-visible:outline focus-visible:outline-bronze disabled:opacity-40";
const field =
  "w-full min-w-0 border border-white/20 bg-white/5 px-4 py-3 text-white outline-none focus:border-bronze";
export default function MultiBooking({
  admin = false,
  professionalScope,
  onBooked,
}: {
  admin?: boolean;
  professionalScope?: string;
  onBooked?: () => void;
}) {
  const [catalog, setCatalog] = useState<Catalog | null>(null),
    [step, setStep] = useState(0),
    [serviceId, setServiceId] = useState(""),
    [professionalId, setProfessionalId] = useState("");
  const [week, setWeek] = useState(0),
    [days, setDays] = useState<Day[] | null>(null),
    [slot, setSlot] = useState<Slot | null>(null),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [loading, setLoading] = useState(false);
  const [name, setName] = useState(""),
    [phone, setPhone] = useState(""),
    [email, setEmail] = useState(""),
    [notes, setNotes] = useState(""),
    [confirmation, setConfirmation] = useState<Confirmation | null>(null);
  const [refresh, setRefresh] = useState(0),
    [pending, setPending] = useState(false);
  const key = useRef<string | null>(null),
    lastPayload = useRef(""),
    title = useRef<HTMLHeadingElement>(null);
  const service = catalog?.services.find((s) => s.id === serviceId);
  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/booking/catalog", {
      signal: controller.signal,
      cache: "no-store",
    })
      .then(async (r) => {
        const d = await r.json();
        if (!r.ok) throw new Error(d.error);
        if (professionalScope) {
          d.professionals = d.professionals.filter(
            (p: Catalog["professionals"][number]) => p.id === professionalScope,
          );
          d.services = d.services.filter((s: Catalog["services"][number]) =>
            d.professionals.some((p: Catalog["professionals"][number]) =>
              p.serviceIds.includes(s.id),
            ),
          );
        }
        setCatalog(d);
      })
      .catch((e) => {
        if (e.name !== "AbortError") setError(e.message);
      });
    return () => controller.abort();
  }, [refresh, professionalScope]);
  useEffect(() => {
    if (step !== 2 || !serviceId || !professionalId) return;
    const controller = new AbortController();
    fetch(
      `/api/booking/availability?service=${serviceId}&professionalId=${professionalId}&weekOffset=${week}`,
      { cache: "no-store", signal: controller.signal },
    )
      .then(async (r) => {
        const d = await r.json();
        if (!r.ok) throw new Error(d.error);
        setDays(d.days);
      })
      .catch((e) => {
        if (e.name !== "AbortError") setError(e.message);
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [step, serviceId, professionalId, week, refresh]);
  function go(next: number) {
    setError("");
    setStep(next);
    if (next === 2) {
      setDays(null);
      setLoading(true);
    }
    requestAnimationFrame(() => title.current?.focus());
  }
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!slot || busy) return;
    setBusy(true);
    setPending(true);
    setError("");
    const payload = {
      professionalId: slot.professionalId,
      service: serviceId,
      startISO: slot.iso,
      name,
      phone,
      email,
      notes,
    };
    const encoded = JSON.stringify(payload);
    if (!key.current || encoded !== lastPayload.current) {
      key.current = crypto.randomUUID();
      lastPayload.current = encoded;
    }
    try {
      const booking = { ...payload, idempotencyKey: key.current };
      const r = await fetch(
        admin ? "/api/admin/action" : "/api/booking/reserve",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(
            admin ? { action: "reserve", booking } : booking,
          ),
        },
      );
      const d = await r.json();
      if (!r.ok) {
        setPending(r.status === 503);
        if (r.status === 409) {
          go(2);
          setSlot(null);
          key.current = null;
        }
        throw new Error(d.error);
      }
      const b = admin
        ? {
            id: d.result.id,
            professionalName: d.result.professional_name,
            serviceLabel: d.result.service_name,
            dateLabel: new Date(d.result.start_at).toLocaleDateString("es-AR", {
              timeZone: "America/Argentina/Buenos_Aires",
            }),
            timeLabel: new Date(d.result.start_at).toLocaleTimeString("es-AR", {
              timeZone: "America/Argentina/Buenos_Aires",
              hour: "2-digit",
              minute: "2-digit",
            }),
            durationMinutes: d.result.duration_minutes,
            price: d.result.price,
          }
        : d.booking;
      setConfirmation(b);
      setPending(false);
      go(4);
      onBooked?.();
    } catch (e) {
      setError(e instanceof Error ? e.message : "No pudimos reservar.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="min-w-0 text-white">
      <p className="text-xs tracking-[0.4em] text-bronze">RESERVA ONLINE</p>
      <h3
        ref={title}
        tabIndex={-1}
        className="mt-3 font-serif text-2xl outline-none sm:text-3xl"
      >
        {
          [
            "Reservá tu turno",
            "Elegí tu profesional",
            "Elegí fecha y hora",
            "Tus datos",
            "Tu turno está confirmado",
          ][step]
        }
      </h3>
      <ol
        aria-label="Pasos de la reserva"
        className="mt-6 flex flex-wrap gap-x-5 gap-y-3 text-xs text-white/50"
      >
        {[
          "Servicio",
          "Profesional",
          "Horario",
          "Tus datos",
          "Confirmación",
        ].map((label, i) => (
          <li
            key={label}
            aria-current={step === i ? "step" : undefined}
            className={step === i ? "text-bronze" : ""}
          >
            {i < step && step < 4 && !pending ? (
              <button
                type="button"
                onClick={() => go(i)}
              >{`0${i + 1} ${label}`}</button>
            ) : (
              `0${i + 1} ${label}`
            )}
          </li>
        ))}
      </ol>
      {error && (
        <p role="alert" className="mt-5 text-sm text-beige">
          {error}{" "}
          {!catalog && (
            <button
              className="underline"
              onClick={() => {
                setError("");
                setRefresh((v) => v + 1);
              }}
            >
              Reintentar
            </button>
          )}
        </p>
      )}
      {!catalog && !error && (
        <p role="status" className="mt-6">
          Cargando servicios…
        </p>
      )}
      {step === 0 && catalog && (
        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          {catalog.services.map((s) => (
            <button
              type="button"
              key={s.id}
              className={`${button} rounded-sm py-5 text-left`}
              onClick={() => {
                if (serviceId !== s.id) {
                  setProfessionalId("");
                  setSlot(null);
                  key.current = null;
                }
                setServiceId(s.id);
                go(1);
              }}
            >
              <span className="block font-serif text-lg">{s.name}</span>
              <span className="mt-1 block text-sm text-white/50">
                {s.durationMinutes} min — {formatPrice(s.price)}
              </span>
            </button>
          ))}
          {!catalog.services.length && (
            <p>No hay servicios disponibles. Contactanos para coordinar.</p>
          )}
        </div>
      )}
      {step === 1 && catalog && (
        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          {!professionalScope && (
            <button
              className={`${button} py-5 text-left`}
              onClick={() => {
                setProfessionalId("any");
                setWeek(0);
                go(2);
              }}
            >
              <span className="block font-serif text-xl">
                Cualquier profesional
              </span>
              <span className="mt-2 block text-xs text-white/60">
                Vas a ver quién atiende cada horario antes de reservar.
              </span>
            </button>
          )}
          {catalog.professionals
            .filter((p) => p.serviceIds.includes(serviceId))
            .map((p) => (
              <button
                key={p.id}
                className={`${button} flex items-center gap-4 text-left`}
                onClick={() => {
                  setProfessionalId(p.id);
                  setWeek(0);
                  go(2);
                }}
              >
                <Image
                  src={p.photo}
                  alt=""
                  width={64}
                  height={64}
                  className="h-16 w-16 rounded-full object-cover grayscale"
                />
                <span>
                  <span className="block font-serif text-xl">{p.name}</span>
                  <span className="mt-1 block text-xs text-white/60">
                    {p.description}
                  </span>
                  <span className="mt-2 block text-xs text-bronze">
                    Ver disponibilidad
                  </span>
                </span>
              </button>
            ))}
          {!catalog.professionals.some((p) =>
            p.serviceIds.includes(serviceId),
          ) && <p>No hay profesionales habilitados para este servicio.</p>}
        </div>
      )}
      {step === 2 && (
        <div className="mt-8">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <button className={button} onClick={() => go(1)}>
              ← Profesional
            </button>
            <div className="flex flex-wrap gap-3">
              <button
                className={button}
                disabled={week === 0 || loading}
                onClick={() => {
                  setWeek((w) => w - 1);
                  go(2);
                }}
              >
                Semana anterior
              </button>
              <button
                className={button}
                disabled={week >= 8 || loading}
                onClick={() => {
                  setWeek((w) => w + 1);
                  go(2);
                }}
              >
                Semana siguiente →
              </button>
            </div>
          </div>
          {loading && (
            <p role="status" className="mt-6">
              Buscando horarios disponibles…
            </p>
          )}
          {!loading && error && (
            <button
              className={`${button} mt-4`}
              onClick={() => {
                setError("");
                setLoading(true);
                setRefresh((v) => v + 1);
              }}
            >
              Reintentar disponibilidad
            </button>
          )}
          {!loading && days && (
            <div className="mt-8 space-y-5">
              {days.map((day) => (
                <div key={day.date}>
                  <p className="text-sm text-white/80">{day.label}</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {day.slots.map((s) => (
                      <button
                        key={`${s.iso}-${s.professionalId}`}
                        className={`${button} rounded-full text-sm`}
                        onClick={() => {
                          setSlot(s);
                          key.current = null;
                          go(3);
                        }}
                      >
                        {s.label}
                        {professionalId === "any" && (
                          <span className="ml-2 text-xs text-white/60">
                            {s.professionalName}
                          </span>
                        )}
                      </button>
                    ))}
                    {!day.slots.length && (
                      <p className="text-xs text-white/40">
                        Sin turnos disponibles
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
      {step === 3 && slot && (
        <form onSubmit={submit} className="mt-8 space-y-4">
          <p className="text-sm text-white/70">
            {service?.name} · {slot.professionalName} ·{" "}
            {new Date(slot.iso).toLocaleDateString("es-AR", {
              timeZone: "America/Argentina/Buenos_Aires",
            })}{" "}
            · {slot.label} · {service?.durationMinutes} min
          </p>
          <fieldset
            disabled={busy || pending}
            className="space-y-4 disabled:opacity-60"
          >
            <label className="block text-sm">
              Nombre
              <input
                className={`${field} mt-2`}
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                minLength={2}
                maxLength={120}
                autoComplete="name"
              />
            </label>
            <label className="block text-sm">
              Teléfono
              <input
                className={`${field} mt-2`}
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
                maxLength={40}
                autoComplete="tel"
              />
            </label>
            <label className="block text-sm">
              Email (opcional)
              <input
                className={`${field} mt-2`}
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                maxLength={254}
                autoComplete="email"
              />
            </label>
            <label className="block text-sm">
              Notas (opcional)
              <textarea
                className={`${field} mt-2`}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                maxLength={1000}
              />
            </label>
          </fieldset>
          <button disabled={busy} className={`${button} bg-bronze text-ink`}>
            {busy
              ? "Confirmando…"
              : pending
                ? "Reintentar verificación"
                : "Confirmar turno"}
          </button>
          {!pending && (
            <button
              type="button"
              disabled={busy}
              className={`${button} ml-3`}
              onClick={() => go(2)}
            >
              Otro horario
            </button>
          )}
        </form>
      )}
      {step === 4 && confirmation && (
        <div role="status" className="mt-8 space-y-3">
          <p className="font-serif text-xl text-bronze">
            {confirmation.professionalName} · {confirmation.serviceLabel}
          </p>
          <p>
            {confirmation.dateLabel} · {confirmation.timeLabel} ·{" "}
            {confirmation.durationMinutes} min
          </p>
          <p className="text-sm text-white/60">
            {formatPrice(confirmation.price)} · Ref.{" "}
            {confirmation.id.slice(0, 8)}
          </p>
          <p className="text-sm text-white/60">
            Podés cancelar desde “¿Ya reservaste? Cancelar turno”, con el
            teléfono de la reserva.
          </p>
          <button
            className={button}
            onClick={() => {
              setSlot(null);
              setConfirmation(null);
              key.current = null;
              go(0);
            }}
          >
            Reservar otro turno
          </button>
        </div>
      )}
    </div>
  );
}
