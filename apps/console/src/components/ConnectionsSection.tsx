// Connections — the credentials manager (Settings § "Identity and credentials"). Lists every
// credential the signed-in user holds (BYOM model keys + tool credentials added in the agent
// builder) and lets them add a model connection (OpenRouter/OpenAI presets or a custom
// OpenAI-compatible endpoint) or remove any. A model connection added here carries the BYOM
// sentinel tool_id, so it appears in the agent builder's model dropdown for matching providers.
// The secret is only ever SENT on create — it is never listed, displayed, or read back.
import { useId, useState, type FormEvent } from 'react';
import { ApiClientError } from '@oraclous/api-client';
import {
  MODEL_CREDENTIAL_TOOL_ID,
  useCredentials,
  useCreateCredential,
  useDeleteCredential,
} from '../lib/credentials.js';
import { SkeletonList } from './ui/Skeleton.js';

// BYOM connection types. The harness has server-side base URLs for the two presets (both
// openai-compatible); a custom connection carries its own base_url on the credential payload
// (the harness reads it, behind an SSRF egress guard). Vendors without a wired base URL are
// deliberately absent — they would 502 at run time, not build time.
type ConnectionType = 'openrouter' | 'openai' | 'custom';
const CONNECTION_TYPES: ReadonlyArray<{ value: ConnectionType; label: string }> = [
  { value: 'openrouter', label: 'OpenRouter' },
  { value: 'openai', label: 'OpenAI' },
  { value: 'custom', label: 'Custom (OpenAI-compatible)' },
];

