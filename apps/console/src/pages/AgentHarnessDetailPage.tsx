// Agent detail (Wave 1) — a saved OHM harness: hero + live KPI strip + tabbed sections
// (Runs default, Prompt / Tools / Config as read views of the manifest), per the handoff's
// agent-detail.html. Runs are durable engine jobs (submit → 202 → poll); selecting a run opens
// its output and the per-step provenance trace from the linked harness execution. Every number
// on this page is computed from real jobs — nothing is fabricated.
import { useMemo, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import type { Job, OhmManifest } from '@oraclous/api-client';
import { isJobTerminal } from '@oraclous/api-client';
import { Page } from '../components/shell/DashLayout.js';
import { isJobActive, useExecution, useHarnessAgent, useJobs, useSubmitJob } from '../lib/runs.js';
import './agent.css';

const TABS = ['runs', 'prompt', 'tools', 'config'] as const;
type Tab = (typeof TABS)[number];

function stateRowClass(state: string): string {
  if (state === 'SUCCEEDED') return 'run-row-ok';
  if (state === 'FAILED' || state === 'TIMED_OUT') return 'run-row-fail';
  if (state === 'ESCALATED' || state === 'CANCELLED') return 'run-row-warn';
  return 'run-row-live'; // QUEUED | RUNNING
}

function fmtTime(iso: string | null): string {
  if (iso === null) return '—';
  const t = Date.parse(iso);
  if (Number.isNaN(t)) return '—';
  return new Date(t).toLocaleString();
}

// The engine misclassifies manifest-validation failures as harness_unreachable (backend issue
// filed) — the message carries the real detail, so it is the only thing worth showing.
function jobFailureText(job: Job): string | null {
  if (job.errorMessage !== null && job.errorMessage !== '') return job.errorMessage;
  if (job.state === 'FAILED' || job.state === 'TIMED_OUT') return job.state;
  return null;
}

export default function AgentHarnessDetailPage() {
  const { capabilityId = '' } = useParams<{ capabilityId: string }>();
  const { agent, isLoading, isError } = useHarnessAgent(capabilityId);

  return (
    <Page>
      {isError ? (
        <div className="empty">
          <p>Couldn’t load this agent. It may have been deleted.</p>
          <Link to="/app/agents" className="btn" data-variant="ghost" data-size="sm">
            ← Agents
          </Link>
        </div>
      ) : isLoading || agent === null ? (
        <p className="t-caption" style={{ color: 'var(--mute)' }}>
          Loading…
        </p>
      ) : (
        <AgentView capabilityId={capabilityId} name={agent.name} manifest={agent.manifest} />
      )}
    </Page>
  );
}

function AgentView({
  capabilityId,
  name,
  manifest,
}: {
  capabilityId: string;
  name: string | null;
  manifest: OhmManifest | null;
}) {
  const [params, setParams] = useSearchParams();
  const rawTab = params.get('tab');
  const tab: Tab = (TABS as readonly string[]).includes(rawTab ?? '') ? (rawTab as Tab) : 'runs';

  const { jobs } = useJobs();
  // The engine list is org-wide — this agent's runs are the jobs submitted with its ref.
  const agentJobs = useMemo(
    () => jobs.filter((j) => j.manifestRef === capabilityId),
    [jobs, capabilityId]
  );
  const running = agentJobs.filter(isJobActive);
  const succeeded = agentJobs.filter((j) => j.state === 'SUCCEEDED');
  const lastRun = agentJobs[0] ?? null;

  const displayName = manifest?.metadata.name ?? name ?? 'Agent';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-3)' }}>
      <header className="agent-hero">
        <div className="ident">
          <span className="crumb">
            <Link to="/app/agents">agents</Link>
            <span className="sep" aria-hidden="true">
              /
            </span>
            <span>{displayName}</span>
          </span>
          <h1>
            {displayName}
            <span className="id-token" title={capabilityId}>
              {capabilityId.slice(0, 8)}
            </span>
            {running.length > 0 && (
              <span className="live-tag">
                <span className="dot" aria-hidden="true" />
                {running.length} running
              </span>
            )}
          </h1>
          {manifest?.metadata.description != null && manifest.metadata.description !== '' && (
            <p className="lede">{manifest.metadata.description}</p>
          )}
        </div>
        <div className="actions">
          <div className="row">
            <Link
              to={`/app/agents/harness/${capabilityId}/edit`}
              className="btn"
              data-variant="secondary"
              data-size="sm"
            >
              Edit manifest
            </Link>
          </div>
          {manifest !== null && <span className="ver">ohm {manifest.ohm_version}</span>}
        </div>
      </header>

      <div className="live-kpis" role="group" aria-label="Run statistics">
        <div className="col">
          <span className="l">Runs</span>
          <span className="v">{agentJobs.length}</span>
          <span className="s">engine, newest 50</span>
        </div>
        <div className="col">
          <span className="l">Succeeded</span>
          <span className="v">{succeeded.length}</span>
          <span className="s is-ok">
            {agentJobs.length - succeeded.length - running.length} failed/other
          </span>
        </div>
        <div className="col">
          <span className="l">
            {running.length > 0 && <span className="dot" aria-hidden="true" />}
            Running now
          </span>
          <span className="v">{running.length}</span>
          <span className="s">{running.length > 0 ? 'polling · 2s' : 'idle'}</span>
        </div>
        <div className="col">
          <span className="l">Last run</span>
          <span className="v" style={{ fontSize: 'var(--t-dense-size)' }}>
            {lastRun !== null ? fmtTime(lastRun.createdAt) : '—'}
          </span>
          <span className="s">{lastRun?.state ?? 'never run'}</span>
        </div>
      </div>

      <nav className="tabs" aria-label="Agent sections">
        {TABS.map((t) => (
          <button
            type="button"
            key={t}
            data-active={tab === t ? '' : undefined}
            onClick={() => setParams(t === 'runs' ? {} : { tab: t }, { replace: true })}
          >
            {t === 'runs' ? 'Runs' : t === 'prompt' ? 'Prompt' : t === 'tools' ? 'Tools' : 'Config'}
            {t === 'runs' && agentJobs.length > 0 && (
              <span className="count">{agentJobs.length}</span>
            )}
          </button>
        ))}
      </nav>

      {tab === 'runs' && <RunsTab capabilityId={capabilityId} jobs={agentJobs} />}
      {tab === 'prompt' && <PromptTab manifest={manifest} />}
      {tab === 'tools' && <ToolsTab manifest={manifest} />}
      {tab === 'config' && <ConfigTab manifest={manifest} />}
    </div>
  );
}

