import Image from "next/image";
import { siteConfig } from "@/lib/site-content";

type TeamCardProps = {
  name: string;
  phone: string;
  phoneHref: string;
};

export default function TeamCard({ name, phone, phoneHref }: TeamCardProps) {
  return (
    <div className="flex flex-col items-center text-center">
      <div className="relative h-24 w-24 overflow-hidden rounded-full sm:h-32 sm:w-32">
        <Image
          src="/images/avatar-placeholder.svg"
          alt={`Foto de ${name}`}
          fill
          unoptimized
          className="object-cover"
        />
      </div>

      <p className="mt-4 font-serif text-2xl text-taupe">{name}</p>
      <a
        href={`tel:+${phoneHref}`}
        className="mt-1 text-sm text-body transition-colors hover:text-charcoal"
      >
        {phone}
      </a>

      <div className="mt-4 flex flex-col gap-2 sm:flex-row">
        <a
          href={`tel:+${phoneHref}`}
          className="rounded-full border border-charcoal/20 px-4 py-1.5 text-center text-xs tracking-wide text-charcoal transition-colors hover:bg-charcoal hover:text-white"
        >
          Llamar
        </a>
        <a
          href={`https://wa.me/${phoneHref}?text=${encodeURIComponent(
            `Hola ${name}! Quiero reservar un turno en ${siteConfig.fullName}.`
          )}`}
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-full bg-[#25D366]/90 px-4 py-1.5 text-center text-xs tracking-wide text-white transition-colors hover:bg-[#25D366]"
        >
          WhatsApp
        </a>
      </div>
    </div>
  );
}
