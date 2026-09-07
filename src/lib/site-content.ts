export const siteConfig = {
  name: "Janeiro",
  fullName: "Janeiro Barber Studio",
  tagline: "Barber Studio",
  // Dominio propio a confirmar — placeholder hasta que se compre/asigne uno real.
  domain: "janeirobarberstudio.com",
  address: "Jorge Newbery 2460, Ciudad Autónoma de Buenos Aires",
  mapEmbedUrl:
    "https://www.google.com/maps?q=Jorge+Newbery+2460,+Ciudad+Aut%C3%B3noma+de+Buenos+Aires&output=embed",
  hero: {
    eyebrow: "Barber Studio",
    title: "El corte que te define.",
    subtitle: "Reservá tu turno en Janeiro.",
    cta: "Reservar turno",
  },
  intro: {
    eyebrow: "Janeiro",
    title: "Un espacio propio",
    // Copy placeholder: confirmar posicionamiento/tono definitivo con el cliente.
    description:
      "Un espacio pensado para el cuidado masculino moderno, donde cada visita es una experiencia. Cortes de precisión y arreglos de barba, con atención personalizada de principio a fin.",
  },
  services: {
    eyebrow: "Servicios",
    title: "¿Qué hacemos?",
    description:
      "Básicamente ofrecemos nuestros servicios de corte de pelo y barba a través de nuestros profesionales, haciendo que las sesiones sean totalmente amenas y con el fin de que nuestros clientes queden totalmente conformes y de esta manera conformar un vínculo de confianza.",
    items: [
      { name: "Cortes de pelo" },
      { name: "Arreglos de barba" },
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
    },
  ],
  whatsapp: {
    phoneHref: "5491159944065",
    message: "Hola! Quiero reservar un turno en Janeiro Barber Studio.",
  },
} as const;
