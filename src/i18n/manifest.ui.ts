// src/i18n/manifest.ui.ts
// UI strings of the manifest page only (chapter texts live in the MDX files).
// If you prefer, merge it into ui.ts later: ui[lang].manifest = manifestUi[lang].
import type { Locale } from "../contents/manifest.config";

const en = {
  kicker: "Ethics and use of artificial intelligence",
  title: "AI Manifest",
  lede: "What AI should do, what it must never do, and how to prevent and fix the problems.",
  scroll: "Scroll to read",
  readPillars: "Read the pillars",
  readChapters: "Start reading",
  axioms: "The ten pillars",
  axiomsLede: "Ten sentences that every other chapter rests on.",
  chapter: "Chapter",
  chaptersLabel: "Chapters",
  updatedLabel: "Updated",
  index: "Index",
  toggleIndex: "Open or close the index",
  top: "Back to top",
  related: "Related chapters",
  fallbackNote: "Not translated yet: showing the English version.",
  status: { draft: "Draft", review: "In review", published: "Published" },
};

const it: typeof en = {
  kicker: "Etica e uso dell'intelligenza artificiale",
  title: "Manifesto sull'AI",
  lede: "Cosa l'AI dovrebbe fare, cosa non deve mai fare e come prevenire e risolvere i problemi.",
  scroll: "Scorri per leggere",
  readPillars: "Leggi i pilastri",
  readChapters: "Inizia a leggere",
  axioms: "I dieci pilastri",
  axiomsLede: "Dieci frasi su cui poggia ogni altro capitolo.",
  chapter: "Capitolo",
  chaptersLabel: "Capitoli",
  updatedLabel: "Aggiornato",
  index: "Indice",
  toggleIndex: "Apri o chiudi l'indice",
  top: "Torna su",
  related: "Capitoli collegati",
  fallbackNote: "Non ancora tradotto: versione inglese.",
  status: { draft: "Bozza", review: "In revisione", published: "Pubblicato" },
};

export const manifestUi: Record<Locale, typeof en> = { en, it };