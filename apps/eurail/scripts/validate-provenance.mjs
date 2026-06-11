#!/usr/bin/env node
// Provenance validator (the "Evidence Provenance Guardian" as a build gate, D-003).
// Fails (exit 1) if any curated claim references an evidence id that doesn't exist in the
// ledger, or if the curated counts drift. Run: `node scripts/validate-provenance.mjs`.

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', 'src', 'corpus');
const read = (p) => JSON.parse(readFileSync(join(root, p), 'utf8'));

const evidence = read('raw/evidence.json');
const evidenceIds = new Set(evidence.map((e) => e.id));

const findings = read('findings.json');
const opportunities = read('opportunities.json');
const beats = read('beats.json');
const domains = read('domains.json');
const ladder = read('ladder.json');
const phasing = read('phasing.json');
const signals = read('signals.json');
const engagement = read('engagement.json');

const errors = [];
const warnings = [];

// ── 1. Every evidence_ids[].id must resolve to a real ledger record ──────────
function checkLinks(items, label, idField = 'evidence_ids') {
  for (const item of items) {
    const links = item[idField] ?? [];
    for (const link of links) {
      if (!evidenceIds.has(link.id)) {
        errors.push(`${label} "${item.number ?? item.id ?? item.name}" → unknown evidence id "${link.id}"`);
      }
    }
  }
}
checkLinks(findings, 'finding');
checkLinks(opportunities, 'opportunity');
checkLinks(beats, 'beat');

// ── 2. Orphan check: findings + opportunities must each carry >=1 evidence id ─
for (const f of findings) {
  if (!f.evidence_ids || f.evidence_ids.length === 0)
    errors.push(`finding ${f.number} has no evidence_ids (unsourced claim)`);
}
for (const o of opportunities) {
  if (!o.evidence_ids || o.evidence_ids.length === 0)
    warnings.push(`opportunity ${o.number} has no evidence_ids`);
}

// ── 3. Confidence labels must be from the allowed vocabulary ─────────────────
const LABELS = new Set(['DIRECT', 'INFERRED', 'ASSUMPTION']);
const LEVELS = new Set(['HIGH', 'MEDIUM', 'LOW']);
for (const f of findings) {
  for (const l of f.evidence_ids) {
    if (l.label && !LABELS.has(l.label)) errors.push(`finding ${f.number} bad label "${l.label}"`);
    if (l.confidence && !LEVELS.has(l.confidence)) errors.push(`finding ${f.number} bad confidence "${l.confidence}"`);
  }
}

// ── 4. Count integrity ────────────────────────────────────────────────────────
const counts = {
  domains: [domains.domains.length, 4],
  module_map: [domains.module_domain_map.length, 20],
  findings: [findings.length, 12],
  ladder: [ladder.layers.length, 5],
  opportunities: [opportunities.length, 8],
  phases: [phasing.length, 4],
  signals: [signals.signals.length, 6],
  engagement_modes: [engagement.modes.length, 3],
  trust_primitives: [engagement.trust_primitives.length, 4],
  three_asks: [engagement.three_asks.length, 3],
  beats: [beats.length, 15],
};
for (const [name, [got, want]] of Object.entries(counts)) {
  if (got !== want) errors.push(`count drift: ${name} = ${got}, expected ${want}`);
}

// ── 5. Finding domain tags must be valid ─────────────────────────────────────
const DOMAINS = new Set(['INT', 'USR', 'FED', 'MKT']);
for (const f of findings) if (!DOMAINS.has(f.domain)) errors.push(`finding ${f.number} bad domain "${f.domain}"`);

// ── Report ────────────────────────────────────────────────────────────────────
const linkCount = [...findings, ...opportunities, ...beats].reduce(
  (n, i) => n + (i.evidence_ids?.length ?? 0),
  0
);
console.log(`Provenance check — ${evidenceIds.size} evidence records, ${linkCount} curated links.`);
for (const w of warnings) console.log(`  ⚠ ${w}`);
if (errors.length) {
  console.error(`\n✗ ${errors.length} provenance error(s):`);
  for (const e of errors) console.error(`  ✗ ${e}`);
  process.exit(1);
}
console.log(`✓ All curated claims trace to real evidence; all counts correct.`);
