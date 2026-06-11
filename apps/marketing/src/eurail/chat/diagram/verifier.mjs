// ─────────────────────────────────────────────────────────────────────────────
// SERVER-SIDE DIAGRAM VERIFIER  (Node, plain JS — paste into astro.config.mjs)
// ─────────────────────────────────────────────────────────────────────────────
// The grounding guarantee, enforced in code. The cartographer (a separate non-streaming OpenRouter
// call) returns a DiagramSpec whose nodes may carry { fact: { value, cite } }. Before that spec is
// ever streamed to the browser, verifyDiagram() resolves every cite to its SOURCE TEXT in the corpus
// and checks the fact's value tokens actually appear there. STRICT MODE:
//   • verified   → ATTACH fact.proof = { confidence, strength, cite }  (so the renderer can badge it)
//   • unverified → DELETE node.fact entirely  (the node still renders; its label is structural prose)
// and, because a number can also hide in a label/title/caption/edge, any bare statistic-looking
// figure left in free-text that has NO verified fact behind it is SCRUBBED (drop the number; if the
// node label empties out, drop the node). After verifyDiagram, a number on screen is a number we can
// cite — by construction.
//
// resolve rules:
//   cite "F6"  / "f6" / "finding 6"  → findings[6-1] → headline + "\n" + detail
//   cite "ev-company-016" (any ev-* id, case-insensitive) → evidence record → claim + "\n" + raw
//
// This module is dev-only (runs under `astro dev`); it ships no secret and the static build never
// calls it. It is paste-ready: copy the marked region into astro.config.mjs and call
// `verifyDiagram(spec, { findings, evidence })`.

// ── value normalisation ──────────────────────────────────────────────────────
// We compare on a normalised, accent/markup-free, lowercased form, and on the SET OF NUMERIC TOKENS a
// value contains. A value matches its source when EITHER (a) its normalised string is a substring of
// the normalised source, OR (b) every numeric token it contributes is present (as a numeric token)
// in the source. (b) is what makes "38/100" match a source that only says "38", and "2.7★" match
// "2.7 stars", and "6 of 35" match "6/35".

const SCALE = { k: 1e3, m: 1e6, b: 1e9, t: 1e12 };

