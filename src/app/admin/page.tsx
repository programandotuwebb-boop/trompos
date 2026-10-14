import type { Metadata } from "next";
import AdminPanel from "@/components/AdminPanel";
import { currentActor } from "@/lib/booking/auth";
export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Administración",
  robots: { index: false, follow: false },
};
export default async function AdminPage() {
  const actor = await currentActor();
  return (
    <section className="min-h-screen bg-ink px-5 pb-20 pt-12 sm:px-10 sm:pt-16">
      <div className="mx-auto max-w-6xl">
        <p className="text-xs tracking-[0.35em] text-bronze">
          TROMPO’S · ÁREA PRIVADA
        </p>
        <h1 className="mt-4 font-serif text-4xl text-white">
          {actor?.role === "PROFESSIONAL" ? "Mi agenda" : "Administración"}
        </h1>
        <AdminPanel initialActor={actor} />
      </div>
    </section>
  );
}
