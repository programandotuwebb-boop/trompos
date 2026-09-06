import Link from "next/link";
import { siteConfig } from "@/lib/site-content";

export default function Header() {
  return (
    <header className="fixed top-0 left-0 z-50 w-full bg-charcoal">
      <div className="mx-auto flex max-w-6xl flex-col items-center px-4 py-3 sm:py-4">
        <Link
          href="/"
          className="font-serif text-2xl tracking-wide text-white transition-opacity hover:opacity-80 sm:text-3xl"
        >
          {siteConfig.name.toUpperCase()}
        </Link>
        <span className="mt-1 text-[10px] tracking-[0.25em] text-white/80 sm:text-xs sm:tracking-[0.3em]">
          {siteConfig.tagline.toUpperCase()}
        </span>
      </div>
    </header>
  );
}