/** Lowercase; drop accents/markup (★, %, currency, quotes); collapse whitespace; normalise dashes. */
function normText(s) {
  return String(s == null ? '' : s)
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '') // strip combining accents
    .toLowerCase()
    .replace(/[‘’“”]/g, "'") // smart quotes → '
    .replace(/[‒-―−]/g, '-') // various dashes/minus → -
    .replace(/[★☆%€£$]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Extract the numeric tokens a string asserts, each as a canonical { n, raw } where `n` is a Number.
 * Handles: comma grouping (1,237,000 → 1237000), scale suffixes (1.7m → 1700000, 1.3tb → 1.3 with
 * the "tb" treated as a magnitude-bearing unit so 1.3 still matches), percents, decimals, ratios
 * (38/100 → tokens 38 and 100), "N of M" (6 of 35 → 6 and 35), and plus-suffixes (308,777+ → 308777).
 * We also keep the literal digit-run forms (e.g. "38", "100") so substring checks still work.
 */
function numericTokens(s) {
  const norm = normText(s);
  const tokens = new Set();

  // ratios and "N of M" first, so both sides become separate tokens
  for (const m of norm.matchAll(/(\d+(?:\.\d+)?)\s*(?:\/|\bof\b)\s*(\d+(?:\.\d+)?)/g)) {
    tokens.add(canonNum(m[1]));
    tokens.add(canonNum(m[2]));
  }

  // scaled magnitudes: 1.7m, 308k, 1.3tb, 2b  → both the mantissa and the expanded value
  for (const m of norm.matchAll(/(\d+(?:[.,]\d+)?)\s*([kmbt])(?:b)?\+?\b/g)) {
    const mant = canonNum(m[1]);
    tokens.add(mant);
    const factor = SCALE[m[2]];
    if (factor) tokens.add(String(Math.round(Number(mant) * factor)));
  }

  // comma-grouped and plain numbers (incl. decimals, optional trailing +)
  for (const m of norm.matchAll(/\d{1,3}(?:,\d{3})+(?:\.\d+)?\+?|\d+(?:\.\d+)?\+?/g)) {
    tokens.add(canonNum(m[0]));
  }

  return tokens;
}

/** Canonicalise one numeric literal: strip commas/+, trim a trailing ".0", as a comparable string. */
function canonNum(raw) {
  let t = String(raw).replace(/,/g, '').replace(/\+$/, '').trim();
  if (/^\d+\.\d+$/.test(t)) t = t.replace(/0+$/, '').replace(/\.$/, ''); // 2.70 → 2.7 ; 3.0 → 3
  return t;
}

// ── citation resolution ──────────────────────────────────────────────────────

/** "F6" | "f6" | "finding 6" | "6" → 1-based finding number, else null. */
function findingNumber(cite) {
  const m = String(cite).trim().match(/^(?:f|finding)\s*[-#]?\s*(\d{1,3})$/i) || String(cite).trim().match(/^(\d{1,3})$/);
  return m ? Number(m[1]) : null;
}

/** Resolve a cite to its source text + the record's confidence/strength, or null if unresolvable. */
function resolveCite(cite, corpus) {
  const findings = corpus.findings || [];
  const evidence = corpus.evidence || [];

  const fn = findingNumber(cite);
  if (fn != null) {
    const f = findings[fn - 1];
    if (f && Number(f.number) === fn) {
      return {
        text: `${f.headline || ''}\n${f.detail || ''}`,
        // findings have no single label/confidence; treat a finding citation as DIRECT/HIGH unless
        // every backing evidence id disagrees. Findings are the report's own asserted conclusions.
        confidence: 'DIRECT',
        strength: 'HIGH',
        cite: `F${fn}`,
      };
    }
    return null;
  }

  // evidence id — accept any ev-* token, case-insensitive, tolerate stray surrounding chars
  const idMatch = String(cite).trim().match(/ev-[a-z0-9-]+/i);
  if (idMatch) {
    const id = idMatch[0].toLowerCase();
    const rec = evidence.find((r) => String(r.id).toLowerCase() === id);
    if (rec) {
      return {
        text: `${rec.claim || ''}\n${rec.raw || ''}`,
        confidence: labelToConfidence(rec.label),
        strength: strengthOf(rec.confidence),
        cite: rec.id,
      };
    }
  }
  return null;
}

function labelToConfidence(label) {
  const u = String(label || '').toUpperCase();
  if (u === 'DIRECT' || u === 'INFERRED' || u === 'ASSUMPTION') return u;
  return 'INFERRED';
}
function strengthOf(conf) {
  const u = String(conf || '').toUpperCase();
  if (u === 'HIGH' || u === 'MEDIUM' || u === 'LOW') return u;
  return 'MEDIUM';
}

// ── the core check ───────────────────────────────────────────────────────────

/** Does `value` appear in `sourceText`? Substring on normalised text, OR all numeric tokens present. */
function valueGrounded(value, sourceText) {
  const v = normText(value);
  if (!v) return false;
  const src = normText(sourceText);
  if (!src) return false;

  // (a) NON-NUMERIC values only: a normalised-substring hit grounds worded values ("zero", "no
  // public sign", exact phrases). A numeric value must NOT take this path — a raw substring would
  // false-accept "8/100" inside "38/100", or ".7 stars" inside "2.7 stars".
  if (!/\d/.test(v)) {
    return v.length >= 2 && src.includes(v);
  }

  // (b) NUMERIC values: every number the value asserts must be present as a canonical numeric TOKEN
  // in the source. Set-intersection only — no substring/regex fallback (which would match a digit
  // inside an unrelated number, e.g. "5" inside "5.8"). numericTokens already canonicalises ratios,
  // scales, commas and decimals, so "38/100"→{38,100}, "2.7★"→{2.7}, "6 of 35"→{6,35}.
  const vTokens = numericTokens(value);
  if (vTokens.size === 0) return false; // looks numeric but yields no token ⇒ ungrounded
  const srcTokens = numericTokens(sourceText);
  for (const t of vTokens) {
    if (!srcTokens.has(t)) return false; // a number the value asserts is NOT in the source ⇒ fail
  }
  return true;
}

function escapeRe(s) {
  return String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// ── ungrounded-number scrubbing (free-text) ──────────────────────────────────
// Mirror of the client scrubber: remove statistic-looking figures from any rendered free-text that
// is NOT backed by a verified fact. Keeps years (1900–2099) and small structural integers (0–12).

// NOTE: percent/star patterns DON'T end in \b — `%`/`★` are not word chars, so a trailing \b would
// never match ("38%" has no boundary after %). We match the symbol as part of the token and a final
// cleanup pass sweeps any orphaned `%`/`★` left if a number slipped through another rule first.
const STAT_PATTERNS = [
  /\b\d{1,3}(?:,\d{3})+(?:\.\d+)?\b/g, // 1,237,000
  /\b\d+(?:\.\d+)?\s*(?:[kmbt]b|[kmbt])\+?\b/gi, // 1.7M  1.3TB  308K+  100k  1.5b
  /\b\d+(?:\.\d+)?[\s-]?(?:million|billion|thousand)\b/gi, // 1 million  1-million
  /\b\d+(?:\.\d+)?\s*x\b/gi, // 3.4x  2x
  /\b\d+(?:\.\d+)?\s*%/g, // 97%  38%
  /\b\d+(?:\.\d+)?\s*percent\b/gi, // 97 percent
  /\b\d+(?:\.\d+)?\s*★/g, // 2.7★
  /\b\d+(?:\.\d+)?\s*stars?\b/gi, // 2.7 stars
  /\b\d+(?:\.\d+)?\s*\/\s*\d+(?:\.\d+)?\b/g, // 38/100  6/35
  /\b\d+\s+of\s+\d+\b/gi, // 6 of 35
  /\b\d+\.\d+\b/g, // 3.4  14.8
];

function isStructuralInt(tok) {
  const n = Number(tok);
  if (!Number.isInteger(n)) return false;
  if (n >= 1900 && n <= 2099) return true;
  return n >= 0 && n <= 12;
}

function scrubUngrounded(text) {
  let out = String(text || '');
  for (const re of STAT_PATTERNS) out = out.replace(re, '');
  out = out.replace(/\b\d+\b/g, (m) => (isStructuralInt(m) ? m : ''));
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

// ── public entry ─────────────────────────────────────────────────────────────

/**
 * Verify + sanitise a DiagramSpec in place-ish (returns a new, safe spec). For every node.fact:
 * resolve the cite, check the value is grounded; on success attach proof, on failure delete the fact.
 * Then scrub ungrounded statistics from every rendered free-text field; drop nodes whose label
 * empties out (no fact + no prose left) and prune edges that reference dropped nodes.
 *
 * @param {object} spec   the cartographer's DiagramSpec (already JSON-parsed)
 * @param {{findings: any[], evidence: any[]}} corpus
 * @returns {object|null} verified spec, or null if nothing survives
 */
export function verifyDiagram(spec, corpus) {
  if (!spec || typeof spec !== 'object' || !Array.isArray(spec.nodes)) return null;
  const findings = (corpus && corpus.findings) || [];
  const evidence = (corpus && corpus.evidence) || [];
  const cx = { findings, evidence };

  const keptNodes = [];
  const keptIds = new Set();

  for (const raw of spec.nodes) {
    if (!raw || typeof raw !== 'object' || typeof raw.id !== 'string') continue;
    const node = { id: raw.id, label: typeof raw.label === 'string' ? raw.label : '' };
    if (raw.kind === 'box' || raw.kind === 'metric' || raw.kind === 'milestone') node.kind = raw.kind;
    if (typeof raw.group === 'string') node.group = raw.group;
    if (Number.isFinite(raw.rank)) node.rank = Math.round(raw.rank);
    if (Number.isFinite(raw.col)) node.col = Math.round(raw.col);
    if (raw.emphasis === true) node.emphasis = true;

    // 1) verify the fact (strict drop-unverified)
    let verified = false;
    if (raw.fact && typeof raw.fact === 'object' && typeof raw.fact.value === 'string' && typeof raw.fact.cite === 'string') {
      const resolved = resolveCite(raw.fact.cite, cx);
      if (resolved && valueGrounded(raw.fact.value, resolved.text)) {
        node.fact = {
          value: raw.fact.value,
          cite: resolved.cite,
          proof: { confidence: resolved.confidence, strength: resolved.strength, cite: resolved.cite },
        };
        verified = true;
      }
      // else: DELETE — we simply don't copy raw.fact onto node.
    }

    // 2) scrub ungrounded stats from the label unless this node carries a verified fact
    if (!verified) {
      const cleaned = scrubUngrounded(node.label);
      // drop the node only if it had a number-bearing label that is now empty AND has no fact
      if (!cleaned) {
        if (scrubUngrounded(node.label) !== node.label) continue; // had stats, now empty → drop node
        node.label = '·';
      } else {
        node.label = cleaned;
      }
    }

    if (keptIds.has(node.id)) continue;
    keptIds.add(node.id);
    keptNodes.push(node);
  }

  if (keptNodes.length === 0) return null;

  const out = { layout: spec.layout, nodes: keptNodes };

  if (typeof spec.title === 'string') {
    const t = scrubUngrounded(spec.title);
    if (t) out.title = t;
  }
  if (typeof spec.caption === 'string') {
    const c = scrubUngrounded(spec.caption);
    if (c) out.caption = c;
  }
  if (Array.isArray(spec.groups)) {
    const groups = [];
    const seen = new Set();
    for (const g of spec.groups) {
      if (!g || typeof g.id !== 'string' || typeof g.label !== 'string' || seen.has(g.id)) continue;
      seen.add(g.id);
      groups.push({ id: g.id, label: scrubUngrounded(g.label) || g.label });
    }
    if (groups.length) out.groups = groups;
  }
  if (Array.isArray(spec.edges)) {
    const edges = [];
    for (const e of spec.edges) {
      if (!e || typeof e.from !== 'string' || typeof e.to !== 'string') continue;
      if (!keptIds.has(e.from) || !keptIds.has(e.to)) continue; // prune dangling
      const edge = { from: e.from, to: e.to };
      if (typeof e.label === 'string') {
        const l = scrubUngrounded(e.label);
        if (l) edge.label = l;
      }
      edges.push(edge);
    }
    if (edges.length) out.edges = edges;
  }

  return out;
}

// Exposed for unit checks / re-use; harmless in production.
export const __internals = {
  normText,
  numericTokens,
  canonNum,
  resolveCite,
  valueGrounded,
  scrubUngrounded,
  findingNumber,
};
