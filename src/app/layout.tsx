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

// Dominio propio a confirmar — placeholder hasta que se compre/asigne uno real.
const siteUrl = "https://janeirobarberstudio.com";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Janeiro Barber Studio – Barbería en Ciudad Autónoma de Buenos Aires",
    template: "%s | Janeiro Barber Studio",
  },
  description:
    "Janeiro Barber Studio, barbería en Jorge Newbery, Ciudad Autónoma de Buenos Aires. Cortes de pelo y arreglos de barba con atención personalizada.",
  keywords: [
    "barbería Jorge Newbery",
    "barbería CABA",
    "peluquería masculina Buenos Aires",
    "barber studio Buenos Aires",
    "corte de pelo hombre Buenos Aires",
    "arreglo de barba CABA",
  ],
  authors: [{ name: "Janeiro Barber Studio" }],
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "es_AR",
    url: siteUrl,
    siteName: "Janeiro Barber Studio",
    title: "Janeiro Barber Studio – Barbería en Ciudad Autónoma de Buenos Aires",
    description:
      "Janeiro Barber Studio, barbería en Jorge Newbery, CABA. Cortes de pelo y arreglos de barba.",
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
