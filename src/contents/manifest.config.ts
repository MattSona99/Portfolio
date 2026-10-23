// src/contents/manifest.config.ts
// Single source of truth for languages and chapter order.
// Reorder chapters here ONCE and every language follows.

export const LOCALES = ["en", "it"] as const;
export type Locale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: Locale = "en";

// Stable, language-neutral chapter keys, from most to least important.
// Never rename a key once published: it is used for links and cross-references.
export const CHAPTERS = [
  "principles",
  "human-control",
  "war-and-military",
  "responsible-use",
  "truth-and-democracy",
  "health",
  "work",
  "privacy-and-surveillance",
  "training-and-limits",
  "biotech-and-androids",
  "equity-and-non-discrimination",
  "environment",
  "resources-and-global-distribution",
  "education",
  "creativity-and-ip",
  "governance",
  "ai-agents",
  "nature-and-wildlife",
  "future",
] as const;

export type ChapterKey = (typeof CHAPTERS)[number];