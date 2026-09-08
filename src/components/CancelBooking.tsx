"use client";

import { useState } from "react";
import { isValidPhone } from "@/lib/validation";

type Booking = {
  eventId: string;
  dateLabel: string;
  timeLabel: string;
  serviceLabel: string;
};

type Phase = "collapsed" | "form" | "results";

export default function CancelBooking() {
  const [phase, setPhase] = useState<Phase>("collapsed");
  const [phone, setPhone] = useState("");
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);

  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const [cancelingId, setCancelingId] = useState<string | null>(null);
  const [cancelError, setCancelError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  async function handleSearch(event: React.FormEvent) {
    event.preventDefault();

    if (!isValidPhone(phone)) {
      setSearchError("Ingresá un teléfono válido (10 a 13 dígitos).");
      return;
    }

    setSearching(true);
    setSearchError(null);
    setNotice(null);

    try {
      const res = await fetch("/api/booking/cancel/lookup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "No pudimos buscar tus turnos.");

      setBookings(data.bookings as Booking[]);
      setPhase("results");
    } catch (err) {
      setSearchError(
        err instanceof Error ? err.message : "No pudimos buscar tus turnos."
      );
    } finally {
      setSearching(false);
    }
  }

  async function handleCancel(eventId: string) {
    setCancelingId(eventId);
    setCancelError(null);

    try {
      const res = await fetch("/api/booking/cancel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ eventId, phone }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "No pudimos cancelar el turno.");

      setBookings((prev) => prev.filter((b) => b.eventId !== eventId));
      setConfirmingId(null);
      setNotice("Turno cancelado. El horario ya quedó libre para otra persona.");
    } catch (err) {
      setCancelError(
        err instanceof Error ? err.message : "No pudimos cancelar el turno."
      );
    } finally {
      setCancelingId(null);
    }
  }

  function reset() {
    setPhase("collapsed");
    setPhone("");
    setSearchError(null);
    setBookings([]);
    setConfirmingId(null);
    setCancelError(null);
    setNotice(null);
  }

  if (phase === "collapsed") {
    return (
      <button
        type="button"
        onClick={() => setPhase("form")}
        className="flex w-full items-center justify-center gap-2 border border-white/20 px-6 py-4 text-sm font-medium tracking-wide text-white transition-all duration-300 hover:border-bronze hover:bg-white/5 sm:w-fit"
      >
        ¿Ya reservaste? Cancelar turno
      </button>
    );
  }

  return (
    <div className="rounded-sm border border-white/10 bg-white/5 p-6 sm:p-8">
      {phase === "form" && (
        <form onSubmit={handleSearch} className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="flex-1">
            <label htmlFor="cancel-phone" className="mb-1.5 block text-xs tracking-wide text-white/60">
              Ingresá el teléfono con el que reservaste
            </label>
            <input
              id="cancel-phone"
              type="tel"
              required
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full border border-white/15 bg-white/5 px-4 py-2.5 text-sm text-white outline-none transition-colors focus:border-bronze"
              placeholder="11 1234 5678"
            />
          </div>
          <div className="flex gap-3">
            <button
              type="submit"
              disabled={searching}
              className="border border-bronze/60 px-6 py-2.5 text-xs tracking-[0.2em] text-white transition-all duration-300 hover:border-bronze hover:bg-bronze disabled:opacity-50"
            >
              {searching ? "BUSCANDO…" : "BUSCAR"}
            </button>
            <button
              type="button"
              onClick={reset}
              className="text-xs text-white/50 transition-colors hover:text-bronze"
            >
              Cancelar
            </button>
          </div>
          {searchError && <p className="text-sm text-white/70 sm:basis-full">{searchError}</p>}
        </form>
      )}

      {phase === "results" && (
        <div>
          <div className="flex items-center justify-between">
            <p className="text-sm text-white/70">Turnos encontrados</p>
            <button
              type="button"
              onClick={reset}
              className="text-xs text-white/50 transition-colors hover:text-bronze"
            >
              Cerrar
            </button>
          </div>

          {notice && <p className="mt-3 text-sm text-bronze">{notice}</p>}

          {bookings.length === 0 ? (
            <p className="mt-4 text-sm text-white/60">No encontramos turnos con ese número.</p>
          ) : (
            <ul className="mt-4 space-y-3">
              {bookings.map((booking) => (
                <li
                  key={booking.eventId}
                  className="flex flex-col gap-2 border-t border-white/10 pt-3 first:border-t-0 first:pt-0 sm:flex-row sm:items-center sm:justify-between"
                >
                  <p className="text-sm text-white/80">
                    {booking.dateLabel} a las {booking.timeLabel} · {booking.serviceLabel}
                  </p>

                  {confirmingId === booking.eventId ? (
                    <div className="flex flex-wrap items-center gap-3 rounded-sm border border-red-500/40 bg-red-500/10 p-3">
                      <span className="text-xs text-red-100/80">
                        ¿Seguro que querés cancelar el turno del {booking.dateLabel} a las{" "}
                        {booking.timeLabel}?
                      </span>
                      <button
                        type="button"
                        onClick={() => handleCancel(booking.eventId)}
                        disabled={cancelingId === booking.eventId}
                        className="text-xs font-medium tracking-wide text-red-300 underline underline-offset-4 transition-colors hover:text-red-200 disabled:opacity-50"
                      >
                        {cancelingId === booking.eventId ? "Cancelando…" : "Sí, cancelar"}
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirmingId(null)}
                        className="text-xs text-white/50 hover:text-white/80"
                      >
                        No
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setConfirmingId(booking.eventId)}
                      className="w-fit rounded-full border border-white/20 px-4 py-1.5 text-xs tracking-wide text-white transition-colors hover:border-bronze hover:text-bronze"
                    >
                      Cancelar
                    </button>
                  )}
                </li>
              ))}
            </ul>
          )}

          {cancelError && <p className="mt-3 text-sm text-white/70">{cancelError}</p>}
        </div>
      )}
    </div>
  );
}
