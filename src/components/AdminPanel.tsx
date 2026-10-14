"use client";
import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import type { Actor } from "@/lib/booking/auth";
import { DAY, localDate, midnight, dayLabel } from "@/lib/booking/time";
import { formatPrice } from "@/lib/format";
import Agenda from "./admin/Agenda";
import Drawer from "./admin/Drawer";
import WeeklyHours from "./admin/WeeklyHours";
import QuickBooking from "./admin/QuickBooking";
import AvailabilityEditor from "./admin/AvailabilityEditor";
import BookingDetails from "./admin/BookingDetails";
import TeamEditor from "./admin/TeamEditor";
import ServiceEditor from "./admin/ServiceEditor";
import type {
  Data,
  Context,
  Professional,
  Service,
  Booking,
} from "./admin/types";
import styles from "./AdminPanel.module.css";
type Modal =
  | { type: "context" | "new" | "availability"; context: Context }
  | { type: "booking"; booking: Booking }
  | { type: "person"; person: Professional | null }
  | { type: "service"; service: Service | null };
export default function AdminPanel({
  initialActor,
}: {
  initialActor: Actor | null;
}) {
  const router = useRouter();
  const [actor, setActor] = useState(initialActor),
    [data, setData] = useState<Data | null>(null),
    [tab, setTab] = useState("agenda"),
    [date, setDate] = useState(localDate()),
    [view, setView] = useState<"day" | "week">("day"),
    [professional, setProfessional] = useState(""),
    [modal, setModal] = useState<Modal | null>(null),
    [error, setError] = useState(""),
    [notice, setNotice] = useState(""),
    [busy, setBusy] = useState(false),
    [loading, setLoading] = useState(true),
    [now, setNow] = useState(() => Date.now());
  const sequence = useRef(0);
  const [bookingLocked, setBookingLocked] = useState(false);
  const [agendaFailed, setAgendaFailed] = useState(false);
  const [ownerEmail, setOwnerEmail] = useState(""),
    [ownerPassword, setOwnerPassword] = useState("");
  const load = useCallback(async () => {
    if (!actor) return;
    const seq = ++sequence.current;
    try {
      const query = new URLSearchParams({
        view: view === "day" ? "today" : "week",
        date,
        ...(professional ? { professional } : {}),
      });
      let page = 0,
        next: Data | null = null;
      do {
        query.set("page", String(page++));
        const r = await fetch(`/api/admin/data?${query}`, {
          cache: "no-store",
        });
        if (seq !== sequence.current) return;
        if (r.status === 401) {
          setActor(null);
          setData(null);
          setModal(null);
          return;
        }
        const result = await r.json();
        if (!r.ok) throw new Error(result.error);
        if (!next) next = result;
        else next.bookings.push(...result.bookings);
        if (!result.pagination.hasMore) break;
      } while (true);
      if (seq === sequence.current) {
        setData(next);
        setAgendaFailed(false);
        setLoading(false);
        setNow(Date.now());
      }
    } catch (e) {
      if (seq === sequence.current) {
        setAgendaFailed(true);
        setError(
          e instanceof Error ? e.message : "No pudimos cargar la agenda.",
        );
        setLoading(false);
      }
    }
  }, [actor, view, date, professional]);
  const invalidateRequests = useCallback(() => {
    sequence.current++;
  }, []);
  useEffect(() => {
    const initial = setTimeout(() => void load(), 0);
    const timer = setInterval(() => {
      if (document.visibilityState === "visible") void load();
    }, 15000);
    return () => {
      clearTimeout(initial);
      clearInterval(timer);
      invalidateRequests();
    };
  }, [load, invalidateRequests]);
  const navigate = (newDate: string, newView = view) => {
    if (newDate === date && newView === view) {
      void load();
      return;
    }
    setDate(newDate);
    setView(newView);
    setLoading(true);
    setError("");
  };
  async function run(command: Record<string, unknown>) {
    if (busy) return false;
    setBusy(true);
    setError("");
    setNotice("");
    try {
      const r = await fetch("/api/admin/action", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(command),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error);
      await load();
      setNotice("Cambios guardados.");
      return true;
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "No pudimos guardar el cambio.",
      );
      return false;
    } finally {
      setBusy(false);
    }
  }
  function open(next: Modal) {
    setError("");
    setNotice("");
    setModal(next);
  }
  function close() {
    if (!busy && !bookingLocked) {
      setModal(null);
      setError("");
    }
  }
  if (!actor)
    return (
      <div className={styles.panel}>
        <form
          className={styles.login}
          onSubmit={async (e) => {
            e.preventDefault();
            setBusy(true);
            setError("");
            const form = new FormData(e.currentTarget);
            try {
              const r = await fetch("/api/admin/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  email: form.get("email"),
                  password: form.get("password"),
                }),
              });
              const d = await r.json();
              if (!r.ok) throw new Error(d.error);
              const response = await fetch("/api/admin/data");
              const initial = await response.json();
              if (!response.ok) throw new Error(initial.error);
              setActor(initial.actor);
              setData(initial);
              setTab("agenda");
              setLoading(false);
              router.refresh();
            } catch (e) {
              setError(
                e instanceof Error ? e.message : "No pudimos iniciar sesión.",
              );
            } finally {
              setBusy(false);
            }
          }}
        >
          <h2>Entrá a tu agenda</h2>
          <label>
            Email
            <input name="email" type="email" autoComplete="username" required />
          </label>
          <label>
            Contraseña
            <input
              name="password"
              type="password"
              autoComplete="current-password"
              required
            />
          </label>
          {error && (
            <p role="alert" className={styles.error}>
              {error}
            </p>
          )}
          <button className={styles.primary} disabled={busy}>
            {busy ? "Ingresando…" : "Ingresar"}
          </button>
        </form>
      </div>
    );
  const owner = actor.role === "OWNER";
  const context: Context = {
    professionalId: actor.professional_id ?? professional,
    date,
    time: "",
  };
  const title =
    modal?.type === "context"
      ? `${modal.context.time} · ${dayLabel(midnight(modal.context.date))}`
      : modal?.type === "new"
        ? "Nuevo turno"
        : modal?.type === "availability"
          ? "Cambiar disponibilidad"
          : modal?.type === "booking"
            ? "Detalle del turno"
            : modal?.type === "person"
              ? modal.person
                ? modal.person.name
                : "Agregar profesional"
              : "Servicio";
  const selectedBooking =
    modal?.type === "booking"
      ? (data?.bookings.find((b) => b.id === modal.booking.id) ?? modal.booking)
      : null;
  return (
    <div className={styles.panel}>
      <header className={styles.topbar}>
        <span className={styles.muted}>
          {owner ? "Dueño" : (data?.professionals[0]?.name ?? "Profesional")} ·{" "}
          {actor.email}
        </span>
        <button
          className={styles.textButton}
          onClick={async () => {
            const r = await fetch("/api/admin/logout", { method: "POST" });
            if (r.ok) {
              setActor(null);
              setData(null);
              setModal(null);
              setTab("agenda");
              setProfessional("");
              setView("day");
              setDate(localDate());
              router.refresh();
            } else setError("No pudimos cerrar sesión.");
          }}
        >
          Cerrar sesión
        </button>
      </header>
      <div className={styles.navigation}>
        <nav aria-label="Panel privado">
          {(owner
            ? [
                ["agenda", "Agenda"],
                ["team", "Equipo"],
                ["services", "Servicios"],
                ["settings", "Configuración"],
              ]
            : [
                ["agenda", "Mi agenda"],
                ["hours", "Mi horario"],
              ]
          ).map(([id, label]) => (
            <button
              key={id}
              aria-current={tab === id ? "page" : undefined}
              onClick={() => {
                setTab(id);
                setError("");
                setNotice("");
              }}
            >
              {label}
            </button>
          ))}
        </nav>
        {owner && (
          <button
            className={styles.primary}
            disabled={!data || loading || agendaFailed}
            onClick={() => open({ type: "new", context })}
          >
            + Nuevo turno
          </button>
        )}
      </div>
      {!modal && error && (
        <p role="alert" className={styles.error}>
          {error}
          <button
            onClick={() => {
              setError("");
              void load();
            }}
          >
            Reintentar
          </button>
        </p>
      )}
      {!modal && notice && (
        <p role="status" className={styles.notice}>
          {notice}
        </p>
      )}
      {data && tab === "agenda" && (
        <>
          <div className={styles.agendaToolbar}>
            <div className={styles.dateNav}>
              <button
                aria-label={view === "day" ? "Día anterior" : "Semana anterior"}
                onClick={() =>
                  navigate(
                    localDate(midnight(date) - (view === "day" ? 1 : 7) * DAY),
                  )
                }
              >
                ←
              </button>
              <label className={styles.dateTitle}>
                <span>
                  {new Intl.DateTimeFormat("es-AR", {
                    weekday: "long",
                    day: "numeric",
                    month: "long",
                    timeZone: "America/Argentina/Buenos_Aires",
                  }).format(midnight(date))}
                </span>
                <input
                  aria-label="Fecha de la agenda"
                  type="date"
                  value={date}
                  onChange={(e) => {
                    if (e.target.value) navigate(e.target.value);
                  }}
                />
              </label>
              <button
                aria-label={
                  view === "day" ? "Día siguiente" : "Semana siguiente"
                }
                onClick={() =>
                  navigate(
                    localDate(midnight(date) + (view === "day" ? 1 : 7) * DAY),
                  )
                }
              >
                →
              </button>
              <button onClick={() => navigate(localDate(), "day")}>Hoy</button>
            </div>
            <div className={styles.row}>
              <div
                className={styles.segment}
                role="group"
                aria-label="Vista de agenda"
              >
                <button
                  aria-pressed={view === "day"}
                  onClick={() => navigate(date, "day")}
                >
                  Día
                </button>
                <button
                  aria-pressed={view === "week"}
                  onClick={() => navigate(date, "week")}
                >
                  Semana
                </button>
              </div>
              {owner && (
                <select
                  aria-label="Filtrar profesional"
                  value={professional}
                  onChange={(e) => {
                    setProfessional(e.target.value);
                    setLoading(true);
                  }}
                >
                  <option value="">Todos</option>
                  {data.professionals.map((p) => (
                    <option value={p.id} key={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              )}
              {!owner && (
                <button
                  className={styles.primary}
                  disabled={loading || agendaFailed}
                  onClick={() => open({ type: "new", context })}
                >
                  + Nuevo turno
                </button>
              )}
              <button
                className={styles.textButton}
                disabled={loading || agendaFailed}
                onClick={() => open({ type: "availability", context })}
              >
                Cambiar disponibilidad
              </button>
            </div>
          </div>
          {agendaFailed ? (
            <p className={styles.empty}>
              No pudimos verificar la agenda. Reintentá antes de elegir un
              horario.
            </p>
          ) : loading ? (
            <p role="status" className={styles.empty}>
              Cargando agenda…
            </p>
          ) : (
            <Agenda
              data={data}
              date={date}
              view={view}
              professional={professional}
              now={now}
              onDate={(d) => navigate(d, "day")}
              onFree={(c) => open({ type: "context", context: c })}
              onBooking={(b) => open({ type: "booking", booking: b })}
            />
          )}
        </>
      )}
      {!data && !error && (
        <p role="status" className={styles.empty}>
          Cargando…
        </p>
      )}
      {data && tab === "hours" && !owner && actor.professional_id && (
        <section className={styles.section}>
          <h2>Mi horario</h2>
          <WeeklyHours
            key={actor.professional_id}
            professionalId={actor.professional_id}
            initial={data.hours}
            run={run}
            busy={busy}
          />
        </section>
      )}
      {data && tab === "team" && owner && (
        <section className={styles.section}>
          <div className={styles.sectionHead}>
            <div>
              <h2>Equipo</h2>
              <p className={styles.muted}>
                Perfiles, horarios y cuentas en un solo lugar.
              </p>
            </div>
            <button onClick={() => open({ type: "person", person: null })}>
              + Agregar profesional
            </button>
          </div>
          <div className={styles.cards}>
            {data.professionals.map((p) => (
              <button
                className={styles.personCard}
                key={p.id}
                onClick={() => open({ type: "person", person: p })}
              >
                <Image src={p.photo} width={64} height={64} alt="" />
                <div>
                  <h3>{p.name}</h3>
                  <span className={styles.muted}>
                    {p.description || "Profesional"}
                  </span>
                  <small>
                    {p.active ? "Activo" : "Inactivo"} ·{" "}
                    {data.users.some((u) => u.professional_id === p.id)
                      ? "Cuenta asociada"
                      : "Sin cuenta"}
                  </small>
                </div>
                <span aria-hidden>↗</span>
              </button>
            ))}
          </div>
        </section>
      )}
      {data && tab === "services" && owner && (
        <section className={styles.section}>
          <div className={styles.sectionHead}>
            <h2>Servicios</h2>
            <button onClick={() => open({ type: "service", service: null })}>
              + Agregar servicio
            </button>
          </div>
          <div className={styles.cards}>
            {data.services.map((s) => (
              <button
                className={styles.serviceCard}
                key={s.id}
                onClick={() => open({ type: "service", service: s })}
              >
                <h3>{s.name}</h3>
                <p>
                  {s.duration_minutes} min · {formatPrice(s.price)}
                </p>
                <small>
                  {s.active ? "Activo" : "Inactivo"} ·{" "}
                  {data.professionals
                    .filter((p) => p.service_ids.includes(s.id))
                    .map((p) => p.name)
                    .join(", ") || "Sin profesionales asignados"}
                </small>
              </button>
            ))}
          </div>
        </section>
      )}
      {data && tab === "settings" && owner && (
        <section className={styles.section}>
          <h2>Configuración</h2>
          <p className={styles.muted}>
            Los horarios se muestran en hora de Buenos Aires. Las reservas se
            habilitan hasta 8 semanas hacia adelante.
          </p>
          <h3 className={styles.section}>Acceso del dueño</h3>
          {data.users
            .filter((u) => u.role === "OWNER")
            .map((u) => (
              <div className={styles.change} key={u.id}>
                <span>
                  {u.email}
                  <small>{u.active ? "Activo" : "Inactivo"}</small>
                </span>
                {u.id !== actor.id && (
                  <button
                    disabled={busy}
                    onClick={() =>
                      void run({
                        action: "userAccess",
                        id: u.id,
                        active: !u.active,
                      })
                    }
                  >
                    {u.active ? "Desactivar" : "Activar"}
                  </button>
                )}
              </div>
            ))}
          <details className={styles.section}>
            <summary>Agregar otro acceso de dueño</summary>
            <form
              className={styles.form}
              onSubmit={async (e) => {
                e.preventDefault();
                if (
                  await run({
                    action: "user",
                    email: ownerEmail,
                    password: ownerPassword,
                    role: "OWNER",
                    professionalId: null,
                  })
                ) {
                  setOwnerEmail("");
                  setOwnerPassword("");
                }
              }}
            >
              <label>
                Email
                <input
                  required
                  type="email"
                  value={ownerEmail}
                  onChange={(e) => setOwnerEmail(e.target.value)}
                />
              </label>
              <label>
                Contraseña inicial
                <input
                  required
                  type="password"
                  autoComplete="new-password"
                  minLength={12}
                  value={ownerPassword}
                  onChange={(e) => setOwnerPassword(e.target.value)}
                />
              </label>
              <button disabled={busy}>Crear acceso de dueño</button>
            </form>
          </details>
        </section>
      )}
      {modal && data && (
        <Drawer title={title} onClose={close} locked={busy || bookingLocked}>
          {error && (
            <p role="alert" className={styles.error}>
              {error}
            </p>
          )}
          {notice && (
            <p role="status" className={styles.notice}>
              {notice}
            </p>
          )}
          {modal.type === "context" && (
            <div className={styles.form}>
              <p className={styles.muted}>
                {
                  data.professionals.find(
                    (p) => p.id === modal.context.professionalId,
                  )?.name
                }{" "}
                · Espacio libre
              </p>
              <button
                className={styles.primary}
                onClick={() => open({ type: "new", context: modal.context })}
              >
                Crear turno
              </button>
              <button
                onClick={() =>
                  open({ type: "availability", context: modal.context })
                }
              >
                Bloquear horario
              </button>
            </div>
          )}
          {modal.type === "new" && (
            <QuickBooking
              data={data}
              actor={actor}
              context={modal.context}
              onLock={setBookingLocked}
              onSaved={() => {
                setModal(null);
                setNotice("Turno confirmado.");
                void load();
              }}
            />
          )}
          {modal.type === "availability" && (
            <AvailabilityEditor
              data={data}
              context={modal.context}
              run={run}
              busy={busy}
              owner={owner}
            />
          )}
          {modal.type === "booking" && selectedBooking && (
            <BookingDetails
              key={selectedBooking.id}
              booking={selectedBooking}
              run={run}
              busy={busy}
              now={now}
            />
          )}
          {modal.type === "person" && (
            <TeamEditor
              person={modal.person}
              data={data}
              run={run}
              busy={busy}
              onSaved={() => setModal(null)}
            />
          )}
          {modal.type === "service" && (
            <ServiceEditor
              service={modal.service}
              data={data}
              run={run}
              busy={busy}
              onSaved={() => setModal(null)}
            />
          )}
        </Drawer>
      )}
    </div>
  );
}
