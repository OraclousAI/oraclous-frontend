import { SITE } from './site';
import { segLabel } from './labels';
import { parseFaq } from './faq';
import { stripInlineMarkdown } from './text';

/**
 * Build the JSON-LD objects a page declares via its `schema[]` front-matter.
 * Data comes only from front-matter, page body, and site constants — never user input
 * (the controlled `set:html` injection in SchemaJsonLd.astro relies on this). See §4.2.
 *
 * The allowlist of valid types is enforced in content.config.ts (z.enum), so an unknown
 * type fails the build rather than being silently dropped. Types that are intentionally
 * deferred to later phases (ItemList, Offer, SoftwareSourceCode, Person, DefinedTerm[Set])
 * are explicitly no-op'd below with a reason — never a silent skip.
 */

type Json = Record<string, unknown>;

interface BuildCtx {
  url: string;
  title: string;
  body: string;
  data: Record<string, unknown>;
}

function abs(path: string): string {
  return SITE.url + (path.startsWith('/') ? path : `/${path}`);
}

function isTbd(v: unknown): boolean {
  return typeof v !== 'string' || v.trim() === '' || /\[TBD/i.test(v);
}

export function buildBreadcrumb(url: string, title: string): Json {
  const segs = url.split('/').filter(Boolean);
  const items: { name: string; url: string }[] = [{ name: 'Home', url: `${SITE.url}/` }];
  let path = '';
  segs.forEach((seg, i) => {
    path += `/${seg}`;
    const isLast = i === segs.length - 1;
    items.push({ name: isLast ? title : segLabel(seg), url: SITE.url + path });
  });
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((it, idx) => ({
      '@type': 'ListItem',
      position: idx + 1,
      name: it.name,
      item: it.url,
    })),
  };
}

function buildOrganization(): Json {
  const org: Json = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: SITE.name,
    url: SITE.url,
    description: SITE.description,
    logo: SITE.logo,
  };
  if (SITE.sameAs.length) org.sameAs = SITE.sameAs;
  return org;
}

function buildWebSite(): Json {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: SITE.name,
    url: SITE.url,
    description: SITE.description,
  };
}

function buildSoftwareApplication(): Json {
  return {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: SITE.name,
    applicationCategory: 'BusinessApplication',
    operatingSystem: 'Web, Self-hosted, Cloud',
    description: SITE.description,
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
      description: 'Open source — free to self-host.',
    },
  };
}

function buildProduct(ctx: BuildCtx): Json {
  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: SITE.name,
    description: String(ctx.data.meta_description ?? SITE.description),
    brand: { '@type': 'Organization', name: SITE.name, url: SITE.url },
    url: abs(ctx.url),
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
      description: 'Open source — free to self-host. Cloud-hosted is usage-based (BYOM, no token markup).',
      url: abs(ctx.url),
    },
  };
}

function buildWebPage(ctx: BuildCtx, type: 'WebPage' | 'AboutPage'): Json {
  return {
    '@context': 'https://schema.org',
    '@type': type,
    name: ctx.title,
    description: String(ctx.data.meta_description ?? ''),
    url: abs(ctx.url),
    isPartOf: { '@type': 'WebSite', name: SITE.name, url: SITE.url },
  };
}

function buildFaqPage(body: string): Json | null {
  const faqs = parseFaq(body);
  if (!faqs.length) return null;
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((f) => ({
      '@type': 'Question',
      name: f.q,
      acceptedAnswer: { '@type': 'Answer', text: f.a },
    })),
  };
}

function buildArticle(ctx: BuildCtx, type: 'Article' | 'TechArticle'): Json {
  const { data, url, title } = ctx;
  const a: Json = {
    '@context': 'https://schema.org',
    '@type': type,
    headline: title,
    description: String(data.meta_description ?? ''),
    url: abs(url),
    mainEntityOfPage: abs(url),
    publisher: { '@type': 'Organization', name: SITE.name, url: SITE.url, logo: SITE.logo },
  };
  if (!isTbd(data.author)) a.author = { '@type': 'Person', name: String(data.author) };
  if (!isTbd(data.date_published)) a.datePublished = data.date_published;
  if (!isTbd(data.date_modified)) a.dateModified = data.date_modified;
  return a;
}

