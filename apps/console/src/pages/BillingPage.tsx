// Billing — plan + estimated provider spend. The plan comes from session context; spend is the
// estimated BYOM provider cost from GET /v1/harnesses/spend (an estimate of the user's own model
// cost, not a platform charge — ADR-009: no platform billing is collected). Unpriced models show
// tokens only (never a fabricated $); pre-metering runs are noted, not costed.
// Styled per the handoff billing.html (KPI/plan card + usage table treatment).
import { useDash } from '../context/dash.js';
import { bucketSpend, formatUsd, useSpend } from '../lib/spend.js';

const nf = new Intl.NumberFormat('en-US');
const spendCols = { gridTemplateColumns: 'minmax(0, 1fr) auto auto auto' } as const;

export default function BillingPage() {
  const { tenant } = useDash();
  const plan = tenant.plan.trim() !== '' ? tenant.plan : 'Free';
  const { spend, isLoading: spendLoading, isError: spendError } = useSpend();
  const buckets = bucketSpend(spend);
  // Priced first (they carry $), then unpriced (tokens only).
  const rows = [...buckets.priced, ...buckets.unpriced];

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

      <section className="card" aria-label="Estimated provider spend">
        <div className="card-head">
          <div className="h">
            <h2>Estimated spend · this month</h2>
            <span className="sub">Your provider (BYOM) cost · not a platform charge</span>
          </div>
          {!spendLoading && !spendError && rows.length > 0 && (
            <span className="mono" style={{ fontSize: 'var(--t-h4-size)', fontWeight: 600 }}>
              {formatUsd(spend?.totalEstimatedUsd ?? 0)}
            </span>
          )}
        </div>
        <div
          className="card-body"
          style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-3)' }}
        >
          <p className="callout" style={{ margin: 0 }}>
            <span>
              These are <strong>estimates</strong> of your own model-provider spend (your BYOM
              keys), from token usage and public price cards —{' '}
              <strong>not charges from Oraclous</strong>. No platform charges are collected.
            </span>
          </p>

          {spendError ? (
            <p className="callout" data-tone="error" role="alert" style={{ margin: 0 }}>
              Couldn’t load spend. Please try again.
            </p>
          ) : spendLoading ? (
            <p className="mute" style={{ margin: 0, fontSize: 'var(--t-caption-size)' }}>
              Loading…
            </p>
          ) : rows.length === 0 ? (
            <p className="mute" style={{ margin: 0, fontSize: 'var(--t-dense-size)' }}>
              No costed agent runs this month — no spend to estimate yet.
            </p>
          ) : (
            <div className="table" role="table" aria-label="Estimated spend by model">
              <div className="table-head" role="row" style={spendCols}>
                <span role="columnheader">Model</span>
                <span role="columnheader" style={{ textAlign: 'right' }}>
                  Runs
                </span>
                <span role="columnheader" style={{ textAlign: 'right' }}>
                  Tokens
                </span>
                <span role="columnheader" style={{ textAlign: 'right' }}>
                  Est. cost
                </span>
              </div>
              {rows.map((m) => (
                <div key={m.model} className="table-row" role="row" style={spendCols}>
                  <span role="cell" className="mono" style={{ overflowWrap: 'anywhere' }}>
                    {m.model}
                    {!m.priced && (
                      <span className="chip chip-sm" style={{ marginLeft: 8 }}>
                        unpriced
                      </span>
                    )}
                  </span>
                  <span role="cell" className="mono" style={{ textAlign: 'right' }}>
                    {nf.format(m.executions)}
                  </span>
                  <span role="cell" className="mono mute" style={{ textAlign: 'right' }}>
                    {nf.format(m.inputTokens + m.outputTokens)}
                  </span>
                  <span
                    role="cell"
                    className="mono"
                    style={{ textAlign: 'right' }}
                    aria-label={m.priced ? undefined : 'no price card for this model'}
                  >
                    {m.priced && m.estimatedUsd !== null ? formatUsd(m.estimatedUsd) : '—'}
                  </span>
                </div>
              ))}
              <div className="table-row" role="row" style={{ ...spendCols, fontWeight: 600 }}>
                <span role="cell">Total</span>
                <span role="cell" className="mono" style={{ textAlign: 'right' }}>
                  {nf.format(
                    rows.reduce((n, m) => n + m.executions, 0) + buckets.preMeteringExecutions
                  )}
                </span>
                <span role="cell" className="mono" style={{ textAlign: 'right' }}>
                  {nf.format((spend?.totalInputTokens ?? 0) + (spend?.totalOutputTokens ?? 0))}
                </span>
                <span role="cell" className="mono" style={{ textAlign: 'right' }}>
                  {formatUsd(spend?.totalEstimatedUsd ?? 0)}
                </span>
              </div>
            </div>
          )}

          {buckets.preMeteringExecutions > 0 && (
            <p className="mute" style={{ margin: 0, fontSize: 'var(--t-caption-size)' }}>
              {nf.format(buckets.preMeteringExecutions)} earlier run
              {buckets.preMeteringExecutions === 1 ? '' : 's'} predate metering and aren’t costed.
            </p>
          )}
          {buckets.unpriced.length > 0 && (
            <p className="mute" style={{ margin: 0, fontSize: 'var(--t-caption-size)' }}>
              Unpriced models have no public price card yet — their tokens are shown, but not a
              dollar estimate.
            </p>
          )}
        </div>
      </section>
    </div>
  );
}
