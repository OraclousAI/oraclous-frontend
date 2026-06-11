// The Journey Architect — a pure function from a reader profile to an ordered list of beats.
// Deterministic (no LLM): the same profile always yields the same journey, per the handoff
// §3.3 rules — opening by disposition, spine by concern, depth/language by role, length by time,
// the ladder (B08) always present, a role-appropriate closing (B15) always last.
import type { DomainCode } from '../corpus/types.js';

export type Role = 'board' | 'technical' | 'commercial' | 'assurance';
export type Disposition = 'champion' | 'skeptic' | 'neutral';
export type TimeBudget = 'quick' | 'standard' | 'deep';

export interface Profile {
  role: Role;
  concern: DomainCode;
  disposition: Disposition;
  time: TimeBudget;
  question?: string | undefined;
}

export const DOMAIN_BEAT: Record<DomainCode, string> = {
  INT: 'B03',
  USR: 'B04',
  FED: 'B05',
  MKT: 'B06',
};

const TARGET: Record<TimeBudget, number> = { quick: 4, standard: 6, deep: 9 };

// Narrative running order; B15 is pinned last.
const NARR: Record<string, number> = {
  B01: 0, B02: 1, B07: 2,
  B03: 3, B04: 3, B05: 3, B06: 3,
  B08: 4, B09: 5, B10: 6, B11: 7, B12: 8, B13: 9, B14: 10, B15: 99,
};

// Q5 free-text → a beat to pin near the front, when it clearly matches.
function pinnedForQuestion(q: string | undefined): string | null {
  if (!q) return null;
  const s = q.toLowerCase();
  if (/(conflict|disagree|contradict)/.test(s)) return 'B14';
  if (/(evidence|proof|source|how do you know)/.test(s)) return 'B13';
  if (/(cost|roi|opportunit|invest|leverage)/.test(s)) return 'B09';
  if (/(when|timeline|phase|schedule|how long)/.test(s)) return 'B10';
  if (/(competitor|market|trainline|rival)/.test(s)) return 'B12';
  if (/(signal|measure|track|kpi|working)/.test(s)) return 'B11';
  return null;
}

export function journeyArchitect(p: Profile): string[] {
  const domainBeat = DOMAIN_BEAT[p.concern];
  const target = TARGET[p.time];
  const opening = p.disposition === 'skeptic' ? 'B13' : 'B01';

  // Priority-ordered candidate pool (after the guaranteed opening + domain + ladder).
  const extras: string[] = [];
  if (p.disposition === 'skeptic') extras.push('B14');
  if (p.disposition === 'neutral') extras.push('B02');
  if (p.disposition === 'champion') extras.push('B07');
  extras.push('B12'); // urgency tension — for everyone
  if (p.role === 'technical') extras.push('B09', 'B10', 'B11');
  if (p.role === 'commercial') extras.push('B09', 'B10');
  if (p.role === 'board') extras.push('B02');
  if (p.role === 'assurance') extras.push('B13', 'B14');
  // generic fillers to reach depth on long journeys
  extras.push('B09', 'B10', 'B02', 'B07', 'B11', 'B14', 'B13');

  const chosen: string[] = [];
  const add = (id: string | null) => {
    if (id && !chosen.includes(id) && chosen.length < target - 1) chosen.push(id);
  };

  add(opening);
  add(pinnedForQuestion(p.question)); // pinned Q5 beat near the front
  add(domainBeat);
  add('B08'); // ladder always
  for (const e of extras) {
    if (chosen.length >= target - 1) break;
    add(e);
  }

  // Order by narrative rank, then append the closing CTA last.
  const ordered = chosen.sort((a, b) => (NARR[a] ?? 50) - (NARR[b] ?? 50));
  ordered.push('B15');
  return ordered;
}

export const INTERVIEW = {
  role: {
    prompt: 'Your role',
    help: 'Sets the depth and which document voice leads.',
    options: [
      { value: 'board', label: 'Board / leadership' },
      { value: 'technical', label: 'Technical & strategy (CTO / architecture / DPO)' },
      { value: 'commercial', label: 'Commercial & partnership (C-suite / procurement)' },
      { value: 'assurance', label: 'Assurance & due-diligence (risk / DPO)' },
    ] as { value: Role; label: string }[],
  },
  concern: {
    prompt: 'What you most want to understand',
    help: 'Sets the domain that leads and gets the most depth.',
    options: [
      { value: 'INT', label: 'Inside the company (teams, operations)' },
      { value: 'USR', label: 'The customer experience' },
      { value: 'FED', label: 'The cooperative & data-sharing with operators' },
      { value: 'MKT', label: 'Market position & competition' },
    ] as { value: DomainCode; label: string }[],
  },
  disposition: {
    prompt: 'What would make this worth your time',
    help: 'Flips the opening — findings-first, proof-first, or framing-first.',
    options: [
      { value: 'champion', label: 'Build the case — I need to convince others' },
      { value: 'skeptic', label: "Pressure-test it — show me where it's weak" },
      { value: 'neutral', label: "Orient me — I'm new to this" },
    ] as { value: Disposition; label: string }[],
  },
  time: {
    prompt: 'How long you have',
    help: 'Controls the number and depth of beats.',
    options: [
      { value: 'quick', label: 'Quick (~5 min, headlines)' },
      { value: 'standard', label: 'Standard (~15 min)' },
      { value: 'deep', label: 'Deep (~30 min, with evidence)' },
    ] as { value: TimeBudget; label: string }[],
  },
} as const;
