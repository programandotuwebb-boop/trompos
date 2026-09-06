import type { Metadata } from "next";
import { Playfair_Display, Inter } from "next/font/google";
import Header from "@/components/Header";
import WhatsAppButton from "@/components/WhatsAppButton";
import "./globals.css";

const playfairDisplay = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  display: "swap",
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const siteUrl = "https://barbas.com.ar";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Barbas – Peluquería masculina desde 1982",
    template: "%s | Barbas",
  },
  description:
    "Peluquería y barbería en el barrio de Belgrano R, Ciudad Autónoma de Buenos Aires, desde 1982. Cortes de pelo y arreglos de barba con más de 40 años de experiencia.",
  keywords: [
    "barbería Belgrano",
    "barbería CABA",
    "peluquería masculina Belgrano",
    "peluquería Belgrano R",
    "corte de pelo hombre Buenos Aires",
    "arreglo de barba Belgrano",
  ],
  authors: [{ name: "Barbas" }],
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "es_AR",
    url: siteUrl,
    siteName: "Barbas",
    title: "Barbas – Peluquería masculina desde 1982",
    description:
      "Peluquería y barbería en el barrio de Belgrano R, CABA, desde 1982. Cortes de pelo y arreglos de barba.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="es"
      className={`${playfairDisplay.variable} ${inter.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-cream text-body">
        <Header />
        <main className="flex-1">{children}</main>
        <WhatsAppButton />
      </body>
    </html>
  );
}
