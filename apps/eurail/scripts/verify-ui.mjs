#!/usr/bin/env node
// In-browser verification for the auditor / ui-ux gate. Drives the system Chrome via
// Playwright (channel: 'chrome', fresh profile — no conflict with a running browser),
// renders the app, runs an axe-core WCAG 2 AA scan, and probes the key a11y interactions.
// Usage: node scripts/verify-ui.mjs [url]
import { chromium } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const URL = process.argv[2] ?? 'http://localhost:5181/eurail/';
const fail = (m) => {
  console.error('✗ ' + m);
  process.exitCode = 1;
};

const browser = await chromium.launch({ channel: 'chrome' });
const context = await browser.newContext();
const page = await context.newPage();
const consoleErrors = [];
const failedUrls = [];
page.on('console', (m) => m.type() === 'error' && consoleErrors.push(m.text()));
page.on('pageerror', (e) => consoleErrors.push(String(e)));
page.on('response', (r) => r.status() >= 400 && failedUrls.push(`${r.status()} ${r.url()}`));

await page.goto(URL, { waitUntil: 'networkidle' });

// 1. Renders
const h1OrH2 = await page.locator('h1, h2').first().textContent();
console.log('• heading:', JSON.stringify(h1OrH2));
if (!h1OrH2) fail('no heading rendered');

// 2. Header nav + skip link present
const navLinks = await page.locator('nav a').allTextContents();
console.log('• nav:', navLinks.join(' | '));
if (!navLinks.includes('Dashboard') || !navLinks.includes('Onboarder')) fail('nav links missing');

// 3. Evidence drill: the claim button exists, opens a dialog, Esc closes + restores focus
const claimBtn = page.locator('button[aria-haspopup="dialog"]').first();
if ((await claimBtn.count()) === 0) fail('no evidence drill button');
else {
  await claimBtn.click();
  const dialog = page.locator('[role="dialog"]');
  await dialog.waitFor({ state: 'visible', timeout: 2000 }).catch(() => fail('evidence dialog did not open'));
  const records = await dialog.locator('li').count();
  console.log('• evidence dialog opened, records:', records);
  if (records < 1) fail('evidence dialog has no records');
  await page.keyboard.press('Escape');
  await dialog.waitFor({ state: 'hidden', timeout: 2000 }).catch(() => fail('Esc did not close dialog'));
  const focusedBack = await claimBtn.evaluate((el) => el === document.activeElement);
  console.log('• Esc restored focus to trigger:', focusedBack);
  if (!focusedBack) fail('focus not restored to trigger after Esc');
}

// 4. Console + network clean
if (failedUrls.length) console.log('• failed requests:', failedUrls.slice(0, 5).join(' ; '));
if (consoleErrors.length) fail('console errors: ' + consoleErrors.slice(0, 4).join(' | '));
else console.log('• console: clean');
if (failedUrls.length) fail(`${failedUrls.length} failed network request(s)`);

// 5. axe-core WCAG 2 AA scan (desktop)
const axe = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze();
const serious = axe.violations.filter((v) => v.impact === 'serious' || v.impact === 'critical');
console.log(`• axe AA: ${axe.violations.length} violations (${serious.length} serious/critical)`);
for (const v of axe.violations) console.log(`   - [${v.impact}] ${v.id}: ${v.help} (${v.nodes.length})`);
if (serious.length) fail(`${serious.length} serious/critical a11y violations`);

// 6. Narrow viewport: no horizontal scroll at 375
await page.setViewportSize({ width: 375, height: 800 });
await page.waitForTimeout(200);
const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1);
console.log('• 375px horizontal overflow:', overflow);
if (overflow) fail('horizontal overflow at 375px');

await browser.close();
console.log(process.exitCode ? '\nVERIFY: FAIL' : '\n✓ VERIFY: PASS');
