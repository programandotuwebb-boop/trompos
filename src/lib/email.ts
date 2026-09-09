import { Resend } from "resend";
import { siteConfig } from "@/lib/site-content";

const DEFAULT_FROM = `${siteConfig.fullName} <onboarding@resend.dev>`;

type BookingEmailInput = {
  to: string;
  name: string;
  serviceLabel: string;
  dateLabel: string;
  timeLabel: string;
};

// El envío de mails nunca debe romper ni bloquear una reserva/cancelación:
// cualquier falla (API key faltante, Resend caído, etc.) se registra acá
// adentro y listo, sin propagarse a quien llama.
async function sendEmail(input: { to: string; subject: string; text: string }): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.error("[email] Falta configurar RESEND_API_KEY; no se envió el mail.");
    return;
  }

  try {
    const resend = new Resend(apiKey);
    const from = process.env.RESEND_FROM_EMAIL || DEFAULT_FROM;
    const { error } = await resend.emails.send({
      from,
      to: input.to,
      subject: input.subject,
      text: input.text,
    });
    if (error) {
      console.error("[email] Resend devolvió un error:", error);
    }
  } catch (error) {
    console.error("[email] No se pudo enviar el mail:", error);
  }
}

export async function sendBookingConfirmationEmail(input: BookingEmailInput): Promise<void> {
  const { to, name, serviceLabel, dateLabel, timeLabel } = input;
  await sendEmail({
    to,
    subject: `Confirmación de tu turno en ${siteConfig.fullName}`,
    text: `Hola ${name},

Tu turno quedó confirmado:

Servicio: ${serviceLabel}
Día: ${dateLabel}
Hora: ${timeLabel}

Dirección: ${siteConfig.address}

Si necesitás cancelarlo, podés hacerlo desde la web ingresando el teléfono con el que reservaste.

Te esperamos,
${siteConfig.fullName}`,
  });
}

export async function sendCancellationEmail(input: BookingEmailInput): Promise<void> {
  const { to, name, serviceLabel, dateLabel, timeLabel } = input;
  await sendEmail({
    to,
    subject: `Tu turno en ${siteConfig.fullName} fue cancelado`,
    text: `Hola ${name},

Confirmamos que tu turno del ${dateLabel} a las ${timeLabel} (${serviceLabel}) fue cancelado.

Si fue un error o querés reservar otro horario, podés hacerlo desde la web cuando quieras.

${siteConfig.fullName}`,
  });
}
