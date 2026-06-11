// DiagramSpec — the exact JSON the cartographer emits inside a ```diagram fenced block, AFTER the
// server-side verifier has run over it (drop-unverified, strict). The browser renderer (<Diagram/>)
// JSON.parses the fence body and runs it through `coerceDiagramSpec`, which returns a fully-typed,
// clamped spec or null (incomplete mid-stream / malformed → render nothing).
//
// The GROUNDING GUARANTEE is enforced SERVER-SIDE (verifyDiagram, in astro.config.mjs): every
// `node.fact` that survives to this point has been resolved against its cited corpus record and its
// value-token verified to appear in that record's text; a `proof` block (confidence + source) is
// attached. This file is defence-in-depth, NOT the enforcer: `coerceDiagramSpec` DROPS any `fact`
// that lacks a well-formed `proof`, and scrubs bare statistic-looking numbers from free-text it
// renders (labels, titles, captions, group labels, edge labels). It trusts a present `proof` (it has
// no corpus to re-verify against), so the real "infer, don't guess" guarantee is the server verifier;
// the client only guards against proof-LESS facts and stray numbers in prose.
//
// Gate 5: nothing here or downstream injects raw HTML — every string below is rendered as a React
// text node by <Diagram/>. These types carry data, not markup.

// ── Public shape (the contract) ──────────────────────────────────────────────

export type DiagramLayout = 'layered' | 'flow' | 'timeline' | 'matrix' | 'network';
export const DIAGRAM_LAYOUTS: readonly DiagramLayout[] = [
  'layered',
  'flow',
  'timeline',
  'matrix',
  'network',
];

export type NodeKind = 'box' | 'metric' | 'milestone';
export const NODE_KINDS: readonly NodeKind[] = ['box', 'metric', 'milestone'];

/** Confidence the verifier attaches when a fact's value is found in its cited record's text. */
export type FactConfidence = 'DIRECT' | 'INFERRED' | 'ASSUMPTION';
export type FactStrength = 'HIGH' | 'MEDIUM' | 'LOW';

/**
 * A grounded figure on a node. `value` is the display string (e.g. "38/100", "2.7★", "97%").
 * `cite` is the corpus reference the cartographer chose ("F6" for finding 6, or an evidence id like
 * "ev-company-016"). `proof` is ATTACHED BY THE VERIFIER and is the certificate that `value` was
 * found in the cited record's text — a `fact` is only honoured by the renderer if `proof` is present
 * and well-formed.
 */
export interface NodeFact {
  value: string;
  cite: string;
  /** Attached server-side on successful verification. Absent ⇒ the renderer drops the whole fact. */
  proof?: FactProof;
}

export interface FactProof {
  confidence: FactConfidence;
  strength: FactStrength;
  /** The resolved citation (echoed, normalised) the value was matched against. */
  cite: string;
}

export interface DiagramGroup {
  id: string;
  label: string;
}

export interface DiagramNode {
  id: string;
  /** Structural prose. Bare statistic-looking numbers are scrubbed unless backed by a verified fact. */
  label: string;
  kind?: NodeKind;
  /** Group membership (must reference a `groups[].id`; dangling refs are dropped). */
  group?: string;
  /** Row/band index for layered/timeline/matrix layouts. */
  rank?: number;
  /** Column index for matrix/flow layouts. */
  col?: number;
  /** Draw with accent emphasis. */
  emphasis?: boolean;
  /** A grounded figure. Only rendered if `fact.proof` is present and well-formed. */
  fact?: NodeFact;
}

export interface DiagramEdge {
  from: string;
  to: string;
  label?: string;
}

export interface DiagramSpec {
  title?: string;
  caption?: string;
  layout: DiagramLayout;
  groups?: DiagramGroup[];
  nodes: DiagramNode[];
  edges?: DiagramEdge[];
}

// ── Coercion / validation (client-side, defensive) ───────────────────────────
// We never throw on bad input — a malformed block coerces to null and renders nothing. We never
// trust the value of any field: layouts/kinds are whitelisted, numbers clamped, ids de-duplicated,
// edges pruned to existing nodes, group refs pruned to existing groups, and — critically — any bare
// statistic-looking number in rendered free-text that is NOT carried by a verified `fact` is scrubbed.

