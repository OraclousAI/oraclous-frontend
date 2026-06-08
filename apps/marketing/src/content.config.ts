import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

/**
 * Content stays canonical under `oraclous-frontend/marketing/` (the marketing team owns it);
 * the app reads it in place via a glob loader pointed outside the app dir.
 * See marketing-app-architecture.md §3.6.
 */

// Allowlist of JSON-LD types a page may declare. An unknown/typo'd type fails the build
// here rather than being silently dropped by the emitter (spec §3.2).
const SCHEMA_TYPES = [
  'Organization',
  'WebSite',
  'WebPage',
  'AboutPage',
  'SoftwareApplication',
  'SoftwareSourceCode',
  'Product',
  'Offer',
  'BreadcrumbList',
  'FAQPage',
  'HowTo',
  'ItemList',
  'Article',
  'TechArticle',
  'Blog',
  'Person',
  'DefinedTerm',
  'DefinedTermSet',
] as const;

const pages = defineCollection({
  loader: glob({ pattern: '**/*.md', base: '../../marketing/pages' }),
  schema: z
    .object({
      title: z.string(),
      meta_description: z.string().default(''),
      url: z.string().startsWith('/'),
      page_type: z.string().optional(),
      primary_persona: z.string().optional(),
      primary_query: z.string().optional(),
      secondary_queries: z.array(z.string()).default([]),
      schema: z.array(z.enum(SCHEMA_TYPES)).default(['BreadcrumbList']),
      primary_cta: z.string().optional(),
      secondary_cta: z.string().optional(),
      noindex: z.boolean().optional(),
      og_image: z.string().optional(),
      diagram: z
        .enum([
          'fabric-mesh',
          'handoff',
          'layer-stack',
          'rebac-graph',
          'harness-assembly',
          'model-swap',
          'compile-flow',
          'knowledge-pipeline',
          'run-timeline',
          'meter-bars',
          'mcp-bridge',
          'portability-hub',
        ])
        .optional(),
    })
    .passthrough(),
});

const blog = defineCollection({
  loader: glob({ pattern: '**/*.md', base: '../../marketing/blog' }),
  schema: z
    .object({
      title: z.string(),
      slug: z.string().optional(),
      url: z.string().optional(),
      meta_description: z.string().default(''),
      primary_query: z.string().optional(),
      secondary_queries: z.array(z.string()).default([]),
      schema: z.array(z.enum(SCHEMA_TYPES)).default(['Article', 'BreadcrumbList']),
      author: z.string().optional(),
      date_published: z.string().optional(),
      date_modified: z.string().optional(),
      category: z.string().optional(),
      reading_time: z.union([z.string(), z.number()]).optional(),
      noindex: z.boolean().optional(),
      og_image: z.string().optional(),
    })
    .passthrough(),
});

export const collections = { pages, blog };
