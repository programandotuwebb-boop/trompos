"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { siteConfig } from "@/lib/site-content";

export default function Header() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    function onScroll() {
      setScrolled(window.scrollY > 32);
    }
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`fixed top-0 left-0 z-50 w-full transition-all duration-500 ease-out ${
        scrolled
          ? "bg-ink/85 py-2.5 shadow-lg shadow-black/30 backdrop-blur-md"
          : "bg-transparent py-6"
      }`}
    >
      <div className="mx-auto flex max-w-6xl flex-col items-center px-4">
        <Link
          href="/"
          className={`font-serif tracking-[0.2em] text-white transition-all duration-500 ease-out hover:text-bronze ${
            scrolled ? "text-lg sm:text-xl" : "text-2xl sm:text-3xl"
          }`}
        >
          {siteConfig.name.toUpperCase()}
        </Link>

        <span
          className={`bg-white/30 transition-all duration-500 ease-out ${
            scrolled ? "mt-1.5 h-px w-6 opacity-0" : "mt-2.5 h-px w-8 opacity-100"
          }`}
        />

        <span
          className={`overflow-hidden text-white/60 tracking-[0.4em] transition-all duration-500 ease-out ${
            scrolled ? "mt-0 max-h-0 text-[0px] opacity-0" : "mt-2 max-h-4 text-[10px] opacity-100"
          }`}
        >
          {siteConfig.tagline.toUpperCase()}
        </span>
      </div>
    </header>
  );
}
