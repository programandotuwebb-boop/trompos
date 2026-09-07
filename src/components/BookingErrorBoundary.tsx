"use client";

import { Component, type ReactNode } from "react";

type Props = { children: ReactNode; fallbackMessage?: string };
type State = { hasError: boolean };

const DEFAULT_MESSAGE =
  "No pudimos cargar el sistema de reservas. Contactanos directamente para coordinar tu turno.";

export default class BookingErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: unknown) {
    console.error("[BookingErrorBoundary]", error);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="rounded-sm border border-white/10 bg-white/5 p-8 text-center">
          <p className="text-sm text-white/70">
            {this.props.fallbackMessage ?? DEFAULT_MESSAGE}
          </p>
        </div>
      );
    }

    return this.props.children;
  }
}
