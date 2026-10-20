/**
 * Traduzioni del sito. La lingua attiva è quella su <html lang>.
 * Per aggiungere altre sezioni tradotte (header, footer, card, ...) basta
 * aggiungere nuove chiavi accanto a `curriculum` in entrambe le lingue.
 */

export const languages = { en: "English", it: "Italiano" } as const;
export type Lang = keyof typeof languages;
export const defaultLang: Lang = "en";

// ───────────────────────── ui.en ─────────────────────────
const homeEn = {
  cards: {
    github: "GitHub",
    curriculum: "Curriculum",
    manifest: "Manifest",
  }
};

const footerEn = {
  navigate: "Navigate",
  navLinks: [
    { label: "Home", href: "/" },
    { label: "Projects", href: "/#cards-section" },
    { label: "Manifest", href: "/manifest" },
  ],
  groups: [
    {
      title: "Explore",
      links: [
        { label: "About", href: "/about" },
        { label: "Manifest", href: "/manifest" },
        { label: "Curriculum", href: "/curriculum" },
        { label: "GitHub", href: "https://github.com/matttsona", external: true },
      ],
    },
    {
      title: "Support",
      links: [
        { label: "FAQ", href: "/faq" },
        { label: "Contact", href: "/contact" },
        { label: "Feedback", href: "/feedback" },
      ],
    },
    {
      title: "Legal",
      links: [
        { label: "Privacy", href: "/privacy" },
        { label: "Terms", href: "/terms" },
        { label: "Cookies", href: "/cookies" },
        { label: "Accessibility", href: "/accessibility" },
      ],
    },
  ],
  backToTop: "Back to top ↑",
};

const curriculumEn = {
  title: "Curriculum",
  name: "Matteo Sonaglioni",
  role: "MSc Student in Computer and Automation Engineering",
  location: "Belmonte Piceno (FM), Italy",
  scroll: "Scroll",
  gdpr: "I authorise the processing of my personal data contained in this CV pursuant to Regulation (EU) 2016/679 (GDPR).",
  sections: {
    profile: {
      label: "Profile",
      text: "Final-year MSc student in Computer and Automation Engineering at UNIVPM, with a solid technical background that also covers electrical engineering. International experience through a six-month Erasmus+ exchange in Spain and a language internship in London. Skilled in software development, artificial intelligence, data science and web/mobile programming, combined with organisational skills gained through varied work experience.",
    },
    education: {
      label: "Education",
      items: [
        {
          title: "MSc in Computer and Automation Engineering",
          org: "Università Politecnica delle Marche (UNIVPM), Italy",
          meta: "Ongoing",
        },
        {
          title: "BSc in Computer and Automation Engineering",
          org: "Università Politecnica delle Marche (UNIVPM), Italy",
          meta: "Final grade 95/100",
        },
        {
          title: "High School Diploma in Electrical Engineering",
          org: "ITIS “E. Montani”, Fermo, Italy",
          meta: "Final grade 92/100",
        },
      ],
    },
    international: {
      label: "International experience",
      items: [
        {
          title: "Erasmus+ Exchange Programme",
          org: "Universidad de Huelva (UHU), Spain",
          meta: "6 months",
          notes: [
            "Video Game Programming (Unity)",
            "Bio-inspired Models and Metaheuristics",
            "Database Administration (Oracle)",
            "Spanish language (B1)",
          ],
        },
        {
          title: "Language Internship",
          org: "London, United Kingdom",
          meta: "1 week",
        },
      ],
    },
    skills: {
      label: "Technical skills",
      items: [
        "Python, C++, Java, JavaScript",
        "Web technologies and mobile development",
        "Artificial Intelligence, Computer Vision and Deep Learning",
        "Data Science, Big Data and Machine Learning",
        "Advanced programming and database administration (Oracle)",
        "Project Management and Decision Support Systems",
      ],
    },
    work: {
      label: "Work experience",
      items: [
        {
          title: "IT Support Technician",
          org: "ITT Workstations Department, UNIVPM",
          meta: "150 hours",
          notes: [
            "Troubleshooting technical issues for university staff",
            "Hardware and software maintenance of workstations",
          ],
        },
        {
          title: "Print Room Assistant and Supervisor",
          org: "UNIVPM",
          meta: "150 hours",
          notes: [
            "Assisting students with the print rooms",
            "Supervision and management of the facilities",
          ],
        },
        {
          title: "Traffic Control Assistant",
          org: "Antolini Loris",
          meta: "1 month",
          notes: [
            "Directing and regulating vehicle traffic during mechanised street-cleaning operations",
          ],
        },
        {
          title: "Barista",
          org: "Ristorante Pizzeria da Marcella, Torre di Palme",
          meta: "1 month",
          notes: ["Customer service and drink preparation at the bar counter"],
        },
      ],
    },
    languages: {
      label: "Languages",
      items: [
        { title: "Italian", meta: "Native" },
        { title: "English", meta: "B2" },
        { title: "Spanish", meta: "B1" },
      ],
    },
    interests: {
      label: "Interests",
      items: ["Advertising graphics design and pixel art"],
    },
  },
};

const notFoundEn = {
  label: "Error 404",
  title: "Page not found",
  text: "The page you are looking for does not exist, was moved, or never was.",
  home: "Back to home",
  requested: "Requested path",
};

// ───────────────────────── ui.it ─────────────────────────
const homeIt = {
  cards: {
    github: "GitHub",
    curriculum: "Curriculum",
    manifest: "Manifesto",
  }
}

