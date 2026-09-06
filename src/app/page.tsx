import Hero from "@/components/Hero";
import IntroSection from "@/components/IntroSection";
import CommunitySection from "@/components/CommunitySection";
import TurnoSection from "@/components/TurnoSection";

export default function Home() {
  return (
    <>
      <Hero />
      <IntroSection />
      <CommunitySection />
      <TurnoSection />
      {/* Próximas secciones: Servicios, Galería, Footer */}
    </>
  );
}
