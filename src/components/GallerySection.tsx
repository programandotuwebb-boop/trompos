"use client";

import { useRef } from "react";
import Image from "next/image";
import FadeIn from "@/components/FadeIn";

// Placeholders (gallery-*.svg) marcados como tales en sus propios archivos:
// reemplazar por fotos reales del local a medida que estén disponibles.
const photos = [
  { src: "/images/tomas.jpg", alt: "Tomás, barbero de Janeiro Barber Studio", unoptimized: false },
  {
    src: "/images/intro-2.webp",
    alt: "Arreglo de barba en Janeiro Barber Studio",
    unoptimized: false,
  },
  {
    src: "/images/gallery-chair.svg",
    alt: "Sillón de trabajo del estudio (foto próximamente)",
    unoptimized: true,
  },
  {
    src: "/images/intro-3.jpg",
    alt: "Corte de pelo en Janeiro Barber Studio",
    unoptimized: false,
  },
  {
    src: "/images/gallery-interior.svg",
    alt: "Interior del estudio (foto próximamente)",
    unoptimized: true,
  },
  {
    src: "/images/gallery-tools.svg",
    alt: "Detalle de herramientas (foto próximamente)",
    unoptimized: true,
  },
];

export default function GallerySection() {
  const scrollerRef = useRef<HTMLDivElement>(null);

  function scrollByAmount(direction: 1 | -1) {
    const node = scrollerRef.current;
    if (!node) return;
    node.scrollBy({ left: direction * node.clientWidth * 0.8, behavior: "smooth" });
  }

  return (
    <section className="bg-ink py-20 sm:py-28">
      <div className="mx-auto max-w-6xl px-6 sm:px-10">
        <FadeIn className="flex items-end justify-between">
          <div>
            <p className="text-xs tracking-[0.4em] text-bronze">GALERÍA</p>
            <h2 className="mt-4 font-serif text-4xl text-white sm:text-5xl">
              Un vistazo al estudio
            </h2>
          </div>

          <div className="hidden gap-3 sm:flex">
            <button
              type="button"
              onClick={() => scrollByAmount(-1)}
              aria-label="Ver fotos anteriores"
              className="flex h-10 w-10 items-center justify-center border border-white/20 text-white transition-colors hover:border-bronze hover:text-bronze"
            >
              ‹
            </button>
            <button
              type="button"
              onClick={() => scrollByAmount(1)}
              aria-label="Ver fotos siguientes"
              className="flex h-10 w-10 items-center justify-center border border-white/20 text-white transition-colors hover:border-bronze hover:text-bronze"
            >
              ›
            </button>
          </div>
        </FadeIn>

        <FadeIn delayMs={100}>
          <div
            ref={scrollerRef}
            className="no-scrollbar mt-10 flex snap-x snap-mandatory gap-4 overflow-x-auto pb-2"
          >
            {photos.map((photo) => (
              <div
                key={photo.src}
                className="relative aspect-[4/5] w-56 shrink-0 snap-start overflow-hidden sm:w-72"
              >
                <Image
                  src={photo.src}
                  alt={photo.alt}
                  fill
                  unoptimized={photo.unoptimized}
                  sizes="(min-width: 640px) 288px, 224px"
                  className="object-cover grayscale transition-all duration-700 ease-out hover:scale-[1.03] hover:grayscale-0"
                />
              </div>
            ))}
          </div>
        </FadeIn>

        <div className="mt-6 flex justify-center gap-3 sm:hidden">
          <button
            type="button"
            onClick={() => scrollByAmount(-1)}
            aria-label="Ver fotos anteriores"
            className="flex h-10 w-10 items-center justify-center border border-white/20 text-white transition-colors hover:border-bronze hover:text-bronze"
          >
            ‹
          </button>
          <button
            type="button"
            onClick={() => scrollByAmount(1)}
            aria-label="Ver fotos siguientes"
            className="flex h-10 w-10 items-center justify-center border border-white/20 text-white transition-colors hover:border-bronze hover:text-bronze"
          >
            ›
          </button>
        </div>
      </div>
    </section>
  );
}
