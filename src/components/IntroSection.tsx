import Image from "next/image";
import FadeIn from "@/components/FadeIn";
import DecorativeRing from "@/components/DecorativeRing";
import { siteConfig } from "@/lib/site-content";

const photos = [
  { src: "/images/intro-1.svg", alt: "Corte de pelo en Barbas", rotate: -20, offset: false },
  { src: "/images/intro-2.svg", alt: "Arreglo de barba en Barbas", rotate: 35, offset: true },
  { src: "/images/intro-3.svg", alt: "Sillón de la barbería Barbas", rotate: 150, offset: true },
  { src: "/images/intro-4.svg", alt: "Detalle del salón Barbas", rotate: 210, offset: false },
];

export default function IntroSection() {
  return (
    <section id="introduciendo" className="bg-cream py-20 sm:py-28">
      <div className="mx-auto grid max-w-6xl grid-cols-1 items-center gap-16 px-6 sm:px-10 md:grid-cols-2 md:gap-12">
        <FadeIn>
          <p className="text-xs tracking-[0.3em] text-taupe-dark">
            {siteConfig.intro.eyebrow.toUpperCase()}
          </p>

          <h2 className="mt-4 font-serif text-4xl text-charcoal sm:text-5xl">
            {siteConfig.intro.title.toUpperCase()}
          </h2>

          <p className="mt-2 text-sm tracking-[0.2em] text-body">
            {siteConfig.intro.subtitle.toUpperCase()}
          </p>
          <p className="mt-1 font-serif text-xl italic text-taupe">
            {siteConfig.intro.since}
          </p>

          <p className="mt-6 max-w-md leading-relaxed text-body">
            {siteConfig.intro.description}
          </p>

          <Image
            src="/images/mustache-icon.svg"
            alt=""
            width={140}
            height={90}
            unoptimized
            className="mt-8 w-28 sm:w-32"
          />
        </FadeIn>

        <FadeIn delayMs={150}>
          <div className="grid grid-cols-2 gap-6 sm:gap-8">
            {photos.map((photo) => (
              <div
                key={photo.src}
                className={`relative aspect-square ${photo.offset ? "translate-y-8 sm:translate-y-10" : ""}`}
              >
                <DecorativeRing rotate={photo.rotate} />
                <div className="relative h-full w-full overflow-hidden rounded-full">
                  <Image
                    src={photo.src}
                    alt={photo.alt}
                    fill
                    unoptimized
                    className="object-cover"
                  />
                </div>
              </div>
            ))}
          </div>
        </FadeIn>
      </div>
    </section>
  );
}
