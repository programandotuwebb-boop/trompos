import Image from "next/image";
import Parallax from "@/components/Parallax";
import { siteConfig } from "@/lib/site-content";
import { getServicePrices } from "@/lib/pricing";
import { formatPrice } from "@/lib/format";

export default async function Hero() {
  const prices = await getServicePrices();

  return (
    <section className="relative flex min-h-screen w-full items-end overflow-hidden bg-ink">
      <Parallax speed={0.3} className="absolute inset-x-0 -top-[15%] -bottom-[15%]">
        <Image
          src="/images/hero-placeholder.svg"
          alt="Interior de Trompo's Barber Studio"
          fill
          priority
          unoptimized
          className="object-cover"
        />
      </Parallax>

      <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/70 to-ink/30" />
      <div className="grain-overlay absolute inset-0" aria-hidden="true" />

      <div className="relative mx-auto w-full max-w-6xl px-6 pb-24 sm:px-10 sm:pb-32">
        <p
          className="reveal-up text-xs tracking-[0.4em] text-bronze"
          style={{ animationDelay: "0ms" }}
        >
          {siteConfig.hero.eyebrow.toUpperCase()}
        </p>

        <h1
          className="reveal-up mt-5 max-w-3xl font-serif text-6xl leading-[1.05] text-white sm:text-7xl md:text-8xl"
          style={{ animationDelay: "120ms" }}
        >
          {siteConfig.hero.title}
        </h1>

        <p
          className="reveal-up mt-6 text-base text-white/70 sm:text-lg"
          style={{ animationDelay: "260ms" }}
        >
          {siteConfig.hero.subtitle}
        </p>

        <div className="reveal-up mt-10" style={{ animationDelay: "380ms" }}>
          <a
            href="#turno"
            className="group inline-flex items-center gap-3 border border-bronze/60 px-8 py-4 text-xs font-medium tracking-[0.25em] text-white transition-all duration-300 hover:border-bronze hover:bg-bronze"
          >
            {siteConfig.hero.cta.toUpperCase()}
            <span className="transition-transform duration-300 group-hover:translate-x-1">
              →
            </span>
          </a>
        </div>

        <div
          className="reveal-up mt-8 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs tracking-[0.15em] text-white/50"
          style={{ animationDelay: "480ms" }}
        >
          {siteConfig.services.items.map((item, index) => (
            <span key={item.name} className="flex items-center gap-4">
              {index > 0 && <span aria-hidden="true">·</span>}
              <span>
                {item.name.toUpperCase()}{" "}
                <span className="text-white/30">
                  — {item.duration.toUpperCase()} — {formatPrice(prices[item.name])}
                </span>
              </span>
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
