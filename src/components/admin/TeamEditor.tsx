"use client";
import { useState } from "react";
import Image from "next/image";
import { siteConfig } from "@/lib/site-content";
import WeeklyHours from "./WeeklyHours";
import type { Data, Professional, Run } from "./types";
import styles from "../AdminPanel.module.css";
export default function TeamEditor({
  person,
  data,
  run,
  busy,
  onSaved,
}: {
  person: Professional | null;
  data: Data;
  run: Run;
  busy: boolean;
  onSaved: () => void;
}) {
  const [tab, setTab] = useState("profile"),
    [name, setName] = useState(person?.name ?? ""),
    [photo, setPhoto] = useState(
      person?.photo ?? "/images/avatar-placeholder.svg",
    ),
    [description, setDescription] = useState(person?.description ?? ""),
    [active, setActive] = useState(person?.active ?? false),
    [services, setServices] = useState(person?.service_ids ?? []),
    [email, setEmail] = useState(""),
    [password, setPassword] = useState("");
  const account = data.users.find((u) => u.professional_id === person?.id);
  return (
    <>
      {person && (
        <nav className={styles.subnav} aria-label="Editar profesional">
          {[
            ["profile", "Perfil"],
            ["hours", "Horario habitual"],
            ["account", "Cuenta de acceso"],
          ].map(([id, label]) => (
            <button
              key={id}
              aria-pressed={tab === id}
              onClick={() => setTab(id)}
            >
              {label}
            </button>
          ))}
        </nav>
      )}
      {tab === "profile" && (
        <form
          className={styles.form}
          onSubmit={async (e) => {
            e.preventDefault();
            const slug =
              person?.slug ??
              name
                .normalize("NFD")
                .replace(/[\u0300-\u036f]/g, "")
                .toLowerCase()
                .replace(/[^a-z0-9]+/g, "-")
                .replace(/^-|-$/g, "") +
                "-" +
                crypto.randomUUID().slice(0, 6);
            if (
              await run({
                action: "professional",
                id: person?.id,
                name,
                slug,
                photo,
                description,
                active,
                serviceIds: services,
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
              maxLength={80}
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </label>
          <fieldset className={styles.choices}>
            <legend>Foto</legend>
            <div className={styles.row}>
              {[
                ...new Set([
                  "/images/avatar-placeholder.svg",
                  ...data.professionals.map((p) => p.photo),
                  ...siteConfig.team.map((p) => p.photo),
                ]),
              ].map((src, i) => (
                <label key={src}>
                  <input
                    type="radio"
                    name="profile-photo"
                    aria-label={i === 0 ? "Sin foto" : `Foto disponible ${i}`}
                    checked={photo === src}
                    onChange={() => setPhoto(src)}
                  />
                  <Image
                    src={src}
                    width={48}
                    height={48}
                    alt={i === 0 ? "Sin foto" : `Foto disponible ${i}`}
                  />
                </label>
              ))}
            </div>
            <details>
              <summary>Usar otra imagen del sitio</summary>
              <label>
                Ubicación de la imagen
                <input
                  required
                  value={photo}
                  onChange={(e) => setPhoto(e.target.value)}
                />
                <small>Debe ser una imagen ya incorporada al sitio.</small>
              </label>
            </details>
          </fieldset>
          <label>
            Especialidad
            <input
              maxLength={500}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </label>
          <label className={styles.switch}>
            <input
              type="checkbox"
              role="switch"
              checked={active}
              onChange={(e) => setActive(e.target.checked)}
            />
            <span>Disponible para recibir reservas</span>
          </label>
          <fieldset className={styles.choices}>
            <legend>Servicios que realiza</legend>
            {data.services.map((s) => (
              <label key={s.id}>
                <input
                  type="checkbox"
                  checked={services.includes(s.id)}
                  onChange={(e) =>
                    setServices(
                      e.target.checked
                        ? [...services, s.id]
                        : services.filter((id) => id !== s.id),
                    )
                  }
                />
                <span>{s.name}</span>
              </label>
            ))}
          </fieldset>
          <button className={styles.primary} disabled={busy}>
            Guardar profesional
          </button>
          {person && (
            <button
              type="button"
              className={styles.textButton}
              disabled={busy}
              onClick={async () => {
                if (
                  window.confirm(
                    `¿Eliminar a ${person.name}? Si tiene historial, conservá su ficha y desactivalo.`,
                  ) &&
                  (await run({ action: "deleteProfessional", id: person.id }))
                )
                  onSaved();
              }}
            >
              Eliminar profesional
            </button>
          )}
          {!person && (
            <p className={styles.muted}>
              Después de guardar, abrí su ficha para definir el horario y crear
              su cuenta.
            </p>
          )}
        </form>
      )}
      {tab === "hours" && person && (
        <WeeklyHours
          key={person.id}
          professionalId={person.id}
          initial={data.hours.filter((h) => h.professional_id === person.id)}
          run={run}
          busy={busy}
        />
      )}
      {tab === "account" &&
        person &&
        (account ? (
          <section className={styles.section}>
            <h3>{account.email}</h3>
            <p className={styles.muted}>
              {account.active ? "Cuenta activa" : "Cuenta desactivada"}. Solo
              puede administrar su propia agenda.
            </p>
            <button
              disabled={busy}
              onClick={() =>
                void run({
                  action: "userAccess",
                  id: account.id,
                  active: !account.active,
                  canBlock: true,
                })
              }
            >
              {account.active ? "Desactivar acceso" : "Activar acceso"}
            </button>
          </section>
        ) : (
          <form
            className={styles.form}
            onSubmit={async (e) => {
              e.preventDefault();
              if (
                await run({
                  action: "user",
                  email,
                  password,
                  role: "PROFESSIONAL",
                  professionalId: person.id,
                  canBlock: true,
                })
              )
                setPassword("");
            }}
          >
            <p className={styles.muted}>
              La cuenta quedará asociada a {person.name} y a su agenda.
            </p>
            <label>
              Email
              <input
                required
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </label>
            <label>
              Contraseña inicial
              <input
                required
                type="password"
                autoComplete="new-password"
                minLength={12}
                maxLength={256}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <small>Al menos 12 caracteres.</small>
            </label>
            <button className={styles.primary} disabled={busy}>
              Crear cuenta de acceso
            </button>
          </form>
        ))}
    </>
  );
}
