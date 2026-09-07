import Hero from "@/components/Hero";
import IntroSection from "@/components/IntroSection";
import TurnoSection from "@/components/TurnoSection";
import ServicesSection from "@/components/ServicesSection";

export default function Home() {
  return (
    <>
      <Hero />
      <IntroSection />
      <TurnoSection />
      <ServicesSection />
      {/* Próximas secciones: Galería, Footer */}
    </>
  );
}
