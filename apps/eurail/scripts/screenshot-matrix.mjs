#!/usr/bin/env node
// Capture each surface at the three real break-points for the UX-critic pass (D-006).
// Drives the system Chrome (channel:'chrome', fresh profile — no conflict with a running
// browser). Full-page + above-the-fold per device. Usage:
//   node scripts/screenshot-matrix.mjs <baseUrl> <outDir>
import { chromium } from '@playwright/test';
import { mkdirSync } from 'node:fs';

const base = (process.argv[2] ?? 'http://localhost:5185/eurail/').replace(/\/$/, '');
const outDir = process.argv[3] ?? '/tmp/eurail-shots';
mkdirSync(outDir, { recursive: true });

const DEVICES = [
  { name: 'mobile', width: 390, height: 844 },
  { name: 'tablet', width: 768, height: 1024 },
  { name: 'desktop', width: 1280, height: 900 },
];
const SURFACES = [
  { name: 'dashboard', path: '/' },
  { name: 'chat', path: '/chat' },
];

const browser = await chromium.launch({ channel: 'chrome' });
for (const d of DEVICES) {
  const ctx = await browser.newContext({ viewport: { width: d.width, height: d.height }, deviceScaleFactor: 2 });
  const page = await ctx.newPage();
  for (const s of SURFACES) {
    await page.goto(base + s.path, { waitUntil: 'networkidle' });
    await page.waitForTimeout(400);
    await page.screenshot({ path: `${outDir}/${s.name}-${d.name}-fold.png` });
    await page.screenshot({ path: `${outDir}/${s.name}-${d.name}-full.png`, fullPage: true });
    console.log(`captured ${s.name} @ ${d.name} (${d.width})`);
  }
  await ctx.close();
}
await browser.close();
console.log('matrix complete →', outDir);