// A custom label becomes both the credential's provider and the model binding's first segment
// ("<label>/<model-id>"), so it must be a clean binding segment.
function labelSlug(s: string): string {
  return s
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function looksLikeUrl(s: string): boolean {
  return /^https?:\/\/.+/i.test(s.trim());
}

function messageFor(cause: unknown): string {
  if (ApiClientError.is(cause)) return cause.message;
  return 'Something went wrong. Please try again.';
}

const successCallout = {
  margin: 0,
  background: 'var(--success-bg)',
  borderColor: 'var(--success)',
} as const;

const cols = { gridTemplateColumns: 'minmax(0, 1fr) auto minmax(0, 1.4fr) auto' } as const;

export function ConnectionsSection({ userId }: { userId: string | null }) {
  const { credentials, isLoading, isError } = useCredentials(userId);
  const create = useCreateCredential();
  const remove = useDeleteCredential();

  const typeId = useId();
  const labelId = useId();
  const baseUrlId = useId();
  const nameId = useId();
  const secretId = useId();

  const [connType, setConnType] = useState<ConnectionType>('openrouter');
  const [customLabel, setCustomLabel] = useState('');
  const [baseUrl, setBaseUrl] = useState('');
  const [name, setName] = useState('');
  const [secret, setSecret] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [removingId, setRemovingId] = useState<string | null>(null);
  // Two-step destructive confirm: first click on a row arms it, second deletes.
  const [confirmId, setConfirmId] = useState<string | null>(null);

  const hasUser = userId !== null && userId !== '';
  const isCustom = connType === 'custom';
  // The provider sent + the model-binding prefix: a preset id, or the slugged custom label.
  const providerValue = isCustom ? labelSlug(customLabel) : connType;
  const customReady = !isCustom || (providerValue !== '' && looksLikeUrl(baseUrl));
  const canAdd = hasUser && secret.trim() !== '' && customReady && !create.isPending;

  function dismissBanner() {
    setSaved(false);
  }

  async function onAdd(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSaved(false);
    if (!canAdd) return;
    const credential: Record<string, string> = { api_key: secret.trim() };
    if (isCustom) credential['base_url'] = baseUrl.trim();
    try {
      await create.mutateAsync({
        toolId: MODEL_CREDENTIAL_TOOL_ID,
        userId: userId ?? '',
        name: name.trim() !== '' ? name.trim() : `${providerValue} key`,
        provider: providerValue,
        credType: 'api_key',
        credential,
      });
      setSecret('');
      setName('');
      setBaseUrl('');
      setCustomLabel('');
      setSaved(true);
    } catch (cause) {
      setError(messageFor(cause));
    }
  }

  async function onRemove(id: string) {
    setError(null);
    setSaved(false);
    setRemovingId(id);
    try {
      await remove.mutateAsync(id);
    } catch (cause) {
      setError(messageFor(cause));
    } finally {
      setRemovingId(null);
      setConfirmId(null);
    }
  }

  // Model keys first, then tool credentials; stable by name within each group.
  const sorted = [...credentials].sort((a, b) => {
    const am = a.toolId === MODEL_CREDENTIAL_TOOL_ID ? 0 : 1;
    const bm = b.toolId === MODEL_CREDENTIAL_TOOL_ID ? 0 : 1;
    if (am !== bm) return am - bm;
    return (a.name ?? a.provider).localeCompare(b.name ?? b.provider);
  });

  return (
    <section className="card" aria-label="Connections">
      <div className="card-head">
        <div className="h">
          <h2>Connections</h2>
          <span className="sub">
            Your model keys (BYOM) and tool credentials — secrets are stored encrypted and never
            shown again
          </span>
        </div>
      </div>
      <div
        className="card-body"
        style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-3)' }}
      >
        {error !== null && (
          <p role="alert" className="callout" data-tone="error" style={{ margin: 0 }}>
            {error}
          </p>
        )}
        {saved && (
          <p role="status" className="callout" style={successCallout}>
            Connection added.
          </p>
        )}

        {isLoading ? (
          <SkeletonList rows={2} />
        ) : isError ? (
          <p className="callout" data-tone="error" role="alert" style={{ margin: 0 }}>
            Couldn’t load your credentials. Please try again.
          </p>
        ) : sorted.length === 0 ? (
          <div className="empty" style={{ border: 'none' }}>
            <span className="t">No credentials yet</span>
            <span className="s">Add a model connection below to run agents.</span>
          </div>
        ) : (
          <div className="table" role="table" aria-label="Credentials">
            <div className="table-head" style={cols} role="row">
              <span role="columnheader">Provider</span>
              <span role="columnheader">Type</span>
              <span role="columnheader">Name</span>
              <span role="columnheader" style={{ textAlign: 'right' }}>
                Manage
              </span>
            </div>
            {sorted.map((c) => {
              const isModel = c.toolId === MODEL_CREDENTIAL_TOOL_ID;
              const kind = isModel ? 'model key' : 'tool credential';
              const arming = confirmId === c.id;
              return (
                <div className="table-row" style={cols} role="row" key={c.id}>
                  <span role="cell" className="mono">
                    {c.provider}
                  </span>
                  <span role="cell" className="chip chip-sm">
                    {isModel ? 'model key' : 'tool'}
                  </span>
                  <span role="cell" style={{ overflowWrap: 'break-word' }}>
                    {c.name ?? '—'}
                  </span>
                  <span role="cell" style={{ display: 'flex', justifyContent: 'flex-end' }}>
                    <button
                      type="button"
                      className="btn"
                      data-variant="danger"
                      data-size="sm"
                      aria-label={
                        arming
                          ? `Confirm removing the ${c.name ?? c.provider} ${kind}`
                          : `Remove the ${c.name ?? c.provider} ${kind}`
                      }
                      onClick={() => {
                        if (removingId === c.id) return;
                        if (arming) void onRemove(c.id);
                        else setConfirmId(c.id);
                      }}
                      disabled={removingId === c.id}
                    >
                      {removingId === c.id ? 'Removing…' : arming ? 'Confirm' : 'Remove'}
                    </button>
                  </span>
                </div>
              );
            })}
          </div>
        )}
        {!isLoading && !isError && sorted.length > 0 && (
          <p className="t-caption" style={{ color: 'var(--mute)', margin: 0 }}>
            Removing a credential breaks any agent or tool that uses it.
          </p>
        )}

        <form
          onSubmit={onAdd}
          aria-label="Add a model connection"
          style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-2)' }}
        >
          <span className="t-eyebrow">Add a model connection (BYOM)</span>
          <div style={{ display: 'flex', gap: 'var(--sp-2)', flexWrap: 'wrap' }}>
            <div className="field" style={{ flex: 1, minWidth: 160 }}>
              <label htmlFor={typeId}>Provider</label>
              <select
                id={typeId}
                value={connType}
                onChange={(e) => {
                  setConnType(e.target.value as ConnectionType);
                  dismissBanner();
                }}
              >
                {CONNECTION_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="field" style={{ flex: 1, minWidth: 160 }}>
              <label htmlFor={nameId}>Name (optional)</label>
              <input
                id={nameId}
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  dismissBanner();
                }}
                placeholder="e.g. my OpenRouter key"
              />
            </div>
          </div>

          {isCustom && (
            <>
              <div className="field">
                <label htmlFor={labelId}>Provider label</label>
                <input
                  id={labelId}
                  value={customLabel}
                  onChange={(e) => {
                    setCustomLabel(e.target.value);
                    dismissBanner();
                  }}
                  placeholder="my-llm"
                />
                {customLabel.trim() !== '' && (
                  <p className="t-caption" style={{ color: 'var(--mute)', margin: 0 }}>
                    Used as the model binding prefix:{' '}
                    <span className="mono">{providerValue || '…'}/&lt;model-id&gt;</span>
                  </p>
                )}
              </div>
              <div className="field">
                <label htmlFor={baseUrlId}>Base URL</label>
                <input
                  id={baseUrlId}
                  type="url"
                  inputMode="url"
                  value={baseUrl}
                  onChange={(e) => {
                    setBaseUrl(e.target.value);
                    dismissBanner();
                  }}
                  placeholder="https://my-endpoint/v1"
                />
              </div>
            </>
          )}

          <div className="field">
            <label htmlFor={secretId}>API key</label>
            <input
              id={secretId}
              type="password"
              autoComplete="off"
              value={secret}
              onChange={(e) => {
                setSecret(e.target.value);
                dismissBanner();
              }}
              placeholder="sk-…"
            />
          </div>
          <button
            type="submit"
            className="btn"
            data-variant="primary"
            style={{ width: 'fit-content' }}
            disabled={!canAdd}
            aria-busy={create.isPending}
          >
            {create.isPending ? 'Adding…' : 'Add connection'}
          </button>
          <p className="t-caption" style={{ color: 'var(--mute)', margin: 0 }}>
            {isCustom
              ? 'Any OpenAI-compatible endpoint — the base URL is stored with the connection and used at run time.'
              : 'Tool credentials (database connections, OAuth) are added when you wire a tool to an agent in the builder.'}
          </p>
        </form>
      </div>
    </section>
  );
}