const footerIt = {
  navigate: "Naviga",
  navLinks: [
    { label: "Home", href: "/" },
    { label: "Progetti", href: "/#cards-section" },
    { label: "Manifesto", href: "/manifest" },
  ],
  groups: [
    {
      title: "Esplora",
      links: [
        { label: "Chi sono", href: "/about" },
        { label: "Manifesto", href: "/manifest" },
        { label: "Curriculum", href: "/curriculum" },
        { label: "GitHub", href: "https://github.com/matttsona", external: true },
      ],
    },
    {
      title: "Supporto",
      links: [
        { label: "FAQ", href: "/faq" },
        { label: "Contatti", href: "/contact" },
        { label: "Feedback", href: "/feedback" },
      ],
    },
    {
      title: "Legale",
      links: [
        { label: "Privacy", href: "/privacy" },
        { label: "Termini", href: "/terms" },
        { label: "Cookie", href: "/cookies" },
        { label: "Accessibilità", href: "/accessibility" },
      ],
    },
  ],
  backToTop: "Torna su ↑",
};

const curriculumIt = {
  title: "Curriculum",
  name: "Matteo Sonaglioni",
  role: "Studente magistrale in Ingegneria Informatica e dell’Automazione",
  location: "Belmonte Piceno (FM), Italia",
  scroll: "Scorri",
  gdpr: "Autorizzo il trattamento dei dati personali contenuti nel presente CV ai sensi del Regolamento (UE) 2016/679 (GDPR).",
  sections: {
    profile: {
      label: "Profilo",
      text: "Studente all’ultimo anno della laurea magistrale in Ingegneria Informatica e dell’Automazione presso l’UNIVPM, con una solida preparazione tecnica che comprende anche l’ambito elettrotecnico. Esperienza internazionale grazie a sei mesi di Erasmus+ in Spagna e a un tirocinio linguistico a Londra. Competenze in sviluppo software, intelligenza artificiale, data science e programmazione web/mobile, affiancate da capacità organizzative maturate in esperienze lavorative diverse.",
    },
    education: {
      label: "Formazione",
      items: [
        {
          title: "Laurea Magistrale in Ingegneria Informatica e dell’Automazione",
          org: "Università Politecnica delle Marche (UNIVPM), Italia",
          meta: "In corso",
        },
        {
          title: "Laurea Triennale in Ingegneria Informatica e dell’Automazione",
          org: "Università Politecnica delle Marche (UNIVPM), Italia",
          meta: "Voto finale 95/100",
        },
        {
          title: "Diploma di scuola superiore in Elettrotecnica",
          org: "ITIS “E. Montani”, Fermo, Italia",
          meta: "Voto finale 92/100",
        },
      ],
    },
    international: {
      label: "Esperienza internazionale",
      items: [
        {
          title: "Programma di scambio Erasmus+",
          org: "Universidad de Huelva (UHU), Spagna",
          meta: "6 mesi",
          notes: [
            "Programmazione di videogiochi (Unity)",
            "Modelli bio-ispirati e metaeuristiche",
            "Amministrazione di database (Oracle)",
            "Lingua spagnola (B1)",
          ],
        },
        {
          title: "Tirocinio linguistico",
          org: "Londra, Regno Unito",
          meta: "1 settimana",
        },
      ],
    },
    skills: {
      label: "Competenze tecniche",
      items: [
        "Python, C++, Java, JavaScript",
        "Tecnologie web e sviluppo mobile",
        "Intelligenza Artificiale, Computer Vision e Deep Learning",
        "Data Science, Big Data e Machine Learning",
        "Programmazione avanzata e amministrazione di database (Oracle)",
        "Project Management e Sistemi di Supporto alle Decisioni",
      ],
    },
    work: {
      label: "Esperienze lavorative",
      items: [
        {
          title: "Tecnico di supporto IT",
          org: "Reparto ITT Postazioni di lavoro, UNIVPM",
          meta: "150 ore",
          notes: [
            "Risoluzione di problemi tecnici per il personale universitario",
            "Manutenzione hardware e software delle postazioni",
          ],
        },
        {
          title: "Assistente e responsabile sala stampa",
          org: "UNIVPM",
          meta: "150 ore",
          notes: [
            "Assistenza agli studenti nelle sale stampa",
            "Supervisione e gestione degli spazi",
          ],
        },
        {
          title: "Addetto al controllo del traffico",
          org: "Antolini Loris",
          meta: "1 mese",
          notes: [
            "Gestione e regolazione del traffico veicolare durante le operazioni di pulizia meccanizzata delle strade",
          ],
        },
        {
          title: "Barista",
          org: "Ristorante Pizzeria da Marcella, Torre di Palme",
          meta: "1 mese",
          notes: ["Servizio ai clienti e preparazione di bevande al bancone"],
        },
      ],
    },
    languages: {
      label: "Lingue",
      items: [
        { title: "Italiano", meta: "Madrelingua" },
        { title: "Inglese", meta: "B2" },
        { title: "Spagnolo", meta: "B1" },
      ],
    },
    interests: {
      label: "Interessi",
      items: ["Grafica pubblicitaria e pixel art"],
    },
  },
};

const notFoundIt = {
  label: "Errore 404",
  title: "Pagina non trovata",
  text: "La pagina che cerchi non esiste, è stata spostata o non c’è mai stata.",
  home: "Torna alla home",
  requested: "Percorso richiesto",
};

export const ui = {
  en: { home: homeEn, footer: footerEn, curriculum: curriculumEn, notFound: notFoundEn },
  it: { home: homeIt, footer: footerIt, curriculum: curriculumIt, notFound: notFoundIt },
} as const;