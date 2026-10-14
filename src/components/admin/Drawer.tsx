"use client";
import { useEffect, useId, useRef, type ReactNode } from "react";
import styles from "../AdminPanel.module.css";
export default function Drawer({
  title,
  onClose,
  children,
  locked = false,
}: {
  title: string;
  onClose: () => void;
  children: ReactNode;
  locked?: boolean;
}) {
  const ref = useRef<HTMLDialogElement>(null),
    id = useId();
  useEffect(() => {
    const d = ref.current;
    const before = document.activeElement;
    d?.showModal();
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      d?.close();
      document.body.style.overflow = overflow;
      if (before instanceof HTMLElement) before.focus();
    };
  }, []);
  return (
    <dialog
      ref={ref}
      className={styles.drawer}
      aria-labelledby={id}
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          const r = e.currentTarget.getBoundingClientRect();
          if (
            e.clientX < r.left ||
            e.clientX > r.right ||
            e.clientY < r.top ||
            e.clientY > r.bottom
          )
            onClose();
        }
      }}
    >
      <div className={styles.drawerHead}>
        <h2 id={id}>{title}</h2>
        <button
          type="button"
          onClick={onClose}
          disabled={locked}
          aria-label="Cerrar panel"
        >
          ×
        </button>
      </div>
      <div className={styles.drawerBody}>{children}</div>
    </dialog>
  );
}
