// Agent builder (Wave 1) — form-driven OHM v1.0 authoring, create and edit. Every field maps
// 1:1 onto the manifest (the cross-repo contract in @oraclous/api-client's ohm.ts).
//
// Two invariants the review hardened:
// - Edits MERGE over the saved manifest — fields the form doesn't model (governance, actors,
//   capability credential_mappings, extra prompts/models, model config, labels, signatures,
//   observability tags, unmodeled budget keys) pass through verbatim. Retained tools keep their
//   original ref + config; a bound capability whose tool left the catalogue is preserved and
//   shown read-only.
// - Tool selection is keyed by registry id, and every newly added capability pins it via
//   config.capability_id (the registry's fail-closed pin) — name-slug collisions can't bind a
//   different row than the one the user clicked.
import { useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import type {
  OhmCapability,
  OhmManifest,
  OhmMetadata,
  OhmModel,
  OhmPrompt,
} from '@oraclous/api-client';
import { Page } from '../components/shell/DashLayout.js';
import { CredentialSlot } from '../components/CredentialSlot.js';
import { useMe } from '../lib/session.js';
import { useTokenStore } from '../lib/token-store.jsx';
import { useTools } from '../lib/tools.js';
import {
  MODEL_CREDENTIAL_TOOL_ID,
  credentialFormForRequirement,
  useCredentials,
} from '../lib/credentials.js';
import { useCreateHarnessAgent, useHarnessAgent, useUpdateHarnessAgent } from '../lib/runs.js';
import './agent.css';

// Only provider/protocol combination wired in the deployed runtime.
const DEFAULT_MODEL = 'openrouter/meta-llama/llama-3.1-8b-instruct';
const PROTOCOL = 'openai-compatible' as const;

// Curated wired model bindings offered in the picker — all openrouter / openai-compatible (the only
// wired shape). The binding string is the manifest value; the "other" escape hatch covers anything
// not listed (and can introduce a different provider, which re-arms the BYOM-key mismatch check).
const WIRED_MODELS: { binding: string; label: string }[] = [
  {
    binding: 'openrouter/meta-llama/llama-3.1-8b-instruct',
    label: 'Llama 3.1 8B Instruct · OpenRouter',
  },
  {
    binding: 'openrouter/meta-llama/llama-3.3-70b-instruct',
    label: 'Llama 3.3 70B Instruct · OpenRouter',
  },
  { binding: 'openrouter/openai/gpt-4o-mini', label: 'GPT-4o mini · OpenRouter' },
  { binding: 'openrouter/anthropic/claude-3.5-sonnet', label: 'Claude 3.5 Sonnet · OpenRouter' },
];
const MODEL_OTHER = '__other__';

// The model's BYOM provider is the binding's first segment: "openrouter/meta-llama/…" → openrouter.
function modelProviderOf(binding: string): string {
  const head = binding.split('/')[0]?.trim();
  return head !== undefined && head !== '' ? head : 'openrouter';
}

// credential_mappings the manifest stores: requirement type → credential id, per capability.
type ToolCredMap = Record<string, Record<string, string>>;

function readToolCreds(caps: readonly OhmCapability[]): ToolCredMap {
  const out: ToolCredMap = {};
  for (const c of caps) {
    const m = c.config?.['credential_mappings'];
    if (m !== null && typeof m === 'object') {
      const entries = Object.entries(m as Record<string, unknown>).filter(
        ([, v]) => typeof v === 'string'
      ) as [string, string][];
      if (entries.length > 0) out[c.binding] = Object.fromEntries(entries);
    }
  }
  return out;
}

// The harness drives the loop with the role=='primary' model (manifest.py primary_model()),
// falling back to models[0] only when no model carries that role. The form reads/writes the
// binding + BYOM key on that same model so a multi-model / imported manifest can't end up with
// the key on the wrong entry.
function primaryModelIndex(models: readonly OhmModel[] | undefined): number {
  if (models === undefined || models.length === 0) return 0;
  const i = models.findIndex((m) => m.role === 'primary');
  return i >= 0 ? i : 0;
}

function modelBindingOf(m: OhmManifest | null): string | null {
  const models = m?.models;
  const binding = models?.[primaryModelIndex(models)]?.binding;
  return typeof binding === 'string' ? binding : null;
}

function modelCredentialOf(m: OhmManifest | null): string | null {
  const models = m?.models;
  const id = models?.[primaryModelIndex(models)]?.config?.['credential_id'];
  return typeof id === 'string' ? id : null;
}

// "PostgreSQL Reader" -> slug "postgresql-reader", binding "postgresql_reader". Refs resolve by
// slug-matching the tool name; the capability_id pin makes the match unambiguous.
function toolSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

// crypto.randomUUID needs a secure context, and the console is also reached over plain
// host-IP HTTP in the current deployment — fall back to a getRandomValues v4.
function makeManifestId(): string {
  if (typeof crypto.randomUUID === 'function') return crypto.randomUUID();
  const b = crypto.getRandomValues(new Uint8Array(16));
  b[6] = (b[6]! & 0x0f) | 0x40;
  b[8] = (b[8]! & 0x3f) | 0x80;
  const h = [...b].map((x) => x.toString(16).padStart(2, '0')).join('');
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`;
}

function capabilityPinId(c: OhmCapability): string | null {
  const pin = c.config?.['capability_id'];
  return typeof pin === 'string' ? pin : null;
}

function capabilityRefSlug(c: OhmCapability): string {
  const match = /^(?:core|org:[^/]+)\/([^@]+)@/.exec(c.ref);
  return match?.[1] ?? c.binding.replace(/_/g, '-');
}

interface FormState {
  name: string;
  description: string;
  prompt: string;
  model: string;
  // The model's BYOM key (a broker credential id); live runs need it (model.config.credential_id).
  modelCredentialId: string | null;
  // The manifest's capability entries, verbatim — retained entries keep ref/config untouched.
  caps: readonly OhmCapability[];
  // Per-binding credential_mappings (requirement type → credential id) the form is editing.
  toolCreds: ToolCredMap;
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
    modelCredentialId: null,
    caps: [],
    toolCreds: {},
    entrypoint: '',
    maxToolCalls: '',
    maxWallTime: '',
  };
}

function formFromManifest(m: OhmManifest): FormState {
  return {
    name: m.metadata.name,
    description: m.metadata.description ?? '',
    prompt: m.prompts?.find((p) => p.role === 'primary')?.body ?? m.prompts?.[0]?.body ?? '',
    model: modelBindingOf(m) ?? DEFAULT_MODEL,
    modelCredentialId: modelCredentialOf(m),
    caps: m.capabilities ?? [],
    toolCreds: readToolCreds(m.capabilities ?? []),
    entrypoint: m.runtime.entrypoint,
    maxToolCalls: m.runtime.budget?.max_tool_calls?.toString() ?? '',
    maxWallTime: m.runtime.budget?.max_wall_time_seconds?.toString() ?? '',
  };
}

// Replace the primary prompt's body, preserving any other prompts verbatim.
function mergePrompts(existing: readonly OhmPrompt[] | undefined, body: string): OhmPrompt[] {
  const prompts = [...(existing ?? [])];
  const i = prompts.findIndex((p) => p.role === 'primary');
  if (i >= 0) prompts[i] = { ...prompts[i]!, source: prompts[i]!.source ?? 'inline', body };
  else prompts.unshift({ role: 'primary', source: 'inline', body });
  return prompts;
}

export default function AgentBuilderPage() {
  const { capabilityId } = useParams<{ capabilityId: string }>();
  const isEdit = capabilityId !== undefined && capabilityId !== '';
  const { agent, isLoading, isError } = useHarnessAgent(capabilityId ?? '');
  // In edit mode a null manifest means the stored descriptor couldn't be read — never offer a
  // form that would overwrite it with a from-scratch document.
  const unreadable = isEdit && !isLoading && !isError && agent !== null && agent.manifest === null;

  return (
    <Page>
      {isEdit && (isError || unreadable) ? (
        <div className="empty">
          <p>
            {unreadable
              ? 'This agent’s saved manifest can’t be read, so it can’t be edited here.'
              : 'Couldn’t load this agent for editing.'}
          </p>
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
          key={capabilityId ?? 'new'}
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
  // The manifest's owner_organization_id is the ReBAC/tenancy anchor — it must be the ACTIVE org
  // (the token claim), not /v1/auth/me's organisationId which always reports the user's default.
  const { activeOrgId } = useTokenStore();
  const userId = principal?.id ?? null;
  const { tools, isLoading: toolsLoading } = useTools();
  const { credentials } = useCredentials(userId);
  const create = useCreateHarnessAgent();
  const update = useUpdateHarnessAgent(capabilityId ?? '');
  const saving = create.isPending || update.isPending;

  const [form, setForm] = useState<FormState>(() =>
    existing !== null ? formFromManifest(existing) : emptyForm()
  );
  // The model picker shows the wired list; "other" mode reveals the free-text binding. Seed it from
  // whether the saved/initial binding is one of the wired options so edits round-trip correctly.
  const [modelOther, setModelOther] = useState(() => {
    const initial = existing !== null ? (modelBindingOf(existing) ?? DEFAULT_MODEL) : DEFAULT_MODEL;
    return initial.trim() !== '' && !WIRED_MODELS.some((m) => m.binding === initial);
  });
  const [error, setError] = useState<string | null>(null);
  const set = (patch: Partial<FormState>) => setForm((f) => ({ ...f, ...patch }));

  const palette = useMemo(
    () =>
      tools.map((t) => ({
        id: t.id,
        name: t.name,
        slug: toolSlug(t.name),
        description: t.description,
        requirements: t.credentialRequirements,
        // Unapproved (e.g. pending_approval) tools can't execute — offered disabled, labelled.
        approved: t.status === null || t.status === 'active',
      })),
    [tools]
  );

  // A palette tool is bound iff a capability entry pins its id, or (entries saved without the
  // pin) its ref slug matches. Capabilities whose tool left the catalogue stay in form.caps.
  const boundCapOf = (toolId: string, slug: string): OhmCapability | undefined =>
    form.caps.find((c) => capabilityPinId(c) === toolId) ??
    form.caps.find((c) => capabilityPinId(c) === null && capabilityRefSlug(c) === slug);

  const orphanCaps = form.caps.filter((c) => !palette.some((t) => boundCapOf(t.id, t.slug) === c));

  // ── Credential wiring ──────────────────────────────────────────────────────
  const modelProvider = modelProviderOf(form.model);
  // Only BYOM model keys (the model sentinel) — never a standalone tool API key that happens to share
  // a provider name (those carry the unscoped sentinel and belong to tool credential slots).
  const modelCredentialCandidates = credentials.filter(
    (c) =>
      c.provider === modelProvider &&
      c.credType === 'api_key' &&
      c.toolId === MODEL_CREDENTIAL_TOOL_ID
  );

  // Changing the binding can change the provider; a BYOM key for the old provider would resolve
  // to a 401 at run time. If we can positively see the selected key is for a different provider,
  // drop it (it must be re-picked) — but never clear a key we can't yet evaluate (list loading,
  // or an editing key the list confirms matches), which keeps the "current key" fallback honest.
  function setModelBinding(value: string) {
    setForm((f) => {
      const selected = credentials.find((c) => c.id === f.modelCredentialId);
      const mismatched = selected !== undefined && selected.provider !== modelProviderOf(value);
      return { ...f, model: value, modelCredentialId: mismatched ? null : f.modelCredentialId };
    });
  }

  function setToolCred(binding: string, reqType: string, credentialId: string | null) {
    setForm((f) => {
      const forBinding = { ...(f.toolCreds[binding] ?? {}) };
      if (credentialId === null) delete forBinding[reqType];
      else forBinding[reqType] = credentialId;
      const next = { ...f.toolCreds };
      if (Object.keys(forBinding).length > 0) next[binding] = forBinding;
      else delete next[binding];
      return { ...f, toolCreds: next };
    });
  }

  // Bound tools that declare credential requirements — each gets a slot per requirement.
  const toolsNeedingCreds = form.caps
    .map((c) => ({ cap: c, tool: palette.find((t) => boundCapOf(t.id, t.slug) === c) }))
    .filter(
      (x): x is { cap: OhmCapability; tool: (typeof palette)[number] } =>
        x.tool !== undefined && x.tool.requirements.length > 0
    );

  function toggleTool(toolId: string, slug: string) {
    const bound = boundCapOf(toolId, slug);
    if (bound !== undefined) {
      set({ caps: form.caps.filter((c) => c !== bound) });
    } else {
      const cap: OhmCapability = {
        ref: `core/${slug}@1.0.0`,
        binding: slug.replace(/-/g, '_'),
        config: { capability_id: toolId },
      };
      set({ caps: [...form.caps, cap] });
    }
  }

  const bindings = form.caps.map((c) => c.binding);
  const entrypoint = bindings.includes(form.entrypoint) ? form.entrypoint : (bindings[0] ?? '');

  // The model key is required: live runs have no platform fallback (ADR-008) and 502 without it.
  const valid =
    form.name.trim() !== '' &&
    form.prompt.trim() !== '' &&
    form.model.trim() !== '' &&
    entrypoint !== '' &&
    form.modelCredentialId !== null;

  // Pre-save review: a read-only snapshot of what will be saved. The key shows only wired/not-set —
  // never the credential id. Budget cells appear only when set, mirroring the detail Config grid.
  const reviewCells: { k: string; v: string }[] = [
    { k: 'name', v: form.name.trim() || '—' },
    { k: 'model', v: form.model.trim() || '—' },
    { k: 'model key', v: form.modelCredentialId !== null ? 'wired' : 'not set' },
    { k: 'tools', v: String(form.caps.length) },
    { k: 'entrypoint', v: entrypoint || '—' },
  ];
  if (/^\d+$/.test(form.maxToolCalls))
    reviewCells.push({ k: 'max tool calls', v: form.maxToolCalls });
  if (/^\d+$/.test(form.maxWallTime))
    reviewCells.push({ k: 'max wall time', v: `${form.maxWallTime}s` });

  function buildManifest(principalOrgId: string): OhmManifest {
    // Merge over the saved manifest: only form-managed fields change.
    const metadata: OhmMetadata = {
      ...existing?.metadata,
      id: existing?.metadata.id ?? makeManifestId(),
      name: form.name.trim(),
      owner_organization_id: existing?.metadata.owner_organization_id ?? principalOrgId,
    };
    const md = metadata as { description?: string | null };
    if (form.description.trim() !== '') md.description = form.description.trim();
    else delete md.description;

    // Model: the form owns the binding + BYOM credential_id on the role=='primary' model; keep
    // that model's other config keys (temperature, …) and every other model verbatim.
    const primaryIdx = primaryModelIndex(existing?.models);
    const baseModel = existing?.models?.[primaryIdx];
    const modelConfig: Record<string, unknown> = { ...(baseModel?.config ?? {}) };
    if (form.modelCredentialId !== null) modelConfig['credential_id'] = form.modelCredentialId;
    else delete modelConfig['credential_id'];
    const primaryModel: OhmModel = {
      role: baseModel?.role ?? 'primary',
      binding: form.model.trim(),
      protocol_shape: baseModel?.protocol_shape ?? PROTOCOL,
      ...(Object.keys(modelConfig).length > 0 ? { config: modelConfig } : {}),
    };
    const models =
      existing?.models !== undefined && existing.models.length > 0
        ? existing.models.map((m, i) => (i === primaryIdx ? primaryModel : m))
        : [primaryModel];

    // Capabilities: keep each entry's config (capability_id pin, credential_mappings from other
    // requirements…) and overlay the form's credential_mappings.
    const capabilities: OhmCapability[] = form.caps.map((c) => {
      const mapping = Object.fromEntries(
        Object.entries(form.toolCreds[c.binding] ?? {}).filter(([, v]) => v !== '')
      );
      const config: Record<string, unknown> = { ...(c.config ?? {}) };
      if (Object.keys(mapping).length > 0) config['credential_mappings'] = mapping;
      else delete config['credential_mappings'];
      const base = { ref: c.ref, binding: c.binding };
      return Object.keys(config).length > 0 ? { ...base, config } : base;
    });

    // Budget: the two form keys are owned here (set or removed); other keys pass through.
    const budget: Record<string, number> = Object.fromEntries(
      Object.entries(existing?.runtime.budget ?? {}).filter(([, v]) => typeof v === 'number')
    ) as Record<string, number>;
    delete budget['max_tool_calls'];
    delete budget['max_wall_time_seconds'];
    if (/^\d+$/.test(form.maxToolCalls)) budget['max_tool_calls'] = Number(form.maxToolCalls);
    if (/^\d+$/.test(form.maxWallTime)) budget['max_wall_time_seconds'] = Number(form.maxWallTime);

    // Materialise the runtime then strip an emptied budget — spreading ...existing.runtime alone
    // would leave the OLD budget underneath when the form cleared its last key.
    const runtime: OhmManifest['runtime'] = { ...existing?.runtime, entrypoint };
    const rt = runtime as { budget?: Record<string, number> };
    if (Object.keys(budget).length > 0) rt.budget = budget;
    else delete rt.budget;

    return {
      ...existing,
      ohm_version: existing?.ohm_version ?? '1.0',
      metadata,
      capabilities,
      models,
      prompts: mergePrompts(existing?.prompts, form.prompt),
      runtime,
    };
  }

  async function onSave() {
    if (!valid || saving) return;
    setError(null);
    try {
      if (principal === null || activeOrgId === null) {
        setError('Your session isn’t ready yet — try again in a moment.');
        return;
      }
      const manifest = buildManifest(activeOrgId);
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
          <span className="eyebrow">{capabilityId !== null ? 'edit agent' : 'new agent'}</span>
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
          <div className="right">
            <span className="req" data-need={form.modelCredentialId === null ? 'true' : undefined}>
              {form.modelCredentialId === null ? 'key required to run' : 'key ready'}
            </span>
          </div>
        </div>
        <div
          className="sec-body"
          style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-2)' }}
        >
          <label className="field">
            <span>Model binding</span>
            <select
              value={modelOther ? MODEL_OTHER : form.model}
              onChange={(e) => {
                const value = e.target.value;
                if (value === MODEL_OTHER) setModelOther(true);
                else {
                  setModelOther(false);
                  setModelBinding(value);
                }
              }}
              style={{ fontFamily: 'var(--font-mono)' }}
            >
              {WIRED_MODELS.map((m) => (
                <option key={m.binding} value={m.binding}>
                  {m.label}
                </option>
              ))}
              <option value={MODEL_OTHER}>Other…</option>
            </select>
          </label>
          {modelOther && (
            <label className="field">
              <span>Custom model binding</span>
              <input
                type="text"
                value={form.model}
                onChange={(e) => setModelBinding(e.target.value)}
                placeholder={DEFAULT_MODEL}
                style={{ fontFamily: 'var(--font-mono)' }}
                required
              />
            </label>
          )}
          <div className="field">
            <span>{modelProvider} key (BYOM)</span>
            <CredentialSlot
              label={`${modelProvider} API key`}
              provider={modelProvider}
              credType="api_key"
              secretKey="api_key"
              toolId={MODEL_CREDENTIAL_TOOL_ID}
              userId={userId ?? ''}
              candidates={modelCredentialCandidates}
              value={form.modelCredentialId}
              onChange={(id) => set({ modelCredentialId: id })}
            />
            {form.modelCredentialId === null && (
              <p className="cred-hint">
                Runs use your own model key — there’s no platform fallback. Select one or add it
                above.
              </p>
            )}
          </div>
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
        ) : palette.length === 0 && orphanCaps.length === 0 ? (
          <div className="empty" style={{ border: 'none' }}>
            <p>No tools are registered for this organisation yet.</p>
          </div>
        ) : (
          <div>
            {palette.map((t) => {
              const bound = boundCapOf(t.id, t.slug);
              const unselectable = t.slug === '' || (!t.approved && bound === undefined);
              return (
                <label
                  className="tool-row"
                  key={t.id}
                  style={{ cursor: unselectable ? 'not-allowed' : 'pointer' }}
                >
                  <input
                    type="checkbox"
                    aria-label={t.name}
                    checked={bound !== undefined}
                    disabled={unselectable}
                    onChange={() => toggleTool(t.id, t.slug)}
                  />
                  <span className="body">
                    <span className="nm">
                      {t.name}
                      {bound !== undefined && <span className="src">{bound.ref}</span>}
                    </span>
                    {t.description !== null && <span className="dx">{t.description}</span>}
                  </span>
                  {!t.approved && <span className="scope">pending approval</span>}
                  {bound !== undefined && bound.binding === entrypoint && (
                    <span className="scope">entrypoint</span>
                  )}
                </label>
              );
            })}
            {orphanCaps.map((c) => (
              <div className="tool-row" key={c.binding}>
                <input type="checkbox" checked disabled aria-label={`${c.binding} (kept)`} />
                <span className="body">
                  <span className="nm">
                    {c.binding}
                    <span className="src">{c.ref}</span>
                  </span>
                  <span className="dx">
                    kept from the saved manifest — its tool isn’t in the catalogue
                  </span>
                </span>
                {c.binding === entrypoint && <span className="scope">entrypoint</span>}
              </div>
            ))}
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

      {toolsNeedingCreds.length > 0 && (
        <section className="sec" aria-label="Tool credentials">
          <div className="sec-h">
            <div className="t">
              <h2>Tool credentials</h2>
              <span className="sub">
                optional — an unconfigured tool simply returns an error step at run time
              </span>
            </div>
          </div>
          <div
            className="sec-body"
            style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-3)' }}
          >
            {toolsNeedingCreds.map(({ cap, tool }) => (
              <div key={cap.binding} className="cred-tool">
                <div className="cred-tool-h">{tool.name}</div>
                {tool.requirements.map((req) => {
                  const reqForm = credentialFormForRequirement(req.type);
                  const candidates = credentials.filter(
                    (c) => c.toolId === tool.id || c.provider === req.provider
                  );
                  return (
                    <div key={req.type} className="field">
                      <span>
                        {reqForm.label} · {req.provider}
                      </span>
                      <CredentialSlot
                        label={`${req.provider} ${reqForm.label.toLowerCase()}`}
                        provider={req.provider}
                        credType={reqForm.credType}
                        secretKey={reqForm.secretKey}
                        toolId={tool.id}
                        userId={userId ?? ''}
                        candidates={candidates}
                        value={form.toolCreds[cap.binding]?.[req.type] ?? null}
                        onChange={(id) => setToolCred(cap.binding, req.type, id)}
                        manual={reqForm.manual}
                      />
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </section>
      )}

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

      <section className="sec" aria-label="Review summary">
        <div className="sec-h">
          <div className="t">
            <h2>Review</h2>
            <span className="sub">what will be saved</span>
          </div>
        </div>
        <div className="cfg-grid">
          {reviewCells.map((c) => (
            <div className="cfg-cell" key={c.k}>
              <span className="k">{c.k}</span>
              <span className="v">{c.v}</span>
            </div>
          ))}
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
