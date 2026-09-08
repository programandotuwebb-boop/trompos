import FadeIn from "@/components/FadeIn";
import TeamCard from "@/components/TeamCard";
import CalendarBooking from "@/components/CalendarBooking";
import CancelBooking from "@/components/CancelBooking";
import BookingErrorBoundary from "@/components/BookingErrorBoundary";
import SocialLinks from "@/components/SocialLinks";
import { siteConfig } from "@/lib/site-content";
import { getServicePrices } from "@/lib/pricing";

const directionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(
  siteConfig.address
)}`;

export default async function TurnoSection() {
  const prices = await getServicePrices();

  return (
    <section id="turno" className="bg-beige py-20 sm:py-28">
      <div className="mx-auto max-w-6xl px-6 sm:px-10">
        <FadeIn>
          <h2 className="font-serif text-4xl text-charcoal sm:text-5xl">
            {siteConfig.turno.title}
          </h2>
        </FadeIn>

        <FadeIn delayMs={100} className="mt-10">
          <div className="rounded-sm bg-ink p-6 sm:p-10">
            <BookingErrorBoundary>
              <CalendarBooking prices={prices} />
            </BookingErrorBoundary>

            <div className="mt-8 border-t border-white/10 pt-6">
              <BookingErrorBoundary fallbackMessage="No pudimos cargar la cancelación de turnos. Contactanos directamente para coordinarlo.">
                <CancelBooking />
              </BookingErrorBoundary>
            </div>
          </div>
        </FadeIn>

        <div className="mt-12 grid gap-6 sm:grid-cols-2">
          <FadeIn delayMs={150}>
            <div className="flex h-full flex-col items-center justify-center gap-4 rounded-2xl bg-beige-dark p-6">
              {siteConfig.team.map((person) => (
                <TeamCard key={person.name} {...person} />
              ))}
              <SocialLinks className="text-body" />
            </div>
          </FadeIn>

          <FadeIn delayMs={200} className="flex min-h-[280px] flex-col overflow-hidden rounded-2xl shadow-sm">
            <iframe
              src={siteConfig.mapEmbedUrl}
              title="Ubicación de Janeiro Barber Studio en Google Maps"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              className="h-full w-full flex-1 border-0"
            />
            <p className="bg-beige-dark px-4 py-2 text-xs text-body">
              {siteConfig.address}{" "}
              <a
                href={directionsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-charcoal underline underline-offset-4 transition-colors hover:text-taupe-dark"
              >
                Cómo llegar
              </a>
            </p>
          </FadeIn>
        </div>
      </div>
    </section>
  );
}
