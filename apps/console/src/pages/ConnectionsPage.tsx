// Connections — the first-class credentials roster (Connections journey, increment 1). Lifts the
// credential list out of Settings' ConnectionsSection into a routed page: every credential the
// signed-in user holds (BYOM model keys + tool credentials) with provider, type, and name, plus a
// two-step danger Remove. The secret is only ever SENT on create elsewhere — it is never listed,
// displayed, or read back here (§1.5). Adding / renaming / the providers panel / OAuth connect are
// later increments; the BYOM add form stays in Settings for now.
import { useState } from 'react';
import { ApiClientError, type Credential } from '@oraclous/api-client';
import { useDash } from '../context/dash.js';
import {
  MODEL_CREDENTIAL_TOOL_ID,
  useCredentials,
  useDeleteCredential,
} from '../lib/credentials.js';
import { SkeletonList } from '../components/ui/Skeleton.js';
import { IconGlobe } from '../icons/index.js';
import './catalog.css';

const cols = { gridTemplateColumns: 'minmax(0, 1fr) auto minmax(0, 1.4fr) auto' } as const;

function messageFor(cause: unknown): string {
  if (ApiClientError.is(cause)) return cause.message;
  return 'Something went wrong. Please try again.';
}

// A human label for each credential type the roster renders.
function credKindLabel(c: Credential): string {
  if (c.toolId === MODEL_CREDENTIAL_TOOL_ID) return 'model key';
  if (c.credType === 'api_key') return 'API key';
  if (c.credType === 'oauth') return 'OAuth';
  if (c.credType === 'raw') return 'Connection string';
  return c.credType;
}

export default function ConnectionsPage() {
  const { userId } = useDash();
  const { credentials, isLoading, isError } = useCredentials(userId);
  const remove = useDeleteCredential();

  const [error, setError] = useState<string | null>(null);
  const [removingId, setRemovingId] = useState<string | null>(null);
  // Two-step destructive confirm: first click on a row arms it, second removes.
  const [confirmId, setConfirmId] = useState<string | null>(null);

  async function onRemove(id: string) {
    setError(null);
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

  // The armed (first-clicked) row, announced politely so a screen-reader user knows the next click
  // confirms a destructive remove (a focused element's accessible-name change isn't reliably read).
  const armed = confirmId !== null ? (sorted.find((c) => c.id === confirmId) ?? null) : null;
  const armedMessage =
    armed !== null
      ? `Click confirm to remove the ${armed.name ?? armed.provider} ${credKindLabel(armed)}.`
      : '';

  return (
    <div className="cat-page">
      <header className="page-head">
        <div>
          <span className="eyebrow">Account</span>
          <h1>Connections</h1>
          <p className="sub">
            Your model keys and tool credentials. Secrets are stored encrypted and never shown
            again.
          </p>
        </div>
      </header>

      <div
        aria-live="polite"
        style={{
          position: 'absolute',
          width: 1,
          height: 1,
          overflow: 'hidden',
          clip: 'rect(0 0 0 0)',
          whiteSpace: 'nowrap',
        }}
      >
        {armedMessage}
      </div>

      {error !== null && (
        <p role="alert" className="callout" data-tone="error" style={{ margin: 0 }}>
          {error}
        </p>
      )}

      {isLoading ? (
        <SkeletonList rows={3} />
      ) : isError ? (
        <p className="callout" data-tone="error" role="alert" style={{ margin: 0 }}>
          Couldn’t load your connections. Please try again.
        </p>
      ) : sorted.length === 0 ? (
        <div className="card">
          <div className="empty">
            <span className="empty-icon">
              <IconGlobe size={24} />
            </span>
            <span className="t">No connections yet</span>
            <span className="s">Add a model connection in Settings to run agents.</span>
          </div>
        </div>
      ) : (
        <>
          <div className="card">
            <div className="table" role="table" aria-label="Connections">
              <div className="table-head" style={cols} role="row">
                <span role="columnheader">Provider</span>
                <span role="columnheader">Type</span>
                <span role="columnheader">Name</span>
                <span role="columnheader" style={{ textAlign: 'right' }}>
                  Manage
                </span>
              </div>
              {sorted.map((c) => {
                const kind = credKindLabel(c);
                const arming = confirmId === c.id;
                return (
                  <div className="table-row" style={cols} role="row" key={c.id}>
                    <span role="cell" className="mono">
                      {c.provider}
                    </span>
                    <span role="cell" className="chip chip-sm">
                      {kind}
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
          </div>
          <p className="t-caption" style={{ color: 'var(--mute)', margin: 0 }}>
            Removing a credential breaks any agent or tool that uses it.
          </p>
        </>
      )}
    </div>
  );
}
