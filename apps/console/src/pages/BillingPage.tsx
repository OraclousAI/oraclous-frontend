// Billing — plan + usage. There is no billing backend yet (ADR-009: the substrate emits usage events
// — item counts, tokens, bytes — and billing is a separable downstream consumer not yet built). So
// this page is honest: it shows the current plan from session context and a clear "metering coming,
// no charges" usage section, rather than fabricating spend/usage figures.
// Styled per the handoff billing.html (KPI/plan card + usage table treatment).
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
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-4)', maxWidth: 880 }}>
      <header className="page-head" style={{ marginBottom: 0 }}>
        <div>
          <span className="eyebrow">Cost transparency</span>
          <h1>Billing</h1>
          <p className="sub">Your plan and usage.</p>
        </div>
      </header>

      <section className="card" aria-label="Current plan">
        <div
          className="card-body"
          style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-3)' }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              justifyContent: 'space-between',
              gap: 'var(--sp-3)',
            }}
          >
            <div className="kpi" style={{ border: 'none', padding: 0 }}>
              <span className="l">Current plan</span>
              <span
                className="v"
                style={{ fontSize: 'var(--t-h3-size)', textTransform: 'capitalize' }}
              >
                {plan}
              </span>
              <span className="s">{tenant.name}</span>
            </div>
            <button type="button" className="btn" data-variant="secondary" disabled>
              Manage plan
            </button>
          </div>
          <p style={{ margin: 0, fontSize: 'var(--t-caption-size)', color: 'var(--mute)' }}>
            Self-serve plan changes aren’t available yet — reach out to us to change your plan.
          </p>
        </div>
      </section>

      <section className="card" aria-label="Usage and metering">
        <div className="card-head">
          <div className="h">
            <h2>Usage</h2>
            <span className="sub">Metered at the substrate · billing not live yet</span>
          </div>
        </div>
        <div
          className="card-body"
          style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-3)' }}
        >
          <p className="callout" role="status" style={{ margin: 0 }}>
            Usage metering is coming. The platform records usage at the substrate (item counts,
            tokens, and bytes); billing on top of it isn’t live yet, and{' '}
            <strong>no charges are being collected</strong>.
          </p>
          <div className="table">
            <div
              className="table-head"
              aria-hidden="true"
              style={{ gridTemplateColumns: '1fr auto' }}
            >
              <span>Meter</span>
              <span>This month</span>
            </div>
            {METERED.map((m) => (
              <div key={m.label} className="table-row" style={{ gridTemplateColumns: '1fr auto' }}>
                <span style={{ display: 'grid', gap: 1 }}>
                  <span>{m.label}</span>
                  <span className="mute" style={{ fontSize: 'var(--t-caption-size)' }}>
                    {m.unit}
                  </span>
                </span>
                <span className="mono mute" aria-label="Not yet available">
                  —
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
