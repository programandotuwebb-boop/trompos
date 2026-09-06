"use client";

import { useState, type FormEvent } from "react";
import { siteConfig } from "@/lib/site-content";

const SERVICES = ["Corte de pelo", "Arreglo de barba", "Corte + Barba"];

export default function BookingForm() {
  const [sent, setSent] = useState(false);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const form = event.currentTarget;
    const data = new FormData(form);
    const nombre = String(data.get("nombre") ?? "").trim();
    const telefono = String(data.get("telefono") ?? "").trim();
    const servicio = String(data.get("servicio") ?? "").trim();
    const mensaje = String(data.get("mensaje") ?? "").trim();

    const lines = [
      "Hola! Quiero reservar un turno en Barbas.",
      `Nombre: ${nombre}`,
      `Teléfono: ${telefono}`,
      `Servicio: ${servicio}`,
    ];
    if (mensaje) lines.push(`Mensaje: ${mensaje}`);

    const url = `https://wa.me/${siteConfig.whatsapp.phoneHref}?text=${encodeURIComponent(
      lines.join("\n")
    )}`;

    window.open(url, "_blank", "noopener,noreferrer");
    setSent(true);
    form.reset();
  }

  return (
    <div className="rounded-2xl bg-cream p-8 shadow-sm sm:p-10">
      <h3 className="font-serif text-2xl text-charcoal">
        {siteConfig.turno.formTitle}
      </h3>
      <p className="mt-2 text-sm text-body">{siteConfig.turno.formDescription}</p>

      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        <div>
          <label htmlFor="nombre" className="mb-1.5 block text-xs tracking-wide text-body">
            Nombre
          </label>
          <input
            id="nombre"
            name="nombre"
            type="text"
            required
            className="w-full rounded-lg border border-charcoal/15 bg-white px-4 py-2.5 text-sm text-charcoal outline-none transition-colors focus:border-taupe"
            placeholder="Tu nombre"
          />
        </div>

        <div>
          <label htmlFor="telefono" className="mb-1.5 block text-xs tracking-wide text-body">
            Teléfono
          </label>
          <input
            id="telefono"
            name="telefono"
            type="tel"
            required
            className="w-full rounded-lg border border-charcoal/15 bg-white px-4 py-2.5 text-sm text-charcoal outline-none transition-colors focus:border-taupe"
            placeholder="11 1234 5678"
          />
        </div>

        <div>
          <label htmlFor="servicio" className="mb-1.5 block text-xs tracking-wide text-body">
            Servicio
          </label>
          <select
            id="servicio"
            name="servicio"
            required
            defaultValue=""
            className="w-full rounded-lg border border-charcoal/15 bg-white px-4 py-2.5 text-sm text-charcoal outline-none transition-colors focus:border-taupe"
          >
            <option value="" disabled>
              Elegí un servicio
            </option>
            {SERVICES.map((service) => (
              <option key={service} value={service}>
                {service}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="mensaje" className="mb-1.5 block text-xs tracking-wide text-body">
            Mensaje (opcional)
          </label>
          <textarea
            id="mensaje"
            name="mensaje"
            rows={3}
            className="w-full resize-none rounded-lg border border-charcoal/15 bg-white px-4 py-2.5 text-sm text-charcoal outline-none transition-colors focus:border-taupe"
            placeholder="Día u horario de preferencia, por ejemplo"
          />
        </div>

        <button
          type="submit"
          className="mt-2 w-full bg-taupe px-8 py-3.5 text-xs font-medium tracking-[0.2em] text-white transition-colors hover:bg-taupe-dark sm:w-fit"
        >
          ENVIAR POR WHATSAPP
        </button>

        {sent && (
          <p className="text-sm text-body">
            Se abrió WhatsApp con tus datos cargados — solo tenés que enviar el mensaje.
          </p>
        )}
      </form>
    </div>
  );
}
