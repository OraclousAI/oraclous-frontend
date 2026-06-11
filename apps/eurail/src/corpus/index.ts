// Corpus-context layer — the single source of factual content for both surfaces.
// Curated narrative (evidence-linked) + the raw evidence ledger and conflict log.
// Counts: 4 domains · 12 findings · 5 ladder layers · 8 opportunities · 4 phases ·
// 6 signals · 3 engagement modes · 15 beats · 596 evidence records · 24 conflicts.

import type {
  Beat,
  ConflictRecord,
  Domain,
  DomainCode,
  DocumentMeta,
  EngagementMode,
  EvidenceRecord,
  Finding,
  LadderLayer,
  FailureMode,
  ModuleDomainEntry,
  Opportunity,
  Phase,
  Signal,
  TrustPrimitive,
  Ask,
} from './types.js';

import domainsData from './domains.json';
import findingsData from './findings.json';
import ladderData from './ladder.json';
import opportunitiesData from './opportunities.json';
import phasingData from './phasing.json';
import signalsData from './signals.json';
import engagementData from './engagement.json';
import beatsData from './beats.json';
import documentsData from './documents.json';
import evidenceData from './raw/evidence.json';
import conflictsData from './raw/conflicts.json';

export * from './types.js';

// ── Typed views over the JSON ────────────────────────────────────────────────
export const domains = domainsData.domains as Domain[];
export const moduleDomainMap = domainsData.module_domain_map as ModuleDomainEntry[];
export const findings = findingsData as Finding[];
export const ladder = ladderData.layers as LadderLayer[];
export const ladderOrderRationale = ladderData.order_rationale as string;
export const ladderFailureModes = ladderData.failure_modes as FailureMode[];
export const opportunities = opportunitiesData as Opportunity[];
export const phases = phasingData as Phase[];
export const signals = signalsData.signals as Signal[];
export const signalsEscalationRule = signalsData.escalation_rule as string;
export const engagementModes = engagementData.modes as EngagementMode[];
export const trustPrimitives = engagementData.trust_primitives as TrustPrimitive[];
export const threeAsks = engagementData.three_asks as Ask[];
export const beats = beatsData as Beat[];
export const documents = documentsData as DocumentMeta[];
export const evidence = evidenceData as unknown as EvidenceRecord[];
export const conflicts = conflictsData as ConflictRecord[];

// ── Indexes ──────────────────────────────────────────────────────────────────
const evidenceIndex = new Map<string, EvidenceRecord>(evidence.map((e) => [e.id, e]));
const moduleToDomain = new Map<string, DomainCode>(
  moduleDomainMap.map((m) => [m.module, m.domain])
);

// ── Accessors ─────────────────────────────────────────────────────────────────
export function evidenceById(id: string): EvidenceRecord | undefined {
  return evidenceIndex.get(id);
}

/** Resolve a list of evidence links to their full records (skips unknown ids). */
export function resolveEvidence(ids: { id: string }[]): EvidenceRecord[] {
  return ids.map((r) => evidenceIndex.get(r.id)).filter((e): e is EvidenceRecord => e != null);
}

export function domainOf(code: DomainCode): Domain | undefined {
  return domains.find((d) => d.code === code);
}

/** The domain a raw evidence record rolls up to, via the module→domain map. */
export function domainForEvidence(rec: EvidenceRecord): DomainCode | undefined {
  return moduleToDomain.get(rec.module);
}

export function findingsByDomain(code: DomainCode): Finding[] {
  return findings.filter((f) => f.domain === code);
}

export function opportunitiesByDomain(code: DomainCode): Opportunity[] {
  return opportunities.filter((o) => o.domain === code);
}

export function evidenceByDomain(code: DomainCode): EvidenceRecord[] {
  return evidence.filter((e) => moduleToDomain.get(e.module) === code);
}

/** Conflicts that reference a given evidence id. */
export function conflictsForEvidence(id: string): ConflictRecord[] {
  return conflicts.filter((c) => c.evidence_ids.includes(id));
}

export const evidenceModules: string[] = Array.from(new Set(evidence.map((e) => e.module))).sort();
export const evidenceSourceTypes: string[] = Array.from(
  new Set(evidence.map((e) => e.source.type))
).sort();

export const corpusStats = {
  domains: domains.length,
  findings: findings.length,
  ladderLayers: ladder.length,
  opportunities: opportunities.length,
  phases: phases.length,
  signals: signals.length,
  engagementModes: engagementModes.length,
  beats: beats.length,
  evidence: evidence.length,
  conflicts: conflicts.length,
  documents: documents.length,
} as const;