// ── Runs: trigger + table + the results/provenance drawer ───────────────────
function RunsTab({ capabilityId, jobs }: { capabilityId: string; jobs: readonly Job[] }) {
  const submit = useSubmitJob();
  const [input, setInput] = useState('');
  const [openJobId, setOpenJobId] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const openJob = jobs.find((j) => j.id === openJobId) ?? null;

  async function onRun() {
    const text = input.trim();
    if (text === '' || submit.isPending) return;
    setSubmitError(null);
    try {
      const job = await submit.mutateAsync({ manifestRef: capabilityId, input: text });
      setInput('');
      setOpenJobId(job.id);
    } catch {
      setSubmitError('Couldn’t submit the run. Please try again.');
    }
  }

  return (
    <section className="sec" aria-label="Runs">
      <div className="run-trigger">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') void onRun();
          }}
          placeholder="Input for the agent — what should this run do?"
          aria-label="Run input"
        />
        <button
          type="button"
          className="btn"
          data-variant="primary"
          data-size="sm"
          onClick={() => void onRun()}
          disabled={submit.isPending || input.trim() === ''}
        >
          {submit.isPending ? 'Submitting…' : 'Run'}
        </button>
      </div>
      {submitError !== null && (
        <p
          role="alert"
          className="t-caption"
          style={{ color: 'var(--error)', padding: '8px 20px', margin: 0 }}
        >
          {submitError}
        </p>
      )}

      {jobs.length === 0 ? (
        <div className="empty" style={{ border: 'none' }}>
          <p>No runs yet. Give the agent an input above and run it.</p>
        </div>
      ) : (
        <div className="run-table" role="table" aria-label="Run history">
          <div role="row" style={{ display: 'contents' }}>
            <span className="run-th" role="columnheader" aria-label="Status" />
            <span className="run-th" role="columnheader">
              Input
            </span>
            <span className="run-th" role="columnheader">
              State
            </span>
            <span className="run-th" role="columnheader">
              Progress
            </span>
            <span className="run-th" role="columnheader">
              Started
            </span>
          </div>
          {jobs.map((j) => (
            <div role="row" className={`run-row ${stateRowClass(j.state)}`} key={j.id}>
              <span className="run-td" role="cell">
                <span className="s" aria-hidden="true" />
              </span>
              <span className="run-td" role="cell">
                <button
                  type="button"
                  onClick={() => setOpenJobId(openJobId === j.id ? null : j.id)}
                  aria-expanded={openJobId === j.id}
                  title={j.inputText}
                >
                  {j.inputText}
                </button>
              </span>
              <span className="run-td" role="cell">
                {j.state}
              </span>
              <span className="run-td mute" role="cell">
                {isJobTerminal(j.state) ? '—' : `${j.progress}%`}
              </span>
              <span className="run-td mute" role="cell">
                {fmtTime(j.createdAt)}
              </span>
            </div>
          ))}
        </div>
      )}

      {openJob !== null && <RunDetail job={openJob} />}
    </section>
  );
}

