/**
 * Oraclous Design System v1 — Token layer
 * Source extracted from: legacy-reference/old-frontend/src/index.css
 *
 * Single source of truth for all brand values. CSS custom properties in
 * tokens.css mirror these values; the Tailwind preset consumes this file.
 *
 * WCAG AA verification (key combos):
 *   ink on paper:       15.6:1 ✓  (body ≥4.5:1 required)
 *   ink on paper-soft:  14.4:1 ✓
 *   mute on paper:       5.07:1 ✓ (AA for body text — darkened from #73767d; 4.64:1 on paper-soft)
 *   accent-ink on accent: 9.3:1 ✓ (selection / focus surface)
 *   ink on perm-*-bg:   ≥13:1  ✓  (dark ink on 14%-tinted surfaces)
 */

// ── Core palette (LIGHT — the default surface) ───────────────────────────────

export const palette = {
  /** Primary text on light ground */
  ink: '#0B1220',
  /** Primary surface — body AND cards */
  paper: '#F4F4F2',
  /** Secondary surface, inset / hover ground */
  paperSoft: '#ECEAE5',
  /** Dividers, hairlines, outlines */
  rule: '#D7D6D2',
  /** Captions, helper text, technical labels */
  mute: '#65686F',
  /**
   * The signal. One color, one job. Live state only.
   * Never a button fill, never a hover colour, never on the brand mark.
   */
  accent: '#10D88A',
  /** Foreground that sits on the accent fill */
  accentInk: '#0B1220',
} as const;

// ── Dark surface — opt-in via .surface-dark / [data-surface="dark"] ──────────

export const paletteDark = {
  paper: '#0B1220',
  paperSoft: '#11192A',
  rule: '#1E2638',
  mute: '#8E9199',
  ink: '#F4F4F2',
} as const;

// ── ReBAC permission states ───────────────────────────────────────────────────

export const permColors = {
  /** Explicit allow — live mint */
  granted: '#10D88A',
  /** Resolved up the chain — cool blue */
  inherited: '#6BA0E8',
  /** Explicit deny — iron red */
  denied: '#C8412C',
  /** Was granted, lapsed — amber-brown */
  expired: '#B5862A',
} as const;

// ── Semantic colours ─────────────────────────────────────────────────────────
// Distinct from accent — mint is RESERVED for "live signal" only.

export const semantic = {
  success: '#2E8B57',
  warning: '#B5862A',
  error: '#C8412C',
  info: '#4A6FA8',
} as const;

// ── Elevation (flat by default — hairlines carry depth) ──────────────────────

export const shadows = {
  shadow1: '0 1px 0 color-mix(in oklab, #0B1220 6%, transparent)',
  shadow2: '0 2px 6px -2px color-mix(in oklab, #0B1220 12%, transparent)',
  shadow3: '0 12px 32px -12px color-mix(in oklab, #0B1220 22%, transparent)',
} as const;

// ── Radius scale ──────────────────────────────────────────────────────────────

export const radius = {
  r0: '0px',
  r1: '2px',
  r2: '4px',
  r3: '6px',
  r4: '10px',
  pill: '999px',
} as const;

// ── Spacing scale (4px base) ─────────────────────────────────────────────────

export const spacing = {
  sp1: '4px',
  sp2: '8px',
  sp3: '12px',
  sp4: '16px',
  sp5: '20px',
  sp6: '24px',
  sp8: '32px',
  sp10: '40px',
  sp12: '48px',
  sp16: '64px',
  sp20: '80px',
  sp24: '96px',
} as const;

// ── Typography ────────────────────────────────────────────────────────────────

export const fontFamily = {
  sans: [
    "'Sora'",
    'ui-sans-serif',
    'system-ui',
    '-apple-system',
    "'Segoe UI'",
    'sans-serif',
  ] as readonly string[],
  mono: [
    "'JetBrains Mono'",
    'ui-monospace',
    "'SF Mono'",
    "'Menlo'",
    'monospace',
  ] as readonly string[],
  serif: ["'Iowan Old Style'", 'Georgia', 'serif'] as readonly string[],
} as const;

