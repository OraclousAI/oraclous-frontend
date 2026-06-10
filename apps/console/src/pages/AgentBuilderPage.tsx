// Agent builder (Wave 1) — form-driven OHM v1.0 authoring, create and edit. Every field maps
// 1:1 onto the manifest (the cross-repo contract in @oraclous/api-client's ohm.ts); nothing the
// runtime doesn't validate is offered. The entrypoint must name a bound tool (the only loop
// shape proven against the live runtime), so the form requires at least one tool.
import { useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import type { OhmCapability, OhmManifest } from '@oraclous/api-client';
import { Page } from '../components/shell/DashLayout.js';
import { useMe } from '../lib/session.js';
import { useTools } from '../lib/tools.js';
import { useCreateHarnessAgent, useHarnessAgent, useUpdateHarnessAgent } from '../lib/runs.js';
import './agent.css';

// Only provider/protocol combination wired in the deployed runtime.
const DEFAULT_MODEL = 'openrouter/meta-llama/llama-3.1-8b-instruct';
const PROTOCOL = 'openai-compatible' as const;

// "PostgreSQL Reader" -> ref "core/postgresql-reader@1.0.0", binding "postgresql_reader".
// Refs resolve by slug-matching the tool name in the registry (all-or-nothing at load time).
function toolSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

interface FormState {
  name: string;
  description: string;
  prompt: string;
  model: string;
  toolSlugs: readonly string[];
  entrypoint: string;
  maxToolCalls: string;
  maxWallTime: string;
}

function emptyForm(): FormState {
  return {
    name: '',
    description: '',
    prompt: '',
    model: DEFAULT_MODEL,
    toolSlugs: [],
    entrypoint: '',
    maxToolCalls: '',
    maxWallTime: '',
  };
}

function formFromManifest(m: OhmManifest): FormState {
  const slugs = (m.capabilities ?? []).map((c) => {
    const match = /^(?:core|org:[^/]+)\/([^@]+)@/.exec(c.ref);
    return match?.[1] ?? c.binding.replace(/_/g, '-');
  });
  return {
    name: m.metadata.name,
    description: m.metadata.description ?? '',
    prompt: m.prompts?.find((p) => p.role === 'primary')?.body ?? m.prompts?.[0]?.body ?? '',
    model: m.models?.[0]?.binding ?? DEFAULT_MODEL,
    toolSlugs: slugs,
    entrypoint: m.runtime.entrypoint,
    maxToolCalls: m.runtime.budget?.max_tool_calls?.toString() ?? '',
    maxWallTime: m.runtime.budget?.max_wall_time_seconds?.toString() ?? '',
  };
}

export default function AgentBuilderPage() {
  const { capabilityId } = useParams<{ capabilityId: string }>();
  const isEdit = capabilityId !== undefined && capabilityId !== '';
  const { agent, isLoading, isError } = useHarnessAgent(capabilityId ?? '');

  return (
    <Page>
      {isEdit && isError ? (
        <div className="empty">
          <p>Couldn’t load this agent for editing.</p>
          <Link to="/app/agents" className="btn" data-variant="ghost" data-size="sm">
            ← Agents
          </Link>
        </div>
      ) : isEdit && (isLoading || agent === null) ? (
        <p className="t-caption" style={{ color: 'var(--mute)' }}>
          Loading…
        </p>
      ) : (
        <BuilderForm
          capabilityId={isEdit ? (capabilityId ?? null) : null}
          existing={isEdit ? (agent?.manifest ?? null) : null}
        />
      )}
    </Page>
  );
}

function BuilderForm({
  capabilityId,
  existing,
}: {
  capabilityId: string | null;
  existing: OhmManifest | null;
}) {
  const navigate = useNavigate();
  const { principal } = useMe();
  const { tools, isLoading: toolsLoading } = useTools();
  const create = useCreateHarnessAgent();
  const update = useUpdateHarnessAgent(capabilityId ?? '');
  const saving = create.isPending || update.isPending;

  const [form, setForm] = useState<FormState>(() =>
    existing !== null ? formFromManifest(existing) : emptyForm()
  );
  const [error, setError] = useState<string | null>(null);
  const set = (patch: Partial<FormState>) => setForm((f) => ({ ...f, ...patch }));

  const palette = useMemo(
    () =>
      tools.map((t) => ({
        id: t.id,
        name: t.name,
        slug: toolSlug(t.name),
        description: t.description,
      })),
    [tools]
  );
  const chosen = palette.filter((t) => form.toolSlugs.includes(t.slug));
  const bindings = chosen.map((t) => t.slug.replace(/-/g, '_'));
  const entrypoint = bindings.includes(form.entrypoint) ? form.entrypoint : (bindings[0] ?? '');

  const valid = form.name.trim() !== '' && form.prompt.trim() !== '' && entrypoint !== '';

  function buildManifest(): OhmManifest | null {
    if (principal === null) return null;
    const capabilities: OhmCapability[] = chosen.map((t) => ({
      ref: `core/${t.slug}@1.0.0`,
      binding: t.slug.replace(/-/g, '_'),
    }));
    const budget: Record<string, number> = {};
    if (/^\d+$/.test(form.maxToolCalls)) budget['max_tool_calls'] = Number(form.maxToolCalls);
    if (/^\d+$/.test(form.maxWallTime)) budget['max_wall_time_seconds'] = Number(form.maxWallTime);
    return {
      ohm_version: '1.0',
      metadata: {
        id: existing?.metadata.id ?? crypto.randomUUID(),
        name: form.name.trim(),
        owner_organization_id: principal.organisationId,
        ...(form.description.trim() !== '' ? { description: form.description.trim() } : {}),
      },
      capabilities,
      models: [{ role: 'primary', binding: form.model.trim(), protocol_shape: PROTOCOL }],
      prompts: [{ role: 'primary', source: 'inline', body: form.prompt }],
      runtime: {
        entrypoint,
        ...(Object.keys(budget).length > 0 ? { budget } : {}),
      },
    };
  }

  async function onSave() {
    if (!valid || saving) return;
    const manifest = buildManifest();
    if (manifest === null) {
      setError('Your session isn’t ready yet — try again in a moment.');
      return;
    }
    setError(null);
    try {
      if (capabilityId !== null) {
        await update.mutateAsync(manifest);
        navigate(`/app/agents/harness/${capabilityId}`);
      } else {
        const saved = await create.mutateAsync(manifest);
        navigate(`/app/agents/harness/${saved.id}`);
      }
    } catch {
      setError('Couldn’t save the agent. Please check the fields and try again.');
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-3)', maxWidth: 760 }}>
      <header className="page-head">
        <div>
          <span className="eyebrow">
            <span className="dot" aria-hidden="true" />
            {capabilityId !== null ? 'edit agent' : 'new agent'}
          </span>
          <h1>{capabilityId !== null ? `Edit ${form.name || 'agent'}` : 'Build an agent'}</h1>
          <p className="sub">
            An agent is an OHM manifest: a prompt, a model, the tools it may call, and a budget.
            Saved agents run durably through the engine.
          </p>
        </div>
      </header>

      <section className="sec" aria-label="Identity">
        <div className="sec-h">
          <div className="t">
            <h2>Identity</h2>
          </div>
        </div>
        <div
          className="sec-body"
          style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-2)' }}
        >
          <label className="field">
            <span>Name</span>
            <input
              type="text"
              value={form.name}
              onChange={(e) => set({ name: e.target.value })}
              placeholder="Support triage agent"
              required
            />
          </label>
          <label className="field">
            <span>Description (optional)</span>
            <input
              type="text"
              value={form.description}
              onChange={(e) => set({ description: e.target.value })}
              placeholder="What this agent is for"
            />
          </label>
        </div>
      </section>

      <section className="sec" aria-label="Prompt">
        <div className="sec-h">
          <div className="t">
            <h2>System prompt</h2>
            <span className="sub">role: primary · inline</span>
          </div>
        </div>
        <div className="sec-body">
          <label className="field">
            <span className="sr-only">System prompt</span>
            <textarea
              value={form.prompt}
              onChange={(e) => set({ prompt: e.target.value })}
              rows={6}
              placeholder="You are… Use the tools to look up context, then answer concisely."
              required
            />
          </label>
        </div>
      </section>

      <section className="sec" aria-label="Model">
        <div className="sec-h">
          <div className="t">
            <h2>Model</h2>
            <span className="sub">protocol: openai-compatible (the only wired shape)</span>
          </div>
        </div>
        <div className="sec-body">
          <label className="field">
            <span>Model binding</span>
            <input
              type="text"
              value={form.model}
              onChange={(e) => set({ model: e.target.value })}
              placeholder={DEFAULT_MODEL}
              style={{ fontFamily: 'var(--font-mono)' }}
            />
          </label>
        </div>
      </section>

      <section className="sec" aria-label="Tools">
        <div className="sec-h">
          <div className="t">
            <h2>Tools</h2>
            <span className="sub">
              the loop's entrypoint must be one of these — pick at least one
            </span>
          </div>
        </div>
        {toolsLoading ? (
          <p
            className="t-caption"
            style={{ color: 'var(--mute)', padding: '14px 20px', margin: 0 }}
          >
            Loading the tool catalogue…
          </p>
        ) : palette.length === 0 ? (
          <div className="empty" style={{ border: 'none' }}>
            <p>No tools are registered for this organisation yet.</p>
          </div>
        ) : (
          <div>
            {palette.map((t) => {
              const on = form.toolSlugs.includes(t.slug);
              return (
                <label className="tool-row" key={t.id} style={{ cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={on}
                    onChange={() =>
                      set({
                        toolSlugs: on
                          ? form.toolSlugs.filter((s) => s !== t.slug)
                          : [...form.toolSlugs, t.slug],
                      })
                    }
                  />
                  <span className="body">
                    <span className="nm">
                      {t.name}
                      <span className="src">core/{t.slug}@1.0.0</span>
                    </span>
                    {t.description !== null && <span className="dx">{t.description}</span>}
                  </span>
                  {on && entrypoint === t.slug.replace(/-/g, '_') && (
                    <span className="scope">entrypoint</span>
                  )}
                </label>
              );
            })}
          </div>
        )}
        {bindings.length > 1 && (
          <div className="sec-body" style={{ borderTop: '1px solid var(--rule)' }}>
            <label className="field">
              <span>Entrypoint</span>
              <select value={entrypoint} onChange={(e) => set({ entrypoint: e.target.value })}>
                {bindings.map((b) => (
                  <option key={b} value={b}>
                    {b}
                  </option>
                ))}
              </select>
            </label>
          </div>
        )}
      </section>

      <section className="sec" aria-label="Budget">
        <div className="sec-h">
          <div className="t">
            <h2>Budget (optional)</h2>
            <span className="sub">override-down vs the policy set; breaches escalate the run</span>
          </div>
        </div>
        <div className="sec-body" style={{ display: 'flex', gap: 'var(--sp-2)', flexWrap: 'wrap' }}>
          <label className="field" style={{ flex: 1, minWidth: 160 }}>
            <span>Max tool calls</span>
            <input
              type="number"
              min="1"
              value={form.maxToolCalls}
              onChange={(e) => set({ maxToolCalls: e.target.value })}
              placeholder="unlimited"
            />
          </label>
          <label className="field" style={{ flex: 1, minWidth: 160 }}>
            <span>Max wall time (seconds)</span>
            <input
              type="number"
              min="1"
              value={form.maxWallTime}
              onChange={(e) => set({ maxWallTime: e.target.value })}
              placeholder="unlimited"
            />
          </label>
        </div>
      </section>

      {error !== null && (
        <p role="alert" className="t-caption" style={{ color: 'var(--error)', margin: 0 }}>
          {error}
        </p>
      )}

      <div style={{ display: 'flex', gap: 'var(--sp-2)' }}>
        <button
          type="button"
          className="btn"
          data-variant="primary"
          onClick={() => void onSave()}
          disabled={!valid || saving}
        >
          {saving ? 'Saving…' : capabilityId !== null ? 'Save changes' : 'Create agent'}
        </button>
        <Link
          to={capabilityId !== null ? `/app/agents/harness/${capabilityId}` : '/app/agents'}
          className="btn"
          data-variant="ghost"
        >
          Cancel
        </Link>
      </div>
    </div>
  );
}
