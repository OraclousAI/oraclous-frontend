#!/usr/bin/env node
/**
 * Internal link-checker for the marketing static build.
 * Crawls apps/marketing/dist/**.html, collects every root-relative href, and asserts each
 * resolves to a built file (dir/index.html, file.html, or a static asset). Exits 1 on any
 * broken link — keeps the "0 broken internal links" guarantee enforced (build-spec §7).
 *
 * No browser, no network: deterministic and fast. (External-link checking can be layered on
 * later with a tool like linkinator/lychee; this guards the internal corpus, the prior failure.)
 *
 * Run after building: `pnpm --filter @oraclous/marketing build && pnpm link-check`
 */
import { readdirSync, statSync, readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const DIST = 'apps/marketing/dist';

if (!existsSync(DIST)) {
  console.error(
    `✗ ${DIST} not found — build the marketing app first (pnpm --filter @oraclous/marketing build).`
  );
  process.exit(1);
}

function walk(dir, acc = []) {
  for (const entry of readdirSync(dir)) {
    const p = join(dir, entry);
    if (statSync(p).isDirectory()) walk(p, acc);
    else if (p.endsWith('.html')) acc.push(p);
  }
  return acc;
}

function resolves(href) {
  if (href === '/') return existsSync(join(DIST, 'index.html'));
  const clean = href.replace(/\/$/, '');
  return (
    existsSync(join(DIST, clean, 'index.html')) ||
    existsSync(join(DIST, `${clean}.html`)) ||
    existsSync(join(DIST, clean))
  );
}

const pages = walk(DIST);
const hrefs = new Set();
for (const f of pages) {
  for (const m of readFileSync(f, 'utf8').matchAll(/href="(\/[^"#?]*)/g)) hrefs.add(m[1]);
}

const broken = [...hrefs].filter((h) => !resolves(h)).sort();
console.log(`Checked ${pages.length} pages, ${hrefs.size} distinct internal links.`);
if (broken.length) {
  console.error(`✗ ${broken.length} broken internal link target(s):`);
  for (const b of broken) console.error(`   ${b}`);
  process.exit(1);
}
console.log('✓ 0 broken internal links.');