function buildBlog(ctx: BuildCtx): Json {
  return {
    '@context': 'https://schema.org',
    '@type': 'Blog',
    name: ctx.title,
    url: abs(ctx.url),
    description: String(ctx.data.meta_description ?? ''),
  };
}

/** Parse `## ` headings (and their first paragraph) into HowTo steps; FAQ section excluded. */
function parseSteps(body: string): { name: string; text: string }[] {
  const steps: { name: string; text: string }[] = [];
  let cur: { name: string; text: string } | null = null;
  for (const line of body.split('\n')) {
    const h = line.match(/^##\s+(.+?)\s*$/);
    if (h) {
      if (cur) steps.push(cur);
      const name = stripInlineMarkdown(h[1]);
      if (/frequently asked questions/i.test(name)) {
        cur = null;
        continue;
      }
      cur = { name, text: '' };
    } else if (cur && !cur.text) {
      const t = line.trim();
      if (t && !t.startsWith('#') && !t.startsWith('>') && !t.startsWith('|')) {
        cur.text = stripInlineMarkdown(t);
      }
    }
  }
  if (cur) steps.push(cur);
  return steps.filter((s) => s.name);
}

/** Valid only with a `step` array (Google requirement), so emit null when no steps parse. */
function buildHowTo(ctx: BuildCtx): Json | null {
  const steps = parseSteps(ctx.body);
  if (steps.length < 2) return null;
  return {
    '@context': 'https://schema.org',
    '@type': 'HowTo',
    name: ctx.title,
    description: String(ctx.data.meta_description ?? ''),
    step: steps.map((s, i) => ({
      '@type': 'HowToStep',
      position: i + 1,
      name: s.name,
      text: s.text || s.name,
    })),
  };
}

/** Map the declared `schema[]` to JSON-LD objects. BreadcrumbList is always emitted. */
export function buildSchemas(types: string[] | undefined, ctx: BuildCtx): Json[] {
  const out: (Json | null)[] = [];
  const wanted = new Set(types ?? []);
  wanted.add('BreadcrumbList');
  for (const t of wanted) {
    switch (t) {
      case 'BreadcrumbList':
        out.push(buildBreadcrumb(ctx.url, ctx.title));
        break;
      case 'Organization':
        out.push(buildOrganization());
        break;
      case 'WebSite':
        out.push(buildWebSite());
        break;
      case 'SoftwareApplication':
        out.push(buildSoftwareApplication());
        break;
      case 'Product':
        out.push(buildProduct(ctx));
        break;
      case 'WebPage':
        out.push(buildWebPage(ctx, 'WebPage'));
        break;
      case 'AboutPage':
        out.push(buildWebPage(ctx, 'AboutPage'));
        break;
      case 'FAQPage':
        out.push(buildFaqPage(ctx.body));
        break;
      case 'Article':
        out.push(buildArticle(ctx, 'Article'));
        break;
      case 'TechArticle':
        out.push(buildArticle(ctx, 'TechArticle'));
        break;
      case 'Blog':
        out.push(buildBlog(ctx));
        break;
      case 'HowTo':
        out.push(buildHowTo(ctx));
        break;
      // Intentionally deferred (not silent — enum keeps them valid so the build doesn't fail):
      case 'Offer': // nested inside Product/SoftwareApplication offers
      case 'Person': // nested inside Article.author
      case 'ItemList': // hub listings — needs child URLs; arrives with the glossary/index phase
      case 'SoftwareSourceCode': // needs the real GitHub repo URL (TODO in site.ts)
      case 'DefinedTerm':
      case 'DefinedTermSet': // arrive with the glossary phase (#6)
        break;
      default:
        // Unknown types are blocked by the z.enum in content.config.ts before reaching here.
        break;
    }
  }
  return out.filter((s): s is Json => s !== null);
}
