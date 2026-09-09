import Image from "next/image";
import FadeIn from "@/components/FadeIn";
import { siteConfig } from "@/lib/site-content";

export default function IntroSection() {
  return (
    <section id="introduciendo" className="relative overflow-hidden bg-ink py-24 sm:py-32">
      <div className="mx-auto grid max-w-6xl grid-cols-1 gap-16 px-6 sm:px-10 md:grid-cols-12 md:gap-8">
        <FadeIn className="md:col-span-5">
          <p className="text-xs tracking-[0.4em] text-bronze">
            {siteConfig.intro.eyebrow.toUpperCase()}
          </p>

          <h2 className="mt-5 font-serif text-5xl leading-[1.1] text-white sm:text-6xl">
            {siteConfig.intro.title}.
          </h2>

          {/*
            Copy placeholder: texto genérico de presentación a confirmar con el
            cliente antes de publicar (no hay historia/posicionamiento definitivo
            todavía para Trompo's Barber Studio).
          */}
          <p className="mt-6 max-w-md leading-relaxed text-white/60">
            {siteConfig.intro.description}
          </p>

          <div className="mt-10 h-px w-16 bg-bronze/60" />
        </FadeIn>

        <FadeIn
          delayMs={150}
          className="relative md:col-span-7 md:min-h-[520px]"
        >
          <div className="relative mx-auto aspect-[4/5] w-[78%] overflow-hidden rounded-sm sm:w-[72%] md:absolute md:right-0 md:top-0 md:w-[65%]">
            <Image
              src="/images/intro-3.jpg"
              alt="Corte de pelo con tijera y peine en Trompo's Barber Studio"
              fill
              sizes="(min-width: 768px) 45vw, 70vw"
              className="object-cover grayscale transition-all duration-700 ease-out hover:scale-[1.04] hover:grayscale-0"
            />
          </div>

          <div className="relative -mt-16 ml-0 aspect-[4/5] w-[62%] overflow-hidden rounded-sm border border-bronze/40 shadow-2xl shadow-black/50 sm:w-[56%] md:absolute md:left-0 md:bottom-0 md:top-auto md:mt-0 md:w-[46%]">
            <Image
              src="/images/intro-2.webp"
              alt="Arreglo de barba en Trompo's Barber Studio"
              fill
              sizes="(min-width: 768px) 32vw, 55vw"
              className="object-cover grayscale transition-all duration-700 ease-out hover:scale-[1.04] hover:grayscale-0"
            />
          </div>
        </FadeIn>
      </div>
    </section>
  );
}