// Output + per-step provenance for one run. The engine job carries the outcome; the linked
// harness execution carries the step trace (llm / tool / gate, in loop order).
function RunDetail({ job }: { job: Job }) {
  const { execution, isLoading } = useExecution(job.harnessExecutionId);
  const failure = jobFailureText(job);

  return (
    <div className="run-detail">
      <div className="sec-h">
        <div className="t">
          <h2>Run {job.id.slice(0, 8)}</h2>
          <span className="sub">
            {job.state}
            {execution !== null && ` · ${execution.iterations} iterations`}
            {execution !== null &&
              execution.totalTokens > 0 &&
              ` · ${execution.totalTokens} tokens`}
          </span>
        </div>
      </div>
      {failure !== null && (
        <p
          role="alert"
          className="t-caption"
          style={{ color: 'var(--error)', padding: '10px 20px', margin: 0 }}
        >
          {failure}
        </p>
      )}
      {job.output !== null && job.output !== '' && <pre className="out">{job.output}</pre>}
      {job.harnessExecutionId === null ? (
        <p className="t-caption" style={{ color: 'var(--mute)', padding: '10px 20px', margin: 0 }}>
          {isJobTerminal(job.state)
            ? 'No execution trace was recorded for this run.'
            : 'The step trace appears when the run completes.'}
        </p>
      ) : isLoading ? (
        <p className="t-caption" style={{ color: 'var(--mute)', padding: '10px 20px', margin: 0 }}>
          Loading trace…
        </p>
      ) : execution !== null ? (
        <div role="list" aria-label="Run steps">
          {execution.steps.map((s) => (
            <div
              role="listitem"
              className={`step-row${s.status === 'error' ? ' is-error' : ''}`}
              key={s.index}
            >
              <span className="ix">{String(s.index).padStart(2, '0')}</span>
              <span className="kind">{s.kind}</span>
              <span className="nm">
                {s.name}
                {s.detail !== null && s.detail !== '' && <span className="detail">{s.detail}</span>}
              </span>
              <span className="st">{s.status}</span>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}

// ── Read views of the manifest ───────────────────────────────────────────────
function PromptTab({ manifest }: { manifest: OhmManifest | null }) {
  const prompts = manifest?.prompts ?? [];
  return (
    <section className="sec" aria-label="System prompt">
      {prompts.length === 0 ? (
        <div className="empty" style={{ border: 'none' }}>
          <p>This agent has no prompts. Add one in the manifest editor.</p>
        </div>
      ) : (
        prompts.map((p, i) => (
          <div key={i}>
            <pre className="prompt-block">{p.body ?? ''}</pre>
            <div className="prompt-meta">
              <span>role: {p.role}</span>
              <span>source: {p.source ?? 'inline'}</span>
              <span className="spacer" />
              <span>{(p.body ?? '').length} chars</span>
            </div>
          </div>
        ))
      )}
    </section>
  );
}

function ToolsTab({ manifest }: { manifest: OhmManifest | null }) {
  const caps = manifest?.capabilities ?? [];
  const entrypoint = manifest?.runtime.entrypoint ?? null;
  return (
    <section className="sec" aria-label="Tools">
      {caps.length === 0 ? (
        <div className="empty" style={{ border: 'none' }}>
          <p>No tools bound. This agent runs on prompts alone.</p>
        </div>
      ) : (
        caps.map((c, i) => (
          <div className="tool-row" key={c.binding}>
            <span className="ix">{String(i + 1).padStart(2, '0')}</span>
            <span className="body">
              <span className="nm">
                {c.binding}
                <span className="src">{c.ref}</span>
              </span>
              {c.config !== undefined && Object.keys(c.config).length > 0 && (
                <span className="dx">{Object.keys(c.config).join(' · ')}</span>
              )}
            </span>
            {c.binding === entrypoint && <span className="scope">entrypoint</span>}
          </div>
        ))
      )}
    </section>
  );
}

function ConfigTab({ manifest }: { manifest: OhmManifest | null }) {
  if (manifest === null) {
    return (
      <section className="sec" aria-label="Configuration">
        <div className="empty" style={{ border: 'none' }}>
          <p>The saved manifest couldn’t be read.</p>
        </div>
      </section>
    );
  }
  const model = manifest.models?.[0] ?? null;
  const budget = manifest.runtime.budget;
  const cells: Array<{ k: string; v: string }> = [
    { k: 'entrypoint', v: manifest.runtime.entrypoint },
    { k: 'model', v: model !== null ? model.binding : '—' },
    { k: 'protocol', v: model !== null ? model.protocol_shape : '—' },
    { k: 'owner org', v: manifest.metadata.owner_organization_id },
    { k: 'manifest id', v: manifest.metadata.id },
    { k: 'ohm version', v: manifest.ohm_version },
  ];
  if (budget?.max_tokens !== undefined)
    cells.push({ k: 'max tokens', v: String(budget.max_tokens) });
  if (budget?.max_wall_time_seconds !== undefined)
    cells.push({ k: 'max wall time', v: `${budget.max_wall_time_seconds}s` });
  if (budget?.max_tool_calls !== undefined)
    cells.push({ k: 'max tool calls', v: String(budget.max_tool_calls) });
  for (const [k, v] of Object.entries(manifest.metadata.labels ?? {})) {
    cells.push({ k: `label · ${k}`, v });
  }
  return (
    <section className="sec" aria-label="Configuration">
      <div className="cfg-grid">
        {cells.map((c) => (
          <div className="cfg-cell" key={c.k}>
            <span className="k">{c.k}</span>
            <span className="v">{c.v}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
