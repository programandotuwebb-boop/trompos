export const siteConfig = {
  name: "Trompo's",
  fullName: "Trompo's Barber Studio",
  tagline: "Barber Studio",
  // Dominio propio a confirmar — placeholder hasta que se compre/asigne uno real.
  domain: "tromposbarberstudio.com",
  address: "Jorge Newbery 2460, Ciudad Autónoma de Buenos Aires",
  mapEmbedUrl:
    "https://www.google.com/maps?q=Jorge+Newbery+2460,+Ciudad+Aut%C3%B3noma+de+Buenos+Aires&output=embed",
  hero: {
    eyebrow: "Barber Studio",
    title: "El corte que te define.",
    subtitle: "Reservá tu turno en Trompo's.",
    cta: "Reservar turno",
  },
  intro: {
    eyebrow: "Trompo's",
    title: "Un espacio propio",
    // Copy placeholder: confirmar posicionamiento/tono definitivo con el cliente.
    description:
      "Un espacio pensado para el cuidado masculino moderno, donde cada visita es una experiencia. Cortes de precisión y arreglos de barba, con atención personalizada de principio a fin.",
  },
  services: {
    items: [
      { name: "Corte de pelo", duration: "45 min" },
      { name: "Corte + Barba", duration: "1 hora" },
    ],
  },
  turno: {
    title: "Solicitar turno",
    formTitle: "Reservá tu turno",
    formDescription:
      "Completá tus datos y te confirmamos el turno por WhatsApp.",
  },
  team: [
    {
      name: "Tomás",
      phone: "11.5994.4065",
      phoneHref: "5491159944065",
      photo: "/images/tomas.jpg",
    },
  ],
  whatsapp: {
    phoneHref: "5491159944065",
    message: "Hola! Quiero reservar un turno en Trompo's Barber Studio.",
  },
  // TODO: reemplazar por el @ y el link reales cuando existan las cuentas.
  socials: {
    instagram: { handle: "@tromposbarberstudio", url: "https://instagram.com/tromposbarberstudio" },
    facebook: { handle: "Trompo's Barber Studio", url: "https://facebook.com/tromposbarberstudio" },
  },
} as const;
