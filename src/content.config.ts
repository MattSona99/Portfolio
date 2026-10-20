// src/content.config.ts
// IMPORTANT: Astro only looks for this file directly in src/ (not in src/contents/).
import { defineCollection } from "astro:content";
import { glob, file } from "astro/loaders";
import { z } from "astro/zod";
import { CHAPTERS } from "./contents/manifest.config";

// Chapters: one MDX file per language, e.g. src/contents/manifest/en/1-principles.mdx
const manifest = defineCollection({
  loader: glob({ pattern: "*/*.mdx", base: "./src/contents/manifest" }),
  schema: z.object({
    chapter: z.enum(CHAPTERS), // same key in every language
    title: z.string(),
    summary: z.string(),
    priority: z.enum(["foundational", "high", "medium"]),
    tags: z.array(z.string()).default([]),
    related: z.array(z.enum(CHAPTERS)).default([]), // chapter keys, not numbers
    version: z.string().default("1.0"),
    updatedAt: z.coerce.date(),
    status: z.enum(["draft", "review", "published"]).default("draft"),
    // Only on translations: the English version this text was translated from.
    translatedFrom: z.string().optional(),
  }),
});

// The 10 axioms: one file, every language side by side.
const localized = z.object({
  en: z.string(),
  it: z.string().optional(),
});

const axioms = defineCollection({
  loader: file("src/contents/axioms.json"),
  schema: z.object({
    order: z.number(),
    title: localized,
    text: localized,
  }),
});

export const collections = { manifest, axioms };