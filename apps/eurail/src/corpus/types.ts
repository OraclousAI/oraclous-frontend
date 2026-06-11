// Corpus-context types — the curated narrative layer over the Eurail × Oraclous evidence
// ledger. Every curated claim links to evidence via `evidence_ids` (real ledger ids).
// Source of truth: Jahankohan/EURail v2 documents + the 600-record evidence ledger.

export type DomainCode = 'INT' | 'USR' | 'FED' | 'MKT';
export type ConfidenceLabel = 'DIRECT' | 'INFERRED' | 'ASSUMPTION';
export type ConfidenceLevel = 'HIGH' | 'MEDIUM' | 'LOW';

/** A single evidence record from the ledger (v2/05-evidence.jsonl). */
export interface EvidenceRecord {
  id: string;
  module: string;
  claim: string;
  source: {
    type: string;
    url: string;
    name: string;
    publication_date: string | null;
    fetch_date: string;
    language: string;
  };
  raw: string;
  label: ConfidenceLabel;
  confidence: ConfidenceLevel;
  dimensions: string[];
  ai_adoption_relevance: string;
  notes?: string;
}

/** A logged source-disagreement, all resolved. */
export interface ConflictRecord {
  id: string;
  topic: string;
  evidence_ids: string[];
  summary: string;
  explanation: string;
  resolution: 'RESOLVED' | 'PENDING';
  synthesis_note: string;
  addressed_in: string[];
}

/** A reference from a curated item to supporting ledger evidence. */
export interface EvidenceLink {
  id: string;
  label?: ConfidenceLabel;
  confidence?: ConfidenceLevel;
}

export interface Domain {
  code: DomainCode;
  name: string;
  covers: string;
  current_state: string;
  key_finding_numbers: number[];
  central_risk: string;
  central_opportunity: string;
}

export interface ModuleDomainEntry {
  module: string;
  domain: DomainCode;
  rationale: string;
  certainty: 'clear' | 'judgment-call';
}

export interface Finding {
  number: number;
  domain: DomainCode;
  headline: string;
  detail: string;
  page_ref: string;
  evidence_ids: EvidenceLink[];
}

export interface LadderLayer {
  level: number;
  name: string;
  tagline: string;
  description: string;
  in_window: boolean;
}

export interface FailureMode {
  shortcut: string;
  what_fails: string;
  instead: string;
}

export interface Opportunity {
  number: number;
  name: string;
  layers: string[];
  time_to_value: string;
  governance: string;
  domain: DomainCode;
  why: string;
  evidence_ids: EvidenceLink[];
}

export interface Phase {
  number: number;
  name: string;
  window: string;
  what_happens: string;
  success_state: string;
}

export interface Signal {
  number: number;
  name: string;
  why: string;
  checkpoints: string;
  green: string;
  amber: string;
  red: string;
}

export interface EngagementMode {
  name: 'Advisor' | 'Implementation contractor' | 'Hybrid';
  what_it_is: string;
  best_when: string;
  worst_when: string;
}

export interface TrustPrimitive {
  name: string;
  what: string;
}

export interface Ask {
  number: number;
  title: string;
  detail: string;
}

export type VisualArchetype =
  | 'headline'
  | 'timeline'
  | 'maturity'
  | 'split'
  | 'network'
  | 'comparison'
  | 'trajectory'
  | 'ladder'
  | 'ranked-matrix'
  | 'phasing'
  | 'gauge'
  | 'evidence-card'
  | 'conflict'
  | 'cta';

export type Disposition = 'champion' | 'skeptic' | 'neutral';

export interface Beat {
  id: string;
  title: string;
  domain_source: string;
  visual_archetype: VisualArchetype;
  prioritized_for: string;
  evidence_ids: EvidenceLink[];
}

export interface DocumentMeta {
  id: string;
  title: string;
  audience: string;
  pages: number;
  purpose: string;
  file: string;
}
