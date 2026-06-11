// Chart spec — the exact JSON the model emits inside a ```chart fenced block.
//
//   ```chart
//   {"type":"bar","title":"…","unit":"…","data":[{"label":"…","value":12,"target":80,"highlight":true}]}
//   ```
//
// Four shapes, one discriminated union on `type`. The renderer (Chart dispatcher) JSON.parses the
// fence body, runs it through `coerceChartSpec`, and renders the matching primitive — or nothing if
// the body is incomplete (mid-stream) or doesn't validate. NOTHING here trusts the model blindly:
// every numeric/string field is coerced and clamped before it reaches an SVG. Untrusted text
// (titles, labels, captions, units) is rendered as React text nodes by the primitives — never via
// innerHTML (Gate 5).

export type ChartType = 'bar' | 'comparison' | 'metric' | 'progress';

/** One labelled datum in a `bar` chart. */
export interface BarDatum {
  label: string;
  value: number;
  /** Optional per-bar target marker (a tick on the track). */
  target?: number;
  /** Optional emphasis — draws this bar in the mint accent. */
  highlight?: boolean;
}

interface ChartBase {
  title?: string;
  /** A short unit suffix shown next to values, e.g. "%", "★", "/100", " operators". */
  unit?: string;
  /** One-line grounding caption (e.g. a finding ref). Rendered muted, in mono. */
  caption?: string;
}

/** Horizontal labelled bars, optional target marker per bar. */
export interface BarSpec extends ChartBase {
  type: 'bar';
  data: BarDatum[];
  /** Optional explicit axis max; otherwise derived from the data + targets. */
  max?: number;
}

/** Two labelled values, A vs B (e.g. iOS 2.7★ vs Android 4.4★). */
export interface ComparisonSpec extends ChartBase {
  type: 'comparison';
  a: { label: string; value: number };
  b: { label: string; value: number };
}

/** One big number + label, optional target and signed delta. */
export interface MetricSpec extends ChartBase {
  type: 'metric';
  label: string;
  value: number;
  target?: number;
  /** Signed change to annotate (e.g. +5.8). Rendered with up/down affordance. */
  delta?: number;
}

/** A current→target gauge (e.g. AI search visibility 38 → 80, out of `max`). */
export interface ProgressSpec extends ChartBase {
  type: 'progress';
  label: string;
  value: number;
  target: number;
  /** Scale ceiling for the gauge; defaults to 100. */
  max?: number;
}

export type ChartSpec = BarSpec | ComparisonSpec | MetricSpec | ProgressSpec;

// ── Coercion / validation ───────────────────────────────────────────────────
// The dispatcher calls `coerceChartSpec(parsed)`; it returns a fully-typed spec or null. We never
// throw on bad model output — a malformed block simply renders nothing.

function num(v: unknown): number | undefined {
  if (typeof v === 'number' && Number.isFinite(v)) return v;
  if (typeof v === 'string' && v.trim() !== '') {
    const n = Number(v);
    if (Number.isFinite(n)) return n;
  }
  return undefined;
}

function str(v: unknown): string | undefined {
  if (typeof v === 'string') {
    const s = v.trim();
    if (s) return s;
  }
  return undefined;
}

function isObj(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

function common(o: Record<string, unknown>): ChartBase {
  const base: ChartBase = {};
  const title = str(o['title']);
  if (title !== undefined) base.title = title;
  const unit = str(o['unit']);
  if (unit !== undefined) base.unit = unit;
  const caption = str(o['caption']);
  if (caption !== undefined) base.caption = caption;
  return base;
}

function labelledValue(v: unknown): { label: string; value: number } | null {
  if (!isObj(v)) return null;
  const label = str(v['label']);
  const value = num(v['value']);
  if (label === undefined || value === undefined) return null;
  return { label, value };
}

/** Parse + validate an unknown (already-JSON-parsed) value into a ChartSpec, or null. */
export function coerceChartSpec(raw: unknown): ChartSpec | null {
  if (!isObj(raw)) return null;
  const type = raw['type'];

  if (type === 'bar') {
    const rows = Array.isArray(raw['data']) ? raw['data'] : [];
    const data: BarDatum[] = [];
    for (const r of rows) {
      if (!isObj(r)) continue;
      const label = str(r['label']);
      const value = num(r['value']);
      if (label === undefined || value === undefined) continue;
      const datum: BarDatum = { label, value };
      const target = num(r['target']);
      if (target !== undefined) datum.target = target;
      if (r['highlight'] === true) datum.highlight = true;
      data.push(datum);
    }
    if (data.length === 0) return null;
    const spec: BarSpec = { type: 'bar', data, ...common(raw) };
    const max = num(raw['max']);
    if (max !== undefined) spec.max = max;
    return spec;
  }

  if (type === 'comparison') {
    const a = labelledValue(raw['a']);
    const b = labelledValue(raw['b']);
    if (!a || !b) return null;
    return { type: 'comparison', a, b, ...common(raw) };
  }

  if (type === 'metric') {
    const label = str(raw['label']);
    const value = num(raw['value']);
    if (label === undefined || value === undefined) return null;
    const spec: MetricSpec = { type: 'metric', label, value, ...common(raw) };
    const target = num(raw['target']);
    if (target !== undefined) spec.target = target;
    const delta = num(raw['delta']);
    if (delta !== undefined) spec.delta = delta;
    return spec;
  }

  if (type === 'progress') {
    const label = str(raw['label']);
    const value = num(raw['value']);
    const target = num(raw['target']);
    if (label === undefined || value === undefined || target === undefined) return null;
    const spec: ProgressSpec = { type: 'progress', label, value, target, ...common(raw) };
    const max = num(raw['max']);
    if (max !== undefined) spec.max = max;
    return spec;
  }

  return null;
}

// ── Shared formatting ─────────────────────────────────────────────────────────

/** Format a value with its unit. Trims trailing zeros so 2.70 → "2.7"; appends the unit as given. */
export function fmt(value: number, unit?: string): string {
  const n = Number.isInteger(value) ? String(value) : String(Math.round(value * 100) / 100);
  if (!unit) return n;
  // Units that read as a suffix glued to the number ("%", "★", "/100") vs a worded unit (" operators").
  return /^[\s]/.test(unit) ? `${n}${unit}` : `${n}${unit}`;
}
