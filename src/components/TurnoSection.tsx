import FadeIn from "@/components/FadeIn";
import TeamCard from "@/components/TeamCard";
import BookingForm from "@/components/BookingForm";
import { siteConfig } from "@/lib/site-content";

const directionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(
  siteConfig.address
)}`;

export default function TurnoSection() {
  return (
    <section id="turno" className="bg-beige py-20 sm:py-28">
      <div className="mx-auto max-w-6xl px-6 sm:px-10">
        <FadeIn>
          <h2 className="font-serif text-4xl text-charcoal sm:text-5xl">
            {siteConfig.turno.title}
          </h2>
        </FadeIn>

        <div className="mt-12 grid gap-10 lg:grid-cols-2">
          <FadeIn delayMs={100} className="flex flex-col gap-8">
            <div className="rounded-2xl bg-beige-dark p-6 sm:p-10">
              <div className="grid grid-cols-2 gap-4 sm:gap-6">
                {siteConfig.team.map((person) => (
                  <TeamCard key={person.name} {...person} />
                ))}
              </div>
            </div>

            <BookingForm />
          </FadeIn>

          <FadeIn delayMs={200} className="flex h-full min-h-[420px] flex-col lg:min-h-0">
            <div className="min-h-[320px] flex-1 overflow-hidden rounded-2xl shadow-sm">
              <iframe
                src={siteConfig.mapEmbedUrl}
                title="Ubicación de Barbas en Google Maps"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                className="h-full w-full border-0"
              />
            </div>
            <p className="mt-4 text-sm text-body">
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