const MAX_NODES = 60;
const MAX_EDGES = 120;
const MAX_GROUPS = 16;
const MAX_LABEL = 240;
const MAX_TITLE = 200;
const RANK_MIN = 0;
const RANK_MAX = 64;

function isObj(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

function str(v: unknown, max: number): string | undefined {
  if (typeof v !== 'string') return undefined;
  const s = v.trim();
  if (!s) return undefined;
  return s.length > max ? s.slice(0, max) : s;
}

function intIn(v: unknown, lo: number, hi: number): number | undefined {
  let n: number | undefined;
  if (typeof v === 'number' && Number.isFinite(v)) n = v;
  else if (typeof v === 'string' && v.trim() !== '' && Number.isFinite(Number(v))) n = Number(v);
  if (n === undefined) return undefined;
  n = Math.round(n);
  if (n < lo) n = lo;
  if (n > hi) n = hi;
  return n;
}

function oneOf<T extends string>(v: unknown, allowed: readonly T[]): T | undefined {
  return typeof v === 'string' && (allowed as readonly string[]).includes(v) ? (v as T) : undefined;
}

// A "bare statistic-looking number" = a free-standing figure a reader would treat as a claim:
// decimals (2.7), percents (97%), ratings (38/100, 2.7★), comma-grouped (1,237,000), scaled (1.7M,
// 1.3TB), "N of M". We DON'T scrub incidental small integers that are obviously structural — years
// (1900–2099), single-digit ordinals/counts ("Phase 2", "Wave 1", "3 steps"), or list markers — so
// labels stay readable. Anything that reads as a measured statistic is removed when ungrounded.
// NOTE: percent/star patterns DON'T end in \b — `%`/`★` are not word chars, so a trailing \b would
// never match ("38%" has no boundary after %). We match the symbol as part of the token and a final
// cleanup pass sweeps any orphaned `%`/`★` left if a number slipped through another rule first.
const STAT_PATTERNS: RegExp[] = [
  /\b\d{1,3}(?:,\d{3})+(?:\.\d+)?\b/g, // comma-grouped: 1,237,000  308,777
  /\b\d+(?:\.\d+)?\s*(?:[kmbt]b|[kmbt])\+?\b/gi, // scaled: 1.7M  1.3TB  308K+  2B  100k  1.5b
  /\b\d+(?:\.\d+)?[\s-]?(?:million|billion|thousand)\b/gi, // worded: 1 million  1-million
  /\b\d+(?:\.\d+)?\s*x\b/gi, // multiplier: 3.4x  2x
  /\b\d+(?:\.\d+)?\s*%/g, // percents: 97%  38%
  /\b\d+(?:\.\d+)?\s*percent\b/gi, // 97 percent
  /\b\d+(?:\.\d+)?\s*★/g, // ratings: 2.7★
  /\b\d+(?:\.\d+)?\s*stars?\b/gi, // 2.7 stars
  /\b\d+(?:\.\d+)?\s*\/\s*\d+(?:\.\d+)?\b/g, // ratios: 38/100  6/35
  /\b\d+\s+of\s+\d+\b/gi, // "6 of 35"
  /\b\d+\.\d+\b/g, // any remaining decimal: 3.4  14.8
];

// Structural integers we KEEP even when ungrounded (so "Phase 2", "Wave 1", "2026" survive).
function isStructuralInteger(token: string): boolean {
  const n = Number(token);
  if (!Number.isInteger(n)) return false;
  if (n >= 1900 && n <= 2099) return true; // a year
  if (n >= 0 && n <= 12) return true; // small ordinal/count (phases, waves, steps, quarters, months)
  return false;
}

/**
 * Remove ungrounded statistic-looking numbers from free-text. If a node carries a verified `fact`,
 * we leave its text alone (its figures are backed). Otherwise every STAT_PATTERN hit is stripped and
 * the leftover whitespace tidied; a label that becomes empty is replaced with a neutral placeholder
 * by the caller. Plain structural integers are preserved.
 */
export function scrubUngroundedNumbers(text: string, hasVerifiedFact: boolean): string {
  if (hasVerifiedFact) return text;
  let out = text;
  for (const re of STAT_PATTERNS) {
    out = out.replace(re, '');
  }
  // Strip stray standalone integers that are not structural (e.g. a lone "82" with no unit), but keep
  // years / small ordinals. Word-bounded so we don't touch digits inside surviving words.
  out = out.replace(/\b\d{1,}\b/g, (m) => (isStructuralInteger(m) ? m : ''));
  // Tidy artefacts left by removal: orphaned unit symbols, doubled spaces, brackets, dangling punctuation.
  out = out
    // orphaned unit symbols left when a number was stripped by another rule first (e.g. "38" gone → "%")
    .replace(/(^|[\s(])[%★/$€£]+/g, '$1')
    // a hyphen left dangling before a unit word when a decimal was removed (e.g. "4.4-star" → "-star")
    .replace(/(^|\s)[-–—](?=[A-Za-z])/g, '$1')
    .replace(/\(\s*\)/g, '')
    .replace(/\[\s*\]/g, '')
    .replace(/[ \t]{2,}/g, ' ')
    .replace(/\s+([,.;:])/g, '$1')
    .replace(/([(\[])\s+/g, '$1')
    .replace(/\s+([)\]])/g, '$1')
    .replace(/(?:^|\s)[–—-]\s*(?=$|[.,;:])/g, '')
    .replace(/[,;:]\s*$/g, '')
    .replace(/\s{2,}/g, ' ')
    .trim();
  return out;
}

function coerceProof(v: unknown): FactProof | null {
  if (!isObj(v)) return null;
  const confidence = oneOf(v['confidence'], ['DIRECT', 'INFERRED', 'ASSUMPTION'] as const);
  const strength = oneOf(v['strength'], ['HIGH', 'MEDIUM', 'LOW'] as const);
  const cite = str(v['cite'], 64);
  if (!confidence || !strength || !cite) return null;
  return { confidence, strength, cite };
}

/** A fact is honoured ONLY if it has a value, a cite, and a well-formed verifier proof. */
function coerceFact(v: unknown): NodeFact | null {
  if (!isObj(v)) return null;
  const value = str(v['value'], 80);
  const cite = str(v['cite'], 64);
  const proof = coerceProof(v['proof']);
  if (!value || !cite || !proof) return null; // unverified ⇒ no fact (drop-unverified, client mirror)
  return { value, cite, proof };
}

function coerceGroups(v: unknown): { groups: DiagramGroup[]; ids: Set<string> } {
  const groups: DiagramGroup[] = [];
  const ids = new Set<string>();
  if (!Array.isArray(v)) return { groups, ids };
  for (const g of v) {
    if (groups.length >= MAX_GROUPS) break;
    if (!isObj(g)) continue;
    const id = str(g['id'], 64);
    const label = str(g['label'], MAX_LABEL);
    if (!id || !label || ids.has(id)) continue;
    ids.add(id);
    groups.push({ id, label: scrubUngroundedNumbers(label, false) || label });
  }
  return { groups, ids };
}

function coerceNode(v: unknown, groupIds: Set<string>): DiagramNode | null {
  if (!isObj(v)) return null;
  const id = str(v['id'], 64);
  const rawLabel = str(v['label'], MAX_LABEL);
  if (!id || rawLabel === undefined) return null;

  const fact = coerceFact(v['fact']);
  const node: DiagramNode = { id, label: rawLabel };

  // Scrub ungrounded statistics from the label unless this node carries a verified fact.
  const cleaned = scrubUngroundedNumbers(rawLabel, !!fact);
  node.label = cleaned || (fact ? rawLabel : '·'); // never leave a blank box; neutral glyph if emptied

  const kind = oneOf(v['kind'], NODE_KINDS);
  if (kind) node.kind = kind;

  const group = str(v['group'], 64);
  if (group && groupIds.has(group)) node.group = group;

  const rank = intIn(v['rank'], RANK_MIN, RANK_MAX);
  if (rank !== undefined) node.rank = rank;

  const col = intIn(v['col'], RANK_MIN, RANK_MAX);
  if (col !== undefined) node.col = col;

  if (v['emphasis'] === true) node.emphasis = true;
  if (fact) node.fact = fact;

  return node;
}

function coerceEdges(v: unknown, nodeIds: Set<string>): DiagramEdge[] {
  const edges: DiagramEdge[] = [];
  if (!Array.isArray(v)) return edges;
  const seen = new Set<string>();
  for (const e of v) {
    if (edges.length >= MAX_EDGES) break;
    if (!isObj(e)) continue;
    const from = str(e['from'], 64);
    const to = str(e['to'], 64);
    if (!from || !to || !nodeIds.has(from) || !nodeIds.has(to)) continue; // prune dangling refs
    const key = `${from} ${to}`;
    if (seen.has(key)) continue;
    seen.add(key);
    const edge: DiagramEdge = { from, to };
    const label = str(e['label'], MAX_LABEL);
    if (label !== undefined) {
      const cleaned = scrubUngroundedNumbers(label, false); // edge labels carry no fact ⇒ always scrub
      if (cleaned) edge.label = cleaned;
    }
    edges.push(edge);
  }
  return edges;
}

/**
 * Parse + validate an unknown (already-JSON-parsed) value into a DiagramSpec, or null. Unknown
 * layouts, missing nodes, or a wholly-empty node set all coerce to null (render nothing). Everything
 * that survives is clamped, de-duplicated, and number-scrubbed — safe to hand straight to the SVG.
 */
export function coerceDiagramSpec(raw: unknown): DiagramSpec | null {
  if (!isObj(raw)) return null;

  const layout = oneOf(raw['layout'], DIAGRAM_LAYOUTS);
  if (!layout) return null; // unknown/missing layout → graceful nothing

  const { groups, ids: groupIds } = coerceGroups(raw['groups']);

  const rawNodes = Array.isArray(raw['nodes']) ? raw['nodes'] : [];
  const nodes: DiagramNode[] = [];
  const nodeIds = new Set<string>();
  for (const n of rawNodes) {
    if (nodes.length >= MAX_NODES) break;
    const node = coerceNode(n, groupIds);
    if (!node || nodeIds.has(node.id)) continue; // drop dupes
    nodeIds.add(node.id);
    nodes.push(node);
  }
  if (nodes.length === 0) return null; // nothing to draw

  const spec: DiagramSpec = { layout, nodes };

  const title = str(raw['title'], MAX_TITLE);
  if (title !== undefined) {
    const cleaned = scrubUngroundedNumbers(title, false); // title carries no fact ⇒ scrub
    if (cleaned) spec.title = cleaned;
  }
  const caption = str(raw['caption'], MAX_LABEL);
  if (caption !== undefined) {
    const cleaned = scrubUngroundedNumbers(caption, false);
    if (cleaned) spec.caption = cleaned;
  }

  if (groups.length) spec.groups = groups;

  const edges = coerceEdges(raw['edges'], nodeIds);
  if (edges.length) spec.edges = edges;

  return spec;
}

// ── Shared display helpers (used by <Diagram/> + its layouts) ─────────────────
// Centralised here so the SVG renderers and the aria-label sentence agree on confidence wording.

/** Short chip text for a verified fact's proof, e.g. "DIRECT·H". The WORD carries meaning, not colour. */
export function chipText(proof: FactProof): string {
  const s = proof.strength === 'HIGH' ? 'H' : proof.strength === 'MEDIUM' ? 'M' : 'L';
  return `${proof.confidence}·${s}`;
}

/**
 * Accent colour for a confidence chip. Graphical-object contrast (≥3:1) only — meaning is always
 * carried by the chip's WORD too, so colour is never the sole signal (WCAG 1.4.1). DIRECT = a measured
 * figure (success), INFERRED = reasoned (info), ASSUMPTION = weakest (warning).
 */
export function chipColor(c: FactConfidence): string {
  // --warning alone is ~2.73:1 on --bg-soft (below the 3:1 non-text floor), so darken the ASSUMPTION
  // accent toward --ink until it clears 3:1. DIRECT/INFERRED already pass.
  if (c === 'DIRECT') return 'var(--success)';
  if (c === 'INFERRED') return 'var(--info)';
  return 'color-mix(in oklab, var(--warning), var(--ink) 35%)';
}

/**
 * Verbalise a node for the diagram's aria-label: its label, plus — only when grounded — its value and
 * confidence. Never speaks a number that isn't verified (coerceDiagramSpec already scrubbed ungrounded
 * ones). Lives here (not in parts.tsx) so it's a pure helper, keeping the component file HMR-clean.
 */
export function speakNode(node: DiagramNode): string {
  const fact = node.fact;
  if (fact?.proof) {
    return `${node.label}, ${fact.value}, ${fact.proof.confidence.toLowerCase()} ${fact.proof.strength.toLowerCase()} confidence, cites ${fact.proof.cite}`;
  }
  return node.label;
}
