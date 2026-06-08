import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { stripInlineMarkdown } from './text';

/**
 * Parses the canonical glossary (marketing/brand/glossary.md) into structured entries at build
 * time. The file is one `**Term** — **definition.** … Related: [A], [B].` paragraph per term;
 * it stays the single source of truth (spec §3.5). Runs in Node during the SSG build only.
 */

export interface RelatedTerm {
  name: string;
  slug: string;
}

export interface GlossaryEntry {
  term: string; // display name, e.g. "OHM (Oraclous Harness Manifest)"
  slug: string; // canonical URL slug
  aliases: string[]; // extra slugs that resolve to this entry (content links both forms)
  definition: string; // markdown-stripped definition body (the citable answer)
  related: RelatedTerm[];
}

// Where a term's natural slug isn't the one the content links to, pin the canonical slug here.
const SLUG_OVERRIDES: Record<string, string> = {
  'Platform-as-code, actors-as-harnesses': 'platform-as-code',
};

// Extra slugs that must also resolve to a given canonical slug (content uses both spellings).
const ALIASES: Record<string, string[]> = {
  'platform-as-code': ['platform-as-code-actors-as-harnesses'],
};

export function slugify(s: string): string {
  return s
    .toLowerCase()
    .replace(/\([^)]*\)/g, ' ') // drop parentheticals: "OHM (…)" → "ohm"
    .replace(/[/,]/g, ' ') // slashes/commas → space: "Provenance / audit" → "provenance audit"
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

// Resolve relative to the Astro project root (apps/marketing), matching the content glob loader's
// `base: '../../marketing/...'` convention. cwd is the package dir under pnpm filter/recursive runs.
const GLOSSARY_PATH = resolve(process.cwd(), '../../marketing/brand/glossary.md');

function parse(): GlossaryEntry[] {
  const raw = readFileSync(GLOSSARY_PATH, 'utf8');
  const entries: GlossaryEntry[] = [];
  for (const line of raw.split('\n')) {
    const m = line.match(/^\*\*(.+?)\*\*\s+—\s+(.+)$/);
    if (!m) continue;
    const term = m[1].trim();
    let body = m[2].trim();
    let related: RelatedTerm[] = [];
    const relIdx = body.search(/Related:\s*/);
    if (relIdx !== -1) {
      const relPart = body.slice(relIdx).replace(/^Related:\s*/, '');
      body = body.slice(0, relIdx).trim().replace(/\s*$/, '');
      related = [...relPart.matchAll(/\[([^\]]+)\]/g)].map((r) => ({
        name: r[1],
        slug: slugify(r[1]),
      }));
    }
    const slug = SLUG_OVERRIDES[term] ?? slugify(term);
    entries.push({
      term,
      slug,
      aliases: ALIASES[slug] ?? [],
      definition: stripInlineMarkdown(body),
      related,
    });
  }
  // keep only related links that point at terms that actually exist
  const known = new Set(entries.map((e) => e.slug));
  for (const e of entries) e.related = e.related.filter((r) => known.has(r.slug));
  return entries.sort((a, b) => a.term.localeCompare(b.term));
}

export const glossary: GlossaryEntry[] = parse();
export const glossaryBySlug: Map<string, GlossaryEntry> = new Map(
  glossary.map((e) => [e.slug, e]),
);