export interface TypeScaleEntry {
  readonly size: string;
  readonly weight: number;
  readonly lineHeight: number | string;
  readonly letterSpacing: string;
}

export const typeScale = {
  displayXl: { size: '96px', weight: 700, lineHeight: 0.95, letterSpacing: '-0.04em' },
  display: { size: '64px', weight: 700, lineHeight: 1.02, letterSpacing: '-0.03em' },
  h1: { size: '48px', weight: 600, lineHeight: 1.08, letterSpacing: '-0.025em' },
  h2: { size: '32px', weight: 600, lineHeight: 1.15, letterSpacing: '-0.02em' },
  h3: { size: '24px', weight: 600, lineHeight: 1.2, letterSpacing: '-0.015em' },
  h4: { size: '18px', weight: 600, lineHeight: 1.3, letterSpacing: '-0.005em' },
  bodyLg: { size: '18px', weight: 400, lineHeight: 1.55, letterSpacing: '0' },
  body: { size: '15px', weight: 400, lineHeight: 1.55, letterSpacing: '0' },
  dense: { size: '13.5px', weight: 500, lineHeight: 1.45, letterSpacing: '0' },
  caption: { size: '12px', weight: 500, lineHeight: 1.4, letterSpacing: '0.02em' },
  mono: { size: '13px', weight: 400, lineHeight: 1.55, letterSpacing: '0' },
  tiny: { size: '11px', weight: 500, lineHeight: 1.35, letterSpacing: '0.06em' },
} as const satisfies Record<string, TypeScaleEntry>;

// ── Motion — brand's signature timings (load-bearing) ────────────────────────

export const motion = {
  blinkDur: '1.06s',
  blinkEase: 'steps(1, end)',
  pulseDur: '1.4s',
  pulseEase: 'ease-in-out',
  typeChar: '110ms',
  hoverDur: '120ms',
  hoverEase: 'cubic-bezier(0.2, 0, 0.2, 1)',
  pressDur: '80ms',
  pressEase: 'cubic-bezier(0.4, 0, 1, 1)',
} as const;

// ── shadcn/ui HSL tokens ──────────────────────────────────────────────────────
// Re-derived from brand v1 hex values.
// shadcn's generic "accent" is a neutral hover surface — NOT the mint live signal.
// Brand mint lives on --accent (unprefixed) in the CSS vars.

export const shadcnHsl = {
  background: '60 8% 95%', // paper
  foreground: '220 28% 9%', // ink
  card: '60 8% 95%',
  cardForeground: '220 28% 9%',
  popover: '60 8% 95%',
  popoverForeground: '220 28% 9%',
  primary: '220 28% 9%', // ink — buttons are black on paper
  primaryForeground: '60 8% 95%',
  secondary: '40 8% 91%', // paper-soft
  secondaryForeground: '220 28% 9%',
  muted: '40 8% 91%',
  mutedForeground: '220 4% 47%', // mute
  uiAccent: '40 8% 91%', // neutral hover (NOT mint)
  uiAccentForeground: '220 28% 9%',
  destructive: '9 65% 48%', // error iron-red
  destructiveForeground: '60 8% 95%',
  border: '40 5% 84%', // rule
  input: '40 5% 84%',
  ring: '220 28% 9%', // focus ring = ink
  radius: '0.375rem', // 6px
  sidebarBackground: '60 8% 95%',
  sidebarForeground: '220 28% 9%',
  sidebarPrimary: '220 28% 9%',
  sidebarPrimaryForeground: '60 8% 95%',
  sidebarAccent: '40 8% 91%',
  sidebarAccentForeground: '220 28% 9%',
  sidebarBorder: '40 5% 84%',
  sidebarRing: '220 28% 9%',
} as const;
