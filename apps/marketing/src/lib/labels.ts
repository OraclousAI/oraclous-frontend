/** URL-segment → human label map (breadcrumbs + breadcrumb JSON-LD). */
export const SEG_LABELS: Record<string, string> = {
  platform: 'Platform',
  solutions: 'Solutions',
  'why-oraclous': 'Why Oraclous',
  security: 'Security',
  'open-source': 'Open Source',
  developers: 'Developers',
  pricing: 'Pricing',
  blog: 'Blog',
  glossary: 'Glossary',
  about: 'About',
  'how-it-works': 'How It Works',
};

export function titleCase(s: string): string {
  return s.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

export function segLabel(seg: string): string {
  return SEG_LABELS[seg] ?? titleCase(seg);
}
