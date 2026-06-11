// Connections — the credentials manager (Settings § "Identity and credentials"). Lists every
// credential the signed-in user holds (BYOM model keys + tool credentials added in the agent
// builder) and lets them add a model key or remove any. A model key added here carries the BYOM
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

// Common openai-compatible model providers (the binding's first segment). Freeform — the field
// accepts anything; these are just suggestions.
const PROVIDER_SUGGESTIONS = ['openrouter', 'openai', 'anthropic', 'google', 'mistral', 'groq'];

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

  const providerId = useId();
  const nameId = useId();
  const secretId = useId();
  const listId = useId();

  const [provider, setProvider] = useState('openrouter');
  const [name, setName] = useState('');
  const [secret, setSecret] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [removingId, setRemovingId] = useState<string | null>(null);

  async function onAdd(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSaved(false);
    const prov = provider.trim().toLowerCase();
    const key = secret.trim();
    if (prov === '' || key === '') return;
    try {
      await create.mutateAsync({
        toolId: MODEL_CREDENTIAL_TOOL_ID,
        userId: userId ?? '',
        name: name.trim() !== '' ? name.trim() : `${prov} key`,
        provider: prov,
        credType: 'api_key',
        credential: { api_key: key },
      });
      setSecret('');
      setName('');
      setSaved(true);
    } catch (cause) {
      setError(messageFor(cause));
    }
  }

  async function onRemove(id: string) {
    setError(null);
    setRemovingId(id);
    try {
      await remove.mutateAsync(id);
    } catch (cause) {
      setError(messageFor(cause));
    } finally {
      setRemovingId(null);
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
            Key added.
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
            <span className="s">Add a model key below to run agents.</span>
          </div>
        ) : (
          <div className="table" role="table" aria-label="Credentials" id={listId}>
            <div className="table-head" style={cols} role="row" aria-hidden="true">
              <span role="columnheader">Provider</span>
              <span role="columnheader">Type</span>
              <span role="columnheader">Name</span>
              <span role="columnheader" style={{ textAlign: 'right' }}>
                Manage
              </span>
            </div>
            {sorted.map((c) => {
              const isModel = c.toolId === MODEL_CREDENTIAL_TOOL_ID;
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
                      onClick={() => void onRemove(c.id)}
                      disabled={removingId === c.id}
                    >
                      {removingId === c.id ? 'Removing…' : 'Remove'}
                    </button>
                  </span>
                </div>
              );
            })}
          </div>
        )}

        <form
          onSubmit={onAdd}
          aria-label="Add a model key"
          style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-2)' }}
        >
          <span className="t-eyebrow">Add a model key (BYOM)</span>
          <div style={{ display: 'flex', gap: 'var(--sp-2)', flexWrap: 'wrap' }}>
            <div className="field" style={{ flex: 1, minWidth: 140 }}>
              <label htmlFor={providerId}>Provider</label>
              <input
                id={providerId}
                list={`${providerId}-list`}
                value={provider}
                onChange={(e) => {
                  setProvider(e.target.value);
                  setSaved(false);
                }}
                placeholder="openrouter"
              />
              <datalist id={`${providerId}-list`}>
                {PROVIDER_SUGGESTIONS.map((p) => (
                  <option key={p} value={p} />
                ))}
              </datalist>
            </div>
            <div className="field" style={{ flex: 1, minWidth: 140 }}>
              <label htmlFor={nameId}>Name (optional)</label>
              <input
                id={nameId}
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. my OpenRouter key"
              />
            </div>
          </div>
          <div className="field">
            <label htmlFor={secretId}>API key</label>
            <input
              id={secretId}
              type="password"
              autoComplete="off"
              value={secret}
              onChange={(e) => {
                setSecret(e.target.value);
                setSaved(false);
              }}
              placeholder="sk-…"
            />
          </div>
          <button
            type="submit"
            className="btn"
            data-variant="primary"
            style={{ width: 'fit-content' }}
            disabled={create.isPending || secret.trim() === '' || provider.trim() === ''}
            aria-busy={create.isPending}
          >
            {create.isPending ? 'Adding…' : 'Add key'}
          </button>
          <p className="t-caption" style={{ color: 'var(--mute)', margin: 0 }}>
            Tool credentials (database connections, OAuth) are added when you wire a tool to an
            agent in the builder.
          </p>
        </form>
      </div>
    </section>
  );
}
