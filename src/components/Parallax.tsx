"use client";

import { useEffect, useRef } from "react";

type ParallaxProps = {
  children: React.ReactNode;
  speed?: number;
  className?: string;
};

export default function Parallax({ children, speed = 0.25, className = "" }: ParallaxProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let ticking = false;

    function update() {
      if (!node) return;
      const rect = node.parentElement?.getBoundingClientRect();
      const offset = rect ? rect.top : 0;
      node.style.transform = `translate3d(0, ${offset * speed}px, 0)`;
      ticking = false;
    }

    function onScroll() {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(update);
      }
    }

    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [speed]);

  return (
    <div ref={ref} className={`will-change-transform ${className}`}>
      {children}
    </div>
  );
}
