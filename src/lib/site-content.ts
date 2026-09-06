export const siteConfig = {
  name: "Barbas",
  tagline: "Peluquería & Barbería",
  domain: "barbas.com.ar",
  since: 1982,
  address: "Echeverría 3111, Belgrano, Ciudad Autónoma de Buenos Aires",
  mapEmbedUrl:
    "https://www.google.com/maps?q=Echeverr%C3%ADa+3111,+Belgrano,+CABA&output=embed",
  hero: {
    eyebrow: "Bienvenidos a Barbas",
    title: "Donde los hombres lucen mejor...",
    subtitle: "No dude en reservar su turno",
    cta: "Reserva de turno",
  },
  intro: {
    eyebrow: "Introduciendo",
    title: "Barbas",
    subtitle: "Peluquería & Barbería",
    since: "Desde 1982",
    description:
      "Peluquería y barbería ejerciendo en el barrio de Belgrano R desde 1982, con más de 40 años de experiencia. Siempre a la vanguardia de la moda en el mundo de la peluquería.",
  },
  community: {
    title:
      "Orgullosos de ejercer nuestra profesión en nuestro querido barrio de Belgrano R",
    subtitle:
      "Atendemos a los vecinos del barrio, con una mención especial a la Sociedad de Fomento de Belgrano R, Belgrano Athletic Club, colegios y locales comerciales aledaños.",
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
      name: "Hugo",
      phone: "11.5493.3362",
      phoneHref: "5491154933362",
    },
    {
      name: "Ruben",
      phone: "11.6748.7766",
      phoneHref: "5491167487766",
    },
  ],
  whatsapp: {
    phoneHref: "5491154933362",
    message: "Hola! Quiero reservar un turno en Barbas.",
  },
} as const;
