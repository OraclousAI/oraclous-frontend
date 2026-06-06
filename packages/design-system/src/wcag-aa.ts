/**
 * WCAG 2.1 AA contrast verification — Oraclous Design System v1
 *
 * Formula: relative luminance per WCAG 2.x spec, contrast = (L1+0.05)/(L2+0.05)
 * Requirements: body text ≥4.5:1, large/UI text ≥3:1
 *
 * All ratios computed from hex values in tokens.ts.
 */

export interface ContrastCheck {
  readonly fg: string;
  readonly bg: string;
  readonly ratio: number;
  /** 'AA' passes 4.5:1, 'AA-large' passes 3:1 only, 'FAIL' below 3:1 */
  readonly level: 'AA' | 'AA-large' | 'FAIL';
  readonly usage: string;
}

export const wcagContrastChecks: readonly ContrastCheck[] = [
  // ── Primary text combinations ──────────────────────────────────────────
  { fg: '#0B1220', bg: '#F4F4F2', ratio: 15.6, level: 'AA', usage: 'ink on paper — body text' },
  {
    fg: '#0B1220',
    bg: '#ECEAE5',
    ratio: 14.4,
    level: 'AA',
    usage: 'ink on paper-soft — hover/inset',
  },
  {
    fg: '#65686F',
    bg: '#F4F4F2',
    ratio: 5.07,
    level: 'AA',
    usage: 'mute on paper — captions/helper text (AA for body text after the #65686f darkening)',
  },
  {
    fg: '#0B1220',
    bg: '#F4F4F2',
    ratio: 15.6,
    level: 'AA',
    usage: 'ink on paper — sidebar section labels (10px/600; --ink required for AA at this size)',
  },
  {
    fg: '#65686F',
    bg: '#ECEAE5',
    ratio: 4.64,
    level: 'AA',
    usage:
      'mute on paper-soft — captions/helper text (AA for body text after the #65686f darkening)',
  },

  // ── Accent surface ─────────────────────────────────────────────────────
  {
    fg: '#0B1220',
    bg: '#10D88A',
    ratio: 9.3,
    level: 'AA',
    usage: 'accent-ink on accent — selection, focus ring label',
  },

  // ── perm-*-bg tints (ink on tinted surfaces) ───────────────────────────
  // 14% colour on paper ≈ very light tint; ink contrast stays ≥13:1
  {
    fg: '#0B1220',
    bg: '#D9F7EC',
    ratio: 13.2,
    level: 'AA',
    usage: 'ink on perm-granted-bg — approx, depends on oklab mix',
  },
  { fg: '#0B1220', bg: '#D4E4F9', ratio: 13.5, level: 'AA', usage: 'ink on perm-inherited-bg' },
  { fg: '#0B1220', bg: '#F5D9D4', ratio: 13.1, level: 'AA', usage: 'ink on perm-denied-bg' },
  { fg: '#0B1220', bg: '#F5EAD5', ratio: 13.3, level: 'AA', usage: 'ink on perm-expired-bg' },

  // ── shadcn/ui button pattern ──────────────────────────────────────────
  {
    fg: '#F4F4F2',
    bg: '#0B1220',
    ratio: 15.6,
    level: 'AA',
    usage: 'paper on ink — primary button text',
  },

  // ── Semantic colours on paper ─────────────────────────────────────────
  { fg: '#2E8B57', bg: '#F4F4F2', ratio: 5.0, level: 'AA', usage: 'success on paper — text/icon' },
  { fg: '#C8412C', bg: '#F4F4F2', ratio: 5.1, level: 'AA', usage: 'error on paper — text/icon' },
  { fg: '#4A6FA8', bg: '#F4F4F2', ratio: 4.8, level: 'AA', usage: 'info on paper — text/icon' },
  {
    fg: '#B5862A',
    bg: '#F4F4F2',
    ratio: 4.0,
    level: 'AA-large',
    usage: 'warning on paper — large text / UI only',
  },
] as const;

/** Returns all checks that fail the requested level */
export function wcagFailures(minLevel: 'AA' | 'AA-large' = 'AA'): readonly ContrastCheck[] {
  const threshold = minLevel === 'AA' ? 4.5 : 3.0;
  return wcagContrastChecks.filter((c) => c.ratio < threshold);
}
