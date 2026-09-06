import Image from "next/image";
import { siteConfig } from "@/lib/site-content";

export default function Hero() {
  return (
    <section className="relative flex min-h-screen w-full items-center overflow-hidden bg-charcoal">
      <Image
        src="/images/hero-placeholder.svg"
        alt="Interior de la barbería Barbas en Belgrano"
        fill
        priority
        unoptimized
        className="object-cover"
      />
      <div className="absolute inset-0 bg-charcoal/60" />

      <div className="relative mx-auto flex w-full max-w-6xl flex-col px-6 pt-24 pb-20 sm:px-10 sm:pt-28">
        <p className="text-xs tracking-[0.3em] text-white/70 sm:text-sm">
          {siteConfig.hero.eyebrow.toUpperCase()}
        </p>

        <h1 className="mt-4 max-w-2xl font-serif text-4xl leading-tight text-white sm:text-5xl md:text-6xl">
          {siteConfig.hero.title}
        </h1>

        <p className="mt-5 text-base text-white/90 sm:text-lg">
          {siteConfig.hero.subtitle}
        </p>

        <a
          href="#turno"
          className="mt-8 inline-block w-fit bg-taupe px-8 py-4 text-xs font-medium tracking-[0.2em] text-white transition-colors hover:bg-taupe-dark sm:text-sm"
        >
          {siteConfig.hero.cta.toUpperCase()}
        </a>

        <div className="mt-16 flex gap-3 sm:mt-24">
          <span className="h-2.5 w-2.5 rounded-full bg-white" aria-hidden="true" />
          <span className="h-2.5 w-2.5 rounded-full bg-white/40" aria-hidden="true" />
          <span className="sr-only">Presentación de la barbería Barbas</span>
        </div>
      </div>
    </section>
  );
}
