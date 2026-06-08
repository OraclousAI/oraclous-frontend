/** Site-wide constants for SEO + JSON-LD. Single source of truth. */
export const SITE = {
  name: 'Oraclous',
  url: 'https://oraclous.com',
  description:
    "Oraclous is an open-source agentic AI platform where an organisation's people and AI Agents work as one governed fabric — ReBAC governance, bring-your-own-model, and portability via OHM.",
  // Keep byte-identical with the Organization schema description across the site.
  logo: 'https://oraclous.com/favicon.png', // TODO: replace with a real hosted square logo URL
  // Empty until a real 1200x630 image exists at public/og/default.png — BaseHead omits the
  // og:image/twitter:image tags rather than ship a 404 reference. Set this when the asset lands.
  defaultOgImage: '',
  // TODO: fill real handles, then they emit into Organization.sameAs (keyword-entity-map §4).
  sameAs: [] as string[],
} as const;
