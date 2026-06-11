import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

/**
 * WCAG AA scan (Gate 3) for a representative page of each marketing template,
 * run against the built static site served by `astro preview` (see playwright.config.ts).
 */
const PAGES = [
  '/', // home
  '/platform', // hub (fabric-mesh diagram)
  '/platform/byom', // model-swap diagram
  '/platform/harness-model', // harness-assembly diagram
  '/platform/compile', // compile-flow diagram
  '/platform/knowledge-graph', // knowledge-pipeline diagram
  '/platform/execution-scheduling', // run-timeline diagram
  '/platform/metering', // meter-bars diagram
  '/platform/mcp-widgets', // mcp-bridge diagram
  '/platform/portability', // portability-hub diagram
  '/platform/rebac-governance', // rebac-graph diagram
  '/security', // layer-stack diagram
  '/how-it-works', // handoff diagram
  '/solutions', // solutions hub
  '/solutions/operations', // solution
  '/glossary', // glossary index
  '/glossary/rebac', // glossary term
  '/honest-roadmap', // utility / trust page
  '/blog', // blog index
  '/blog/what-is-a-second-mind', // article
  '/eurail', // Eurail workspace (report canvas + onboarder dock behind the access gate)
];

for (const path of PAGES) {
  test(`WCAG AA: ${path}`, async ({ page }) => {
    await page.goto(path);
    const { violations } = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze();
    expect(violations, JSON.stringify(violations, null, 2)).toEqual([]);
  });
}
