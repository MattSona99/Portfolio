// src/contents/references.ts
// Sources behind the manifesto. Add an entry here and it appears on the page, in both languages.
// `cited` lists the chapters that rely on the source: they become links on the page.
import type { ChapterKey, Locale } from "./manifest.config";

export type RefGroup = "principles" | "intergovernmental" | "law" | "science";

// Order in which the groups are shown
export const REFERENCE_GROUPS: RefGroup[] = ["principles", "intergovernmental", "law", "science"];

// Update this date every time you re-check the links
export const REFERENCES_CHECKED = "2026-10-20";

export interface Reference {
  id: string;
  group: RefGroup;
  year: number;
  org: string;
  title: Record<Locale, string>;
  note: Record<Locale, string>;
  url: string;
  cited: ChapterKey[];
}

export const references: Reference[] = [
  // ---------------------------------------------------------------- principles
  {
    id: "rome-call",
    group: "principles",
    year: 2020,
    org: "Pontifical Academy for Life",
    title: {
      en: "Rome Call for AI Ethics",
      it: "Rome Call for AI Ethics (Appello di Roma per l'etica dell'IA)",
    },
    note: {
      en: "An appeal for an ethical approach to AI, built on transparency, inclusion, responsibility, impartiality, reliability, security and privacy. First signed in Rome in February 2020.",
      it: "Un appello per un approccio etico all'IA, fondato su trasparenza, inclusione, responsabilità, imparzialità, affidabilità, sicurezza e privacy. Firmato per la prima volta a Roma nel febbraio 2020.",
    },
    url: "https://www.romecall.org/",
    cited: ["principles", "equity-and-non-discrimination", "work"],
  },
  {
    id: "asilomar",
    group: "principles",
    year: 2017,
    org: "Future of Life Institute",
    title: {
      en: "Asilomar AI Principles",
      it: "Principi di Asilomar sull'intelligenza artificiale",
    },
    note: {
      en: "Twenty-three principles on research, ethics and long-term issues, drawn up by AI researchers; each was supported by at least 90% of the conference participants.",
      it: "Ventitré principi su ricerca, etica e questioni di lungo periodo, redatti da ricercatori di IA; ciascuno ha avuto il sostegno di almeno il 90% dei partecipanti alla conferenza.",
    },
    url: "https://futureoflife.org/open-letter/ai-principles/",
    cited: ["principles", "war-and-military", "future"],
  },
  {
    id: "antiqua-et-nova",
    group: "principles",
    year: 2025,
    org: "Holy See: Dicastery for the Doctrine of the Faith and Dicastery for Culture and Education",
    title: {
      en: "Antiqua et Nova: Note on the Relationship Between Artificial Intelligence and Human Intelligence",
      it: "Antiqua et Nova: Nota sul rapporto tra intelligenza artificiale e intelligenza umana",
    },
    note: {
      en: "A reflection on what distinguishes human intelligence from AI, and on its effects on education, work, health and war. It insists that AI should complement human intelligence and not replace it.",
      it: "Una riflessione su ciò che distingue l'intelligenza umana dall'IA e sui suoi effetti su educazione, lavoro, salute e guerra. Insiste sul fatto che l'IA debba integrare l'intelligenza umana e non sostituirla.",
    },
    url: "https://press.vatican.va/content/salastampa/en/bollettino/pubblico/2025/01/28/250128b.html",
    cited: ["principles", "war-and-military", "work", "health", "education"],
  },
  {
    id: "udhr",
    group: "principles",
    year: 1948,
    org: "United Nations General Assembly",
    title: {
      en: "Universal Declaration of Human Rights",
      it: "Dichiarazione universale dei diritti umani",
    },
    note: {
      en: "The common standard of human dignity and rights on which most later AI principles rest.",
      it: "Lo standard comune di dignità e diritti umani su cui poggiano la maggior parte dei successivi principi sull'IA.",
    },
    url: "https://www.un.org/en/about-us/universal-declaration-of-human-rights",
    cited: ["principles", "privacy-and-surveillance", "equity-and-non-discrimination"],
  },

  // --------------------------------------------------------- intergovernmental
  {
    id: "unesco",
    group: "intergovernmental",
    year: 2021,
    org: "UNESCO",
    title: {
      en: "Recommendation on the Ethics of Artificial Intelligence",
      it: "Raccomandazione sull'etica dell'intelligenza artificiale",
    },
    note: {
      en: "The first global standard-setting instrument on AI ethics, adopted by all UNESCO member states. Not binding, and grounded in human rights, dignity, fairness and sustainability.",
      it: "Il primo strumento normativo globale sull'etica dell'IA, adottato da tutti gli Stati membri dell'UNESCO. Non vincolante, fondato su diritti umani, dignità, equità e sostenibilità.",
    },
    url: "https://www.unesco.org/en/artificial-intelligence/recommendation-ethics",
    cited: ["principles", "human-control", "privacy-and-surveillance", "equity-and-non-discrimination", "environment"],
  },
  {
    id: "oecd",
    group: "intergovernmental",
    year: 2019,
    org: "OECD",
    title: {
      en: "OECD AI Principles (updated 2024)",
      it: "Principi OCSE sull'IA (aggiornati nel 2024)",
    },
    note: {
      en: "The first intergovernmental standard on AI, adopted in 2019 and updated in May 2024 to address general-purpose and generative AI.",
      it: "Il primo standard intergovernativo sull'IA, adottato nel 2019 e aggiornato a maggio 2024 per affrontare l'IA generativa e per uso generale.",
    },
    url: "https://oecd.ai/en/ai-principles",
    cited: ["governance", "training-and-limits", "truth-and-democracy"],
  },
  {
    id: "coe-convention",
    group: "intergovernmental",
    year: 2024,
    org: "Council of Europe",
    title: {
      en: "Framework Convention on Artificial Intelligence and Human Rights, Democracy and the Rule of Law (CETS 225)",
      it: "Convenzione quadro sull'intelligenza artificiale e i diritti umani, la democrazia e lo Stato di diritto (CETS 225)",
    },
    note: {
      en: "The first international legally binding treaty on AI, opened for signature on 5 September 2024.",
      it: "Il primo trattato internazionale giuridicamente vincolante sull'IA, aperto alla firma il 5 settembre 2024.",
    },
    url: "https://www.coe.int/en/web/artificial-intelligence/the-framework-convention-on-artificial-intelligence",
    cited: ["governance", "human-control", "truth-and-democracy"],
  },
  {
    id: "un-ga-78-265",
    group: "intergovernmental",
    year: 2024,
    org: "United Nations General Assembly",
    title: {
      en: "Resolution 78/265: Seizing the opportunities of safe, secure and trustworthy AI for sustainable development",
      it: "Risoluzione 78/265: Cogliere le opportunità di sistemi di IA sicuri e affidabili per lo sviluppo sostenibile",
    },
    note: {
      en: "Adopted without a vote on 21 March 2024. Promotes safe, secure and trustworthy AI that respects human rights and supports sustainable development.",
      it: "Adottata senza voto il 21 marzo 2024. Promuove un'IA sicura e affidabile che rispetti i diritti umani e sostenga lo sviluppo sostenibile.",
    },
    url: "https://digitallibrary.un.org/record/4043244/?ln=en",
    cited: ["resources-and-global-distribution", "governance"],
  },
  {
    id: "bletchley",
    group: "intergovernmental",
    year: 2023,
    org: "Countries attending the AI Safety Summit (United Kingdom)",
    title: {
      en: "The Bletchley Declaration",
      it: "La Dichiarazione di Bletchley",
    },
    note: {
      en: "Signed by 28 countries and the European Union. A shared understanding of the risks of frontier AI and of the particular responsibility of those who develop the most powerful systems.",
      it: "Firmata da 28 paesi e dall'Unione europea. Una comprensione condivisa dei rischi dell'IA di frontiera e della responsabilità particolare di chi sviluppa i sistemi più potenti.",
    },
    url: "https://www.gov.uk/government/publications/ai-safety-summit-2023-the-bletchley-declaration/the-bletchley-declaration-by-countries-attending-the-ai-safety-summit-1-2-november-2023",
    cited: ["governance", "training-and-limits", "future"],
  },

  // ----------------------------------------------------------------------- law
  {
    id: "eu-ai-act",
    group: "law",
    year: 2024,
    org: "European Union",
    title: {
      en: "Regulation (EU) 2024/1689 (Artificial Intelligence Act)",
      it: "Regolamento (UE) 2024/1689 (Legge sull'intelligenza artificiale)",
    },
    note: {
      en: "The EU's risk-based law on AI. Its obligations are being phased in and parts of the timetable have been postponed, so check the current consolidated version.",
      it: "La legge dell'UE sull'IA, basata sul rischio. Gli obblighi entrano in vigore gradualmente e parte del calendario è stata rinviata: consulta la versione consolidata aggiornata.",
    },
    url: "https://eur-lex.europa.eu/eli/reg/2024/1689/oj/eng",
    cited: ["governance", "truth-and-democracy", "privacy-and-surveillance", "training-and-limits", "work"],
  },
  {
    id: "imda-agentic",
    group: "law",
    year: 2026,
    org: "Infocomm Media Development Authority (Singapore)",
    title: {
      en: "Model AI Governance Framework for Agentic AI",
      it: "Quadro modello di governance dell'IA per l'IA agentica",
    },
    note: {
      en: "The first government framework designed specifically for AI agents, launched in January 2026 and updated in May 2026. Voluntary guidance on risks, human accountability and controls.",
      it: "Il primo quadro governativo pensato specificamente per gli agenti di IA, lanciato a gennaio 2026 e aggiornato a maggio 2026. Indicazioni volontarie su rischi, responsabilità umana e controlli.",
    },
    url: "https://www.imda.gov.sg/resources/press-releases-factsheets-and-speeches/factsheets/2026/updated-model-ai-governance-framework-for-agentic-ai",
    cited: ["ai-agents", "human-control"],
  },

  // -------------------------------------------------------------------- science
  {
    id: "iasr-2026",
    group: "science",
    year: 2026,
    org: "International AI Safety Report (chaired by Yoshua Bengio)",
    title: {
      en: "International AI Safety Report 2026",
      it: "Rapporto internazionale sulla sicurezza dell'IA 2026",
    },
    note: {
      en: "A scientific assessment of the capabilities and risks of advanced AI, written by more than a hundred experts. It groups risks into malicious use, malfunctions and systemic risks.",
      it: "Una valutazione scientifica di capacità e rischi dell'IA avanzata, scritta da oltre cento esperti. Raggruppa i rischi in uso malevolo, malfunzionamenti e rischi sistemici.",
    },
    url: "https://internationalaisafetyreport.org/publication/2026-report-executive-summary",
    cited: ["future", "human-control", "war-and-military", "ai-agents"],
  },
  {
    id: "who-ai-health",
    group: "science",
    year: 2021,
    org: "World Health Organization",
    title: {
      en: "Ethics and governance of artificial intelligence for health",
      it: "Etica e governance dell'intelligenza artificiale per la salute",
    },
    note: {
      en: "WHO guidance with six consensus principles, among them protecting human autonomy, transparency and explainability, and inclusiveness and equity.",
      it: "Linee guida dell'OMS con sei principi condivisi, tra cui tutela dell'autonomia umana, trasparenza e spiegabilità, inclusività ed equità.",
    },
    url: "https://www.who.int/publications/i/item/9789240029200",
    cited: ["health"],
  },
  {
    id: "icrc-aws",
    group: "science",
    year: 2021,
    org: "International Committee of the Red Cross",
    title: {
      en: "ICRC position on autonomous weapon systems",
      it: "Posizione del CICR sui sistemi d'arma autonomi",
    },
    note: {
      en: "Recommends new legally binding rules: ruling out unpredictable autonomous weapons, and prohibiting those designed or used to apply force against persons.",
      it: "Raccomanda nuove regole giuridicamente vincolanti: escludere le armi autonome imprevedibili e vietare quelle progettate o usate per applicare la forza contro le persone.",
    },
    url: "https://www.icrc.org/en/document/icrc-position-autonomous-weapon-systems",
    cited: ["war-and-military"],
  },
  {
    id: "gbf",
    group: "science",
    year: 2022,
    org: "Convention on Biological Diversity",
    title: {
      en: "Kunming-Montreal Global Biodiversity Framework",
      it: "Quadro globale per la biodiversità di Kunming-Montreal",
    },
    note: {
      en: "Four goals for 2050 and 23 targets for 2030, including conserving at least 30% of the world's land, inland waters and seas by 2030.",
      it: "Quattro obiettivi al 2050 e 23 traguardi al 2030, tra cui la tutela di almeno il 30% di terre, acque interne e mari entro il 2030.",
    },
    url: "https://www.cbd.int/gbf/goals",
    cited: ["nature-and-wildlife", "environment"],
  },
];