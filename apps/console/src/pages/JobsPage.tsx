// Jobs — the org-wide run list (R5). Every durable engine run across all agents, newest first
// (the service caps at 50), with live status; a row opens the run's output + per-step provenance.
// The per-agent view is the agent-detail Runs tab; this is the cross-agent operations view.
import { useMemo, useState } from 'react';
import type { Job } from '@oraclous/api-client';
import { Page } from '../components/shell/DashLayout.js';
import { RunDetail } from '../components/RunDetail.js';
import { isRunActive, isRunEscalated, useHarnessAgents, useJob, useJobs } from '../lib/runs.js';
import { fmtTime, stateRowClass } from '../lib/jobs-format.js';
import '../styles/runs.css';
import './jobs.css';

const COLS = { gridTemplateColumns: '14px minmax(0, 1.2fr) minmax(0, 2fr) 120px 150px' } as const;

type Filter = 'all' | 'running' | 'waiting' | 'succeeded' | 'failed';
const FILTERS: ReadonlyArray<{ id: Filter; label: string }> = [
  { id: 'all', label: 'All' },
  { id: 'running', label: 'Running' },
  { id: 'waiting', label: 'Waiting' },
  { id: 'succeeded', label: 'Succeeded' },
  { id: 'failed', label: 'Failed' },
];

function matchesFilter(job: Job, filter: Filter): boolean {
  switch (filter) {
    case 'running':
      return isRunActive(job) && !isRunEscalated(job);
    case 'waiting':
      return isRunEscalated(job);
    case 'succeeded':
      return job.state === 'SUCCEEDED';
    case 'failed':
      return job.state === 'FAILED' || job.state === 'TIMED_OUT' || job.state === 'CANCELLED';
    default:
      return true;
  }
}

export default function JobsPage() {
  const { jobs, isLoading, isError } = useJobs();
  const { agents } = useHarnessAgents();
  const [filter, setFilter] = useState<Filter>('all');
  const [openJobId, setOpenJobId] = useState<string | null>(null);

  // manifest_ref → agent name, for the Agent column (a ref with no saved agent is an
  // inline-manifest run or a deleted agent).
  const agentByRef = useMemo(() => {
    const m = new Map<string, { name: string }>();
    for (const a of agents) m.set(a.id, { name: a.manifest?.metadata.name ?? a.name ?? 'Agent' });
    return m;
  }, [agents]);

  const filtered = useMemo(() => jobs.filter((j) => matchesFilter(j, filter)), [jobs, filter]);
  const running = jobs.filter((j) => isRunActive(j) && !isRunEscalated(j)).length;
  // The service caps the list at its 50 newest — surface that so the ops view doesn't read as
  // "everything" when it's truncated.
  const capped = jobs.length >= 50;

  // The drawer's job is resolved from the FULL list (not the filtered one) so a live state
  // transition that moves it out of the active filter doesn't blank the drawer; a direct-fetch
  // fallback covers a job that has left the 50-cap entirely. (A filter change clears openJobId.)
  const listed = jobs.find((j) => j.id === openJobId) ?? null;
  const { job: fetched } = useJob(listed === null ? openJobId : null);
  const openJob = listed ?? fetched;

  return (
    <Page>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-3)' }}>
        <header className="page-head" style={{ marginBottom: 0 }}>
          <div>
            <span className="eyebrow">
              {running > 0 && <span className="dot" aria-hidden="true" />}
              {running > 0 ? `${running} running` : 'Runs'}
            </span>
            <h1>Runs</h1>
            <p className="sub">
              Recent agent runs, newest first. Open a run for its output and trace.
            </p>
          </div>
        </header>

        <div className="jobs-filters" role="group" aria-label="Filter runs by state">
          {FILTERS.map((f) => (
            <button
              type="button"
              key={f.id}
              className={'chip ' + (filter === f.id ? 'on' : 'off')}
              aria-pressed={filter === f.id}
              onClick={() => {
                setFilter(f.id);
                // Don't leave a now-hidden run's drawer open under a filter that excludes it.
                setOpenJobId(null);
              }}
            >
              {f.label}
            </button>
          ))}
        </div>

        <section className="card" aria-label="Run history">
          <div className="card-body" style={{ padding: 0 }}>
            {isError ? (
              <div className="empty" style={{ border: 'none' }}>
                <p>Couldn’t load runs. Please try again.</p>
              </div>
            ) : isLoading ? (
              <p
                className="t-caption"
                style={{ color: 'var(--mute)', padding: '16px 20px', margin: 0 }}
              >
                Loading…
              </p>
            ) : filtered.length === 0 ? (
              <div className="empty" style={{ border: 'none' }}>
                <p>
                  {jobs.length === 0
                    ? 'No agent runs yet. Build an agent and run it to see jobs here.'
                    : 'No runs match this filter.'}
                </p>
              </div>
            ) : (
              <div className="run-table" role="table" aria-label="Runs" style={COLS}>
                <div role="row" style={{ display: 'contents' }}>
                  <span className="run-th" role="columnheader" aria-label="Status" />
                  <span className="run-th" role="columnheader">
                    Agent
                  </span>
                  <span className="run-th" role="columnheader">
                    Input
                  </span>
                  <span className="run-th" role="columnheader">
                    State
                  </span>
                  <span className="run-th" role="columnheader">
                    Started
                  </span>
                </div>
                {filtered.map((j) => {
                  const agent =
                    j.manifestRef !== null ? (agentByRef.get(j.manifestRef) ?? null) : null;
                  return (
                    <div role="row" className={`run-row ${stateRowClass(j.state)}`} key={j.id}>
                      <span className="run-td" role="cell">
                        <span className="s" aria-hidden="true" />
                      </span>
                      <span className="run-td" role="cell">
                        <button
                          type="button"
                          onClick={() => setOpenJobId(openJobId === j.id ? null : j.id)}
                          aria-expanded={openJobId === j.id}
                          aria-controls="run-detail"
                          title={agent?.name ?? j.manifestRef ?? 'inline manifest'}
                        >
                          {agent?.name ?? (j.manifestRef !== null ? 'unknown agent' : 'inline')}
                        </button>
                      </span>
                      <span className="run-td mute" role="cell" title={j.inputText}>
                        {j.inputText}
                      </span>
                      <span className="run-td" role="cell">
                        {j.state}
                      </span>
                      <span className="run-td mute" role="cell">
                        {fmtTime(j.createdAt)}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
            {openJob !== null && <RunDetail job={openJob} />}
          </div>
          {!isLoading && !isError && capped && (
            <p
              className="t-caption"
              style={{ color: 'var(--mute)', padding: '10px 20px', margin: 0 }}
            >
              Showing the newest 50 runs.
            </p>
          )}
        </section>
      </div>
    </Page>
  );
}
