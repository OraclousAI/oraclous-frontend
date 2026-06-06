// Billing — plan + usage. There is no billing backend yet (ADR-009: the substrate emits usage events
// — item counts, tokens, bytes — and billing is a separable downstream consumer not yet built). So
// this page is honest: it shows the current plan from session context and a clear "metering coming,
// no charges" usage section, rather than fabricating spend/usage figures.
import type { CSSProperties } from 'react';
import { useDash } from '../context/dash.js';

const METERED: readonly { readonly label: string; readonly unit: string }[] = [
  { label: 'Knowledge ingestion', unit: 'documents & tokens processed' },
  { label: 'Retrieval queries', unit: 'searches & graph traversals' },
  { label: 'Agent executions', unit: 'tool runs' },
  { label: 'Storage', unit: 'graph nodes, edges & bytes' },
];

export default function BillingPage() {
  const { tenant } = useDash();
  const plan = tenant.plan.trim() !== '' ? tenant.plan : 'Free';

  return (
    <div style={styles.page}>
      <header style={styles.header}>
        <h1 style={styles.h1}>Billing</h1>
        <p style={styles.sub}>Your plan and usage.</p>
      </header>

      <section style={styles.card} aria-label="Current plan">
        <div style={styles.planTop}>
          <div style={styles.planInfo}>
            <span style={styles.eyebrow}>Current plan</span>
            <p style={styles.planName}>{plan}</p>
            <p style={styles.muted}>{tenant.name}</p>
          </div>
          <button type="button" style={styles.disabled} disabled aria-disabled="true">
            Manage plan
          </button>
        </div>
        <p style={styles.note}>
          Self-serve plan changes aren’t available yet — reach out to us to change your plan.
        </p>
      </section>

      <section style={styles.card} aria-label="Usage and metering">
        <h2 style={styles.h2}>Usage</h2>
        <p style={styles.banner} role="status">
          Usage metering is coming. The platform records usage at the substrate (item counts,
          tokens, and bytes); billing on top of it isn’t live yet, and{' '}
          <strong>no charges are being collected</strong>.
        </p>
        <ul style={styles.list}>
          {METERED.map((m) => (
            <li key={m.label} style={styles.row}>
              <div style={styles.rowMain}>
                <span style={styles.rowLabel}>{m.label}</span>
                <span style={styles.rowUnit}>{m.unit}</span>
              </div>
              <span style={styles.rowValue} aria-label="Not yet available">
                —
              </span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

const styles = {
  page: { display: 'grid', gap: 18, maxWidth: 720 },
  header: { display: 'grid', gap: 4 },
  h1: { margin: 0, fontSize: 22, fontWeight: 600, color: 'var(--ink, #0b1220)' },
  sub: { margin: 0, fontSize: 13.5, color: 'var(--mute, #65686f)' },
  h2: { margin: 0, fontSize: 15, fontWeight: 600, color: 'var(--ink, #0b1220)' },
  muted: { margin: 0, fontSize: 13, color: 'var(--mute, #65686f)' },
  card: {
    display: 'grid',
    gap: 12,
    padding: 20,
    background: 'var(--paper, #f4f4f2)',
    border: '1px solid var(--rule, #d7d6d2)',
    borderRadius: 12,
  },
  planTop: { display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 },
  planInfo: { display: 'grid', gap: 2 },
  eyebrow: {
    fontSize: 11,
    fontWeight: 600,
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    color: 'var(--mute, #65686f)',
  },
  planName: {
    margin: 0,
    fontSize: 20,
    fontWeight: 600,
    color: 'var(--ink, #0b1220)',
    textTransform: 'capitalize',
  },
  disabled: {
    padding: '8px 14px',
    fontSize: 13,
    fontWeight: 500,
    color: 'var(--mute, #65686f)',
    background: 'var(--paper-soft, #eceae5)',
    border: '1px solid var(--rule, #d7d6d2)',
    borderRadius: 8,
    cursor: 'not-allowed',
    whiteSpace: 'nowrap',
  },
  note: { margin: 0, fontSize: 12.5, color: 'var(--mute, #65686f)' },
  banner: {
    margin: 0,
    padding: '11px 13px',
    fontSize: 13,
    lineHeight: 1.5,
    color: 'var(--ink, #0b1220)',
    background: 'var(--paper-soft, #eceae5)',
    border: '1px solid var(--rule, #d7d6d2)',
    borderRadius: 8,
  },
  list: { listStyle: 'none', margin: 0, padding: 0, display: 'grid', gap: 2 },
  row: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    padding: '10px 2px',
    borderBottom: '1px solid var(--rule, #d7d6d2)',
  },
  rowMain: { display: 'grid', gap: 1 },
  rowLabel: { fontSize: 13.5, color: 'var(--ink, #0b1220)' },
  rowUnit: { fontSize: 12, color: 'var(--mute, #65686f)' },
  rowValue: {
    fontSize: 14,
    fontFamily: 'var(--font-mono, monospace)',
    color: 'var(--mute, #65686f)',
  },
} satisfies Record<string, CSSProperties>;
