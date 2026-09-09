"use client";

import { useEffect, useState } from "react";
import { isValidPhone } from "@/lib/validation";
import { formatPrice } from "@/lib/format";
import { siteConfig } from "@/lib/site-content";

type ServiceKey = "corte" | "corte_barba";

const SERVICES: { key: ServiceKey; label: string; duration: string }[] = [
  { key: "corte", label: "Corte de pelo", duration: "45 min" },
  { key: "corte_barba", label: "Corte + Barba", duration: "1 hora" },
];

type DaySlot = { iso: string; label: string };
type DayAvailability = { date: string; label: string; slots: DaySlot[] };

type Step = "service" | "slots" | "details" | "success";

type SelectedSlot = { iso: string; timeLabel: string; dayLabel: string };

type CalendarBookingProps = {
  prices: Record<string, number>;
};

export default function CalendarBooking({ prices }: CalendarBookingProps) {
  const [step, setStep] = useState<Step>("service");
  const [service, setService] = useState<ServiceKey | null>(null);
  const [weekOffset, setWeekOffset] = useState(0);
  const [days, setDays] = useState<DayAvailability[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [selectedSlot, setSelectedSlot] = useState<SelectedSlot | null>(null);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [confirmedSlot, setConfirmedSlot] = useState<SelectedSlot | null>(null);

  useEffect(() => {
    if (step !== "slots" || !service) return;

    let cancelled = false;

    fetch(`/api/booking/availability?service=${service}&weekOffset=${weekOffset}`, {
      cache: "no-store",
    })
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "No pudimos cargar los turnos.");
        return data.days as DayAvailability[];
      })
      .then((data) => {
        if (!cancelled) {
          setDays(data);
          setLoadError(null);
        }
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setDays(null);
          setLoadError(
            err instanceof Error ? err.message : "No pudimos cargar los turnos."
          );
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [step, service, weekOffset]);

  function goToWeek(updater: (current: number) => number) {
    setLoading(true);
    setLoadError(null);
    setWeekOffset(updater);
  }

  function chooseService(key: ServiceKey) {
    setService(key);
    setWeekOffset(0);
    setDays(null);
    setLoading(true);
    setLoadError(null);
    setStep("slots");
  }

  function chooseSlot(slot: DaySlot, dayLabel: string) {
    setSelectedSlot({ iso: slot.iso, timeLabel: slot.label, dayLabel });
    setSubmitError(null);
    setStep("details");
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!service || !selectedSlot) return;

    if (!isValidPhone(phone)) {
      setSubmitError("Ingresá un teléfono válido (10 a 13 dígitos).");
      return;
    }

    setSubmitting(true);
    setSubmitError(null);

    try {
      const res = await fetch("/api/booking/reserve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          startISO: selectedSlot.iso,
          service,
          name,
          phone,
          ...(email.trim() ? { email: email.trim() } : {}),
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        if (res.status === 409) {
          setSubmitError(data.error ?? "Ese horario ya no está disponible.");
          setStep("slots");
          setSelectedSlot(null);
          // Al volver a "slots" el efecto vuelve a pedir disponibilidad,
          // así el horario que ya se ocupó desaparece de la grilla.
          setDays(null);
          setLoading(true);
          setLoadError(null);
          return;
        }
        throw new Error(data.error ?? "No pudimos confirmar el turno.");
      }

      setConfirmedSlot(selectedSlot);
      setStep("success");
    } catch (err) {
      setSubmitError(
        err instanceof Error ? err.message : "No pudimos confirmar el turno."
      );
    } finally {
      setSubmitting(false);
    }
  }

  function reset() {
    setStep("service");
    setService(null);
    setWeekOffset(0);
    setDays(null);
    setSelectedSlot(null);
    setName("");
    setPhone("");
    setEmail("");
    setSubmitError(null);
    setConfirmedSlot(null);
  }

  return (
    <div className="text-white">
      <p className="text-xs tracking-[0.4em] text-bronze">RESERVA ONLINE</p>
      <h3 className="mt-3 font-serif text-2xl sm:text-3xl">Reservá tu turno</h3>

      {step === "service" && (
        <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
          {SERVICES.map((s) => (
            <button
              key={s.key}
              type="button"
              onClick={() => chooseService(s.key)}
              className="rounded-sm border border-white/15 px-6 py-5 text-left transition-all duration-300 hover:border-bronze hover:bg-white/5"
            >
              <p className="font-serif text-lg">{s.label}</p>
              <p className="mt-1 text-sm text-white/50">
                {s.duration} — {formatPrice(prices[s.label])}
              </p>
            </button>
          ))}
        </div>
      )}

      {step === "slots" && service && (
        <div className="mt-8">
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => setStep("service")}
              className="text-xs tracking-wide text-white/50 transition-colors hover:text-bronze"
            >
              ← Cambiar servicio
            </button>
            <div className="flex items-center gap-4 text-xs tracking-wide">
              <button
                type="button"
                onClick={() => goToWeek((w) => Math.max(0, w - 1))}
                disabled={weekOffset === 0}
                className="text-white/50 transition-colors hover:text-bronze disabled:opacity-20 disabled:hover:text-white/50"
              >
                Semana anterior
              </button>
              <button
                type="button"
                onClick={() => goToWeek((w) => w + 1)}
                className="text-white/50 transition-colors hover:text-bronze"
              >
                Semana siguiente →
              </button>
            </div>
          </div>

          {loading && (
            <p className="mt-8 text-sm text-white/50">Buscando horarios disponibles…</p>
          )}

          {!loading && loadError && (
            <p className="mt-8 text-sm text-white/70">{loadError}</p>
          )}

          {!loading && !loadError && days && (
            <>
              {days.every((d) => d.slots.length === 0) ? (
                <p className="mt-8 text-sm text-white/60">
                  No hay turnos disponibles esta semana. Probá con la semana siguiente.
                </p>
              ) : (
                <div className="mt-8 space-y-5">
                  {days.map((day) => (
                    <div key={day.date}>
                      <p className="text-sm font-medium text-white/80">{day.label}</p>
                      {day.slots.length === 0 ? (
                        <p className="mt-2 text-xs text-white/40">Sin turnos</p>
                      ) : (
                        <div className="mt-2 flex flex-wrap gap-2">
                          {day.slots.map((slot) => (
                            <button
                              key={slot.iso}
                              type="button"
                              onClick={() => chooseSlot(slot, day.label)}
                              className="rounded-full border border-white/20 px-4 py-1.5 text-sm transition-all duration-300 hover:border-bronze hover:text-bronze"
                            >
                              {slot.label}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      )}

      {step === "details" && service && selectedSlot && (
        <div className="mt-8">
          <button
            type="button"
            onClick={() => setStep("slots")}
            className="text-xs tracking-wide text-white/50 transition-colors hover:text-bronze"
          >
            ← Elegir otro horario
          </button>

          <p className="mt-4 text-sm text-white/80">
            {selectedSlot.dayLabel} a las {selectedSlot.timeLabel} ·{" "}
            {SERVICES.find((s) => s.key === service)?.label}
          </p>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div>
              <label htmlFor="booking-name" className="mb-1.5 block text-xs tracking-wide text-white/60">
                Nombre
              </label>
              <input
                id="booking-name"
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full border border-white/15 bg-white/5 px-4 py-2.5 text-sm text-white outline-none transition-colors focus:border-bronze"
                placeholder="Tu nombre"
              />
            </div>

            <div>
              <label htmlFor="booking-phone" className="mb-1.5 block text-xs tracking-wide text-white/60">
                Teléfono
              </label>
              <input
                id="booking-phone"
                type="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full border border-white/15 bg-white/5 px-4 py-2.5 text-sm text-white outline-none transition-colors focus:border-bronze"
                placeholder="11 1234 5678"
              />
            </div>

            <div>
              <label htmlFor="booking-email" className="mb-1.5 block text-xs tracking-wide text-white/60">
                Mail (opcional)
              </label>
              <input
                id="booking-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full border border-white/15 bg-white/5 px-4 py-2.5 text-sm text-white outline-none transition-colors focus:border-bronze"
                placeholder="Para recibir la confirmación por mail"
              />
            </div>

            {submitError && <p className="text-sm text-white/70">{submitError}</p>}

            <button
              type="submit"
              disabled={submitting}
              className="mt-2 w-full bg-bronze px-8 py-3.5 text-xs font-medium tracking-[0.2em] text-ink transition-colors hover:bg-bronze-dark disabled:opacity-50 sm:w-fit"
            >
              {submitting ? "CONFIRMANDO…" : "CONFIRMAR TURNO"}
            </button>
          </form>
        </div>
      )}

      {step === "success" && confirmedSlot && (
        <div className="mt-8">
          <p className="font-serif text-xl text-bronze">¡Turno confirmado!</p>
          <p className="mt-3 text-sm leading-relaxed text-white/80">
            Te esperamos {confirmedSlot.dayLabel.toLowerCase()} a las{" "}
            {confirmedSlot.timeLabel} en {siteConfig.fullName}.
          </p>
          <button
            type="button"
            onClick={reset}
            className="mt-6 border border-white/20 px-6 py-3 text-xs tracking-[0.2em] text-white transition-colors hover:border-bronze hover:text-bronze"
          >
            RESERVAR OTRO TURNO
          </button>
        </div>
      )}
    </div>
  );
}
