import Image from "next/image";
import FadeIn from "@/components/FadeIn";
import { siteConfig } from "@/lib/site-content";

export default function CommunitySection() {
  return (
    <section
      id="comunidad"
      className="relative flex min-h-[70vh] items-center overflow-hidden bg-charcoal py-24 sm:py-32"
    >
      <Image
        src="/images/community-placeholder.svg"
        alt="Calle del barrio de Belgrano R"
        fill
        unoptimized
        className="object-cover grayscale"
      />
      <div className="absolute inset-0 bg-charcoal/70" />

      <FadeIn className="relative mx-auto max-w-3xl px-6 text-center sm:px-10">
        <h2 className="font-serif text-3xl leading-snug text-white sm:text-4xl md:text-5xl">
          {siteConfig.community.title}
        </h2>
        <p className="mt-6 text-base leading-relaxed text-white/85 sm:text-lg">
          {siteConfig.community.subtitle}
        </p>
      </FadeIn>
    </section>
  );
}
