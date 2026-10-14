import { connection } from "next/server";

import Hero from "@/components/Hero";
import IntroSection from "@/components/IntroSection";
import TurnoSection from "@/components/TurnoSection";
import GallerySection from "@/components/GallerySection";

export default async function Home() {
  await connection();
  return (
    <>
      <Hero />
      <IntroSection />
      <TurnoSection />
      <GallerySection />
    </>
  );
}
