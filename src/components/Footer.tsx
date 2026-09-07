import SocialLinks from "@/components/SocialLinks";
import { siteConfig } from "@/lib/site-content";

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="bg-ink py-12 text-white">
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-10 px-6 text-center sm:flex-row sm:items-start sm:justify-between sm:px-10 sm:text-left">
        <div>
          <p className="font-serif text-2xl tracking-[0.15em]">
            {siteConfig.name.toUpperCase()}
          </p>
          <p className="mt-1 text-[10px] tracking-[0.35em] text-white/50">
            {siteConfig.tagline.toUpperCase()}
          </p>
        </div>

        <div>
          <p className="text-[10px] tracking-[0.3em] text-white/50">DIRECCIÓN</p>
          <p className="mt-2 max-w-[220px] text-sm text-white/70">{siteConfig.address}</p>
        </div>

        <div className="flex flex-col items-center gap-4 sm:items-end">
          <SocialLinks className="text-white/60" />
          <p className="text-xs text-white/40">
            © {year} {siteConfig.fullName}. Todos los derechos reservados.
          </p>
        </div>
      </div>
    </footer>
  );
}
