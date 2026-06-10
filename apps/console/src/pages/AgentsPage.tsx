// Agents. The primary section is Wave-1 OHM agents (saved harness manifests: prompt + model +
// tools + budget, run durably through the engine — built in the agent builder). Below it, tool
// instances: single configured tools from the catalogue (the registry-level run path).
// Styled per the handoff agents.html (tile grid + card chrome).
import { useId, useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ApiClientError } from '@oraclous/api-client';
import { useTools } from '../lib/tools.js';
import { useCreateInstance, useInstances } from '../lib/agents.js';
import { isRunActive, isRunEscalated, useHarnessAgents, useJobs } from '../lib/runs.js';
import { SkeletonList } from '../components/ui/Skeleton.js';
import { IconBot } from '../icons/index.js';
import './catalog.css';

function messageFor(cause: unknown): string {
  if (ApiClientError.is(cause)) return cause.message;
  return 'Something went wrong. Please try again.';
}

// Mint dot = live agent only; terminal/idle states stay neutral.
function pillState(status: string): string {
  const s = status.toLowerCase();
  if (s.includes('error') || s.includes('fail')) return 'error';
  if (s === 'active' || s === 'ready' || s === 'running') return 'active';
  return 'paused';
}

export default function AgentsPage() {
  const { tools, isLoading: toolsLoading, isError: toolsError } = useTools();
  const { instances, isLoading, isError } = useInstances();
  const {
    agents: harnessAgents,
    isLoading: agentsLoading,
    isError: agentsError,
  } = useHarnessAgents();
  const { jobs } = useJobs();
  const createInstance = useCreateInstance();
  const navigate = useNavigate();

  const toolId = useId();
  const nameId = useId();
  const [capabilityId, setCapabilityId] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);

  const toolName = (id: string): string => tools.find((t) => t.id === id)?.name ?? 'tool';

  async function onCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    if (capabilityId === '') return;
    try {
      const instance = await createInstance.mutateAsync({ capabilityId, name: name.trim() });
      setName('');
      setCapabilityId('');
      navigate(`/app/agents/${instance.id}`);
    } catch (cause) {
      setError(messageFor(cause));
    }
  }

  return (
    <div>
      <header className="page-head">
        <div>
          <span className="eyebrow">Build · run · observe</span>
          <h1>Agents</h1>
          <p className="sub">
            An agent is an OHM manifest — a prompt, a model, and the tools it may call — run durably
            through the engine with full per-step provenance.
          </p>
        </div>
        <div className="page-head-actions">
          <Link to="/app/agents/new" className="btn" data-variant="primary">
            New agent
          </Link>
        </div>
      </header>

      <section className="card" style={{ marginBottom: 'var(--sp-4)' }} aria-label="Agents">
        <div className="card-head">
          <div className="h">
            <h2>Agents</h2>
            <span className="sub">Saved OHM manifests, run through the engine</span>
          </div>
        </div>
        <div className="card-body">
          {agentsLoading ? (
            <SkeletonList rows={2} />
          ) : agentsError ? (
            <p className="callout" data-tone="error" role="alert" style={{ margin: 0 }}>
              Couldn’t load the agents. Please try again.
            </p>
          ) : harnessAgents.length === 0 ? (
            <div className="empty">
              <span className="empty-icon">
                <IconBot size={18} />
              </span>
              <span className="t">No agents yet</span>
              <span className="s">Build one: a prompt, a model, and the tools it may call.</span>
              <Link to="/app/agents/new" className="btn" data-variant="secondary" data-size="sm">
                Build an agent
              </Link>
            </div>
          ) : (
            <ul className="cat-grid" aria-label="Agents">
              {harnessAgents.map((a) => {
                const name = a.manifest?.metadata.name ?? a.name ?? 'Agent';
                const agentJobs = jobs.filter((j) => j.manifestRef === a.id);
                const live = agentJobs.some((j) => isRunActive(j) && !isRunEscalated(j));
                const waiting = agentJobs.some(isRunEscalated);
                return (
                  <li key={a.id}>
                    <Link to={`/app/agents/harness/${a.id}`} className="cat-tile">
                      <div className="top">
                        <span className="nm">
                          {name}
                          {live && <span className="live-dot is-pulse" aria-hidden="true" />}
                        </span>
                        <span
                          className="status-pill"
                          data-state={live ? 'active' : waiting ? 'warning' : 'paused'}
                        >
                          {live ? 'running' : waiting ? 'needs attention' : 'idle'}
                        </span>
                      </div>
                      {a.manifest?.metadata.description != null &&
                        a.manifest.metadata.description !== '' && (
                          <p className="desc">{a.manifest.metadata.description}</p>
                        )}
                      <div className="meta">
                        <span>{(a.manifest?.capabilities ?? []).length} tools</span>
                        <span>{agentJobs.length} recent runs</span>
                      </div>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </section>

      <form
        className="card"
        style={{ marginBottom: 'var(--sp-4)' }}
        onSubmit={onCreate}
        aria-label="Create an agent"
      >
        <div className="card-head">
          <div className="h">
            <h2>Create a tool instance</h2>
            <span className="sub">Instantiate a single tool from the catalogue</span>
          </div>
        </div>
        <div
          className="card-body"
          style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-3)' }}
        >
          <div className="control-row">
            <div className="field" style={{ minWidth: 200 }}>
              <label htmlFor={toolId}>Tool</label>
              <select
                id={toolId}
                value={capabilityId}
                onChange={(e) => setCapabilityId(e.target.value)}
                required
              >
                <option value="">
                  {toolsLoading
                    ? 'Loading tools…'
                    : toolsError
                      ? 'Tools unavailable'
                      : 'Select a tool…'}
                </option>
                {tools.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
              {toolsError && (
                <span role="alert" className="error-text">
                  Couldn&rsquo;t load the tool catalogue.
                </span>
              )}
            </div>
            <div className="field grow">
              <label htmlFor={nameId}>Name</label>
              <input
                id={nameId}
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Production DB reader"
              />
            </div>
            <button
              type="submit"
              className="btn"
              data-variant="primary"
              disabled={createInstance.isPending || capabilityId === '' || name.trim() === ''}
              aria-busy={createInstance.isPending}
            >
              {createInstance.isPending ? 'Creating…' : 'Create agent'}
            </button>
          </div>
          {error !== null && (
            <p role="alert" className="callout" data-tone="error" style={{ margin: 0 }}>
              {error}
            </p>
          )}
        </div>
      </form>

      <section className="card" aria-label="Tool instances">
        <div className="card-head">
          <div className="h">
            <h2>Tool instances</h2>
            <span className="sub">
              {instances.length} configured · single tools run directly against the registry
            </span>
          </div>
        </div>
        <div className="card-body">
          {isLoading ? (
            <SkeletonList rows={3} />
          ) : isError ? (
            <p className="callout" data-tone="error" role="alert" style={{ margin: 0 }}>
              Couldn&rsquo;t load your agents. Please try again.
            </p>
          ) : instances.length === 0 ? (
            <div className="empty">
              <span className="empty-icon">
                <IconBot size={24} />
              </span>
              <span className="t">No tool instances yet</span>
              <span className="s">Create one above to run a tool against your graphs.</span>
            </div>
          ) : (
            <ul className="cat-grid" aria-label="Agents">
              {instances.map((inst) => {
                const state = pillState(inst.status);
                return (
                  <li key={inst.id}>
                    <Link to={`/app/agents/${inst.id}`} className="cat-tile">
                      <div className="top">
                        <span className="nm">
                          {inst.name}
                          {state === 'active' && (
                            <span className="live-dot is-pulse" aria-hidden="true" />
                          )}
                        </span>
                        <span
                          className="status-pill"
                          data-state={state}
                          aria-label={`status: ${inst.status}`}
                        >
                          <span className="dot" aria-hidden="true" />
                          {inst.status}
                        </span>
                      </div>
                      <p className="meta">
                        {toolName(inst.capabilityId)} · {inst.executionCount} run
                        {inst.executionCount === 1 ? '' : 's'}
                      </p>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </section>
    </div>
  );
}
