"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import styles from "./Header.module.css";
import { siteConfig } from "@/lib/site-content";

export default function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [closing, setClosing] = useState(false);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const previousOverflow = useRef<string | null>(null);

  useEffect(() => () => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    if (previousOverflow.current !== null) {
      document.body.style.overflow = previousOverflow.current;
    }
  }, []);

  function openMenu() {
    if (!dialogRef.current || dialogRef.current.open) return;
    previousOverflow.current = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    setClosing(false);
    setMenuOpen(true);
    dialogRef.current.showModal();
  }

  function closeMenu(destination?: string) {
    if (closeTimer.current) return;
    setClosing(true);
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    closeTimer.current = setTimeout(() => {
      dialogRef.current?.close();
      document.body.style.overflow = previousOverflow.current ?? "";
      previousOverflow.current = null;
      setMenuOpen(false);
      setClosing(false);
      closeTimer.current = null;
      if (destination) {
        const target = document.getElementById(destination);
        if (target) {
          window.history.pushState(null, "", `#${destination}`);
          target.focus({ preventScroll: true });
          target.scrollIntoView({ behavior: reducedMotion ? "instant" : "smooth", block: "start" });
        }
      } else {
        triggerRef.current?.focus({ preventScroll: true });
      }
    }, reducedMotion ? 0 : 320);
  }

  useEffect(() => {
    function onScroll() {
      setScrolled(window.scrollY > 32);
    }
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <>
    <header
      className={`fixed top-0 left-0 z-50 w-full transition-all duration-500 ease-out ${
        scrolled
          ? "bg-ink/85 py-2.5 shadow-lg shadow-black/30 backdrop-blur-md"
          : "bg-transparent py-6"
      }`}
    >
      <div className="relative mx-auto flex max-w-6xl flex-col items-center px-4">
        <button ref={triggerRef} type="button" className={styles.trigger} onClick={openMenu}
          aria-label="Abrir menú" aria-expanded={menuOpen} aria-controls="site-menu" aria-haspopup="dialog">
          <span aria-hidden="true" /><span aria-hidden="true" />
        </button>
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
    <dialog ref={dialogRef} id="site-menu" aria-labelledby="menu-title"
      className={styles.dialog} data-closing={closing || undefined}
      onKeyDown={(event) => {
        if (event.key !== "Tab") return;
        const items = event.currentTarget.querySelectorAll<HTMLElement>("button, a[href]");
        const first = items[0];
        const last = items[items.length - 1];
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault(); last?.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault(); first?.focus();
        }
      }}
      onCancel={(event) => { event.preventDefault(); closeMenu(); }}
      onClick={(event) => { if (event.target === event.currentTarget) closeMenu(); }}>
      <div className={styles.panel}>
        <div className={styles.panelHeader}>
          <h2 id="menu-title" className="text-xs tracking-[0.3em]">MENÚ</h2>
          <button type="button" className={styles.close} aria-label="Cerrar menú" onClick={() => closeMenu()}>
            <svg aria-hidden="true" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.25">
              <path d="m6 6 12 12M18 6 6 18" />
            </svg>
          </button>
        </div>
        <nav aria-label="Navegación principal" className={styles.navigation}>
          {[
            ["inicio", "Inicio"], ["turno", "Turnos"], ["productos", "Productos"],
            ["ubicacion", "Ubicación"], ["contacto", "Contacto"],
          ].map(([id, label], index) => (
            <a key={id} href={`#${id}`} onClick={(event) => {
              if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
              event.preventDefault(); closeMenu(id);
            }}>
              <span className={styles.number} aria-hidden="true">0{index + 1}</span>
              <span>{label}</span>
              <span className={styles.arrow} aria-hidden="true">↗</span>
            </a>
          ))}
        </nav>
        <p className={styles.signature}>{siteConfig.fullName}</p>
      </div>
    </dialog>
    </>
  );
}
