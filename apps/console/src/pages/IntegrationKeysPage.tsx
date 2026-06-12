// Integration keys — the developer surface for minting org-scoped API keys (issue #57 / Wave 2).
// An admin mints a key bound EITHER to a published agent OR to a capability allow-list,
// optionally with per-key CORS origins, a rate cap, and an expiry; the plaintext is revealed once
// via DisplayOnceSecretModal and never persisted. Members see the redacted list read-only.
import { useId, useMemo, useRef, useState, type FormEvent } from 'react';
import {
  ApiClientError,
  type KeySummary,
  type MintedKey,
  type MintKeyInput,
} from '@oraclous/api-client';
import { useDash } from '../context/dash.js';
import {
  useIntegrationKeys,
  useMintKey,
  useRevokeKey,
  useRotateKey,
} from '../lib/integrationKeys.js';
import { useToast } from '../lib/toast.jsx';
import { DisplayOnceSecretModal } from '../components/DisplayOnceSecretModal.js';
import { DeveloperTabs } from '../components/DeveloperTabs.js';
import { SkeletonList } from '../components/ui/Skeleton.js';
import { IconKey } from '../icons/index.js';
import './developer.css';

function messageFor(cause: unknown): string {
  if (ApiClientError.is(cause)) return cause.message;
  return 'Something went wrong. Please try again.';
}

function formatDate(iso: string | null): string {
  if (iso === null) return '—';
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? '—' : d.toLocaleDateString();
}

// Comma/whitespace-separated free text → a clean string list (CORS origins, capability refs).
function splitList(raw: string): string[] {
  return raw
    .split(/[\s,]+/)
    .map((s) => s.trim())
    .filter((s) => s !== '');
}

function bindingLabel(k: KeySummary): string {
  if (k.boundAgentSlug !== null) return k.boundAgentSlug;
  const n = k.capabilityAllowList?.length ?? 0;
  return n > 0 ? `${n} capabilit${n === 1 ? 'y' : 'ies'}` : '—';
}

export default function IntegrationKeysPage() {
  const { currentOrg, persona } = useDash();
  const orgId = currentOrg?.id ?? '';
  // The console models admin as the org owner (or a standalone personal org); members are read-only
  // on this surface, matching the gateway's AdminDep on mint/rotate/revoke.
  const isAdmin = persona !== 'member';

  const { keys, isLoading, isError } = useIntegrationKeys(orgId);
  const mint = useMintKey(orgId);
  const rotate = useRotateKey(orgId);
  const revoke = useRevokeKey(orgId);
  const toast = useToast();

  // Mint form
  const [bindMode, setBindMode] = useState<'agent' | 'capabilities'>('agent');
  const [agentSlug, setAgentSlug] = useState('');
  const [capabilities, setCapabilities] = useState('');
  const [corsOrigins, setCorsOrigins] = useState('');
  const [rateLimit, setRateLimit] = useState('');
  const [rateWindow, setRateWindow] = useState('');
  const [expiresAt, setExpiresAt] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  // Which field a client-side validation error belongs to — drives aria-invalid + focus (the
  // console's error-association convention, see CreateOrgPage). null for form-level/server errors.
  const [errorField, setErrorField] = useState<'agent' | 'capabilities' | 'rate' | 'expiry' | null>(
    null
  );

  // The one-time plaintext, held in state only for the modal's lifetime (never persisted).
  const [revealed, setRevealed] = useState<MintedKey | null>(null);
  const [revealTitle, setRevealTitle] = useState('Integration key created');
  const [listError, setListError] = useState<string | null>(null);
  const [showRevoked, setShowRevoked] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

  const agentId = useId();
  const capId = useId();
  const corsId = useId();
  const rateId = useId();
  const windowId = useId();
  const expId = useId();
  const errId = useId();
  const agentRef = useRef<HTMLInputElement>(null);
  const capRef = useRef<HTMLInputElement>(null);
  const rateRef = useRef<HTMLInputElement>(null);
  const expRef = useRef<HTMLInputElement>(null);

  const visibleKeys = useMemo(
    () => (showRevoked ? keys : keys.filter((k) => k.status !== 'revoked')),
    [keys, showRevoked]
  );
  const activeCount = useMemo(() => keys.filter((k) => k.status === 'active').length, [keys]);
  const revokedCount = keys.length - activeCount;

  function resetForm() {
    setAgentSlug('');
    setCapabilities('');
    setCorsOrigins('');
    setRateLimit('');
    setRateWindow('');
    setExpiresAt('');
  }

  // Set a field-scoped validation error and move focus to the offending control.
  function failField(
    field: 'agent' | 'capabilities' | 'rate' | 'expiry',
    message: string,
    ref: React.RefObject<HTMLInputElement | null>
  ) {
    setErrorField(field);
    setFormError(message);
    ref.current?.focus();
  }

  async function onMint(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);
    setErrorField(null);

    const input: MintKeyInput = {};
    if (bindMode === 'agent') {
      const slug = agentSlug.trim();
      if (slug === '') {
        failField('agent', 'Enter the slug of the published agent this key may invoke.', agentRef);
        return;
      }
      (input as { boundAgentSlug?: string }).boundAgentSlug = slug;
    } else {
      const caps = splitList(capabilities);
      if (caps.length === 0) {
        failField(
          'capabilities',
          'List at least one capability reference this key may use.',
          capRef
        );
        return;
      }
      (input as { capabilityAllowList?: string[] }).capabilityAllowList = caps;
    }

    const cors = splitList(corsOrigins);
    if (cors.length > 0) (input as { corsOrigins?: string[] }).corsOrigins = cors;
    if (rateLimit.trim() !== '') {
      const n = Number(rateLimit);
      if (!Number.isFinite(n) || n <= 0) {
        failField('rate', 'Rate limit must be a positive number of requests.', rateRef);
        return;
      }
      (input as { rateLimit?: number }).rateLimit = Math.floor(n);
      // A window only means something alongside a limit; default to 60s if a limit is set bare.
      if (rateWindow.trim() !== '') {
        const w = Number(rateWindow);
        if (!Number.isFinite(w) || w <= 0) {
          failField('rate', 'Rate window must be a positive number of seconds.', rateRef);
          return;
        }
        (input as { rateWindowSeconds?: number }).rateWindowSeconds = Math.floor(w);
      }
    }
    if (expiresAt !== '') {
      const d = new Date(expiresAt);
      if (Number.isNaN(d.getTime())) {
        failField('expiry', 'Expiry is not a valid date.', expRef);
        return;
      }
      (input as { expiresAt?: string }).expiresAt = d.toISOString();
    }

    try {
      const minted = await mint.mutateAsync(input);
      setRevealTitle('Integration key created');
      setRevealed(minted);
      // Drop the resolved plaintext from the mutation cache; `revealed` is now the only copy.
      mint.reset();
      resetForm();
      toast.success('Integration key minted.');
    } catch (cause) {
      setFormError(messageFor(cause));
    }
  }

  async function onRotate(keyId: string) {
    if (busyId !== null) return; // one row action at a time — don't re-enable an in-flight row
    setListError(null);
    setBusyId(keyId);
    try {
      const minted = await rotate.mutateAsync(keyId);
      setRevealTitle('Integration key rotated');
      setRevealed(minted);
      rotate.reset();
      toast.success('Key rotated — the previous secret no longer works.');
    } catch (cause) {
      setListError(messageFor(cause));
    } finally {
      setBusyId(null);
    }
  }

  async function onRevoke(keyId: string) {
    if (busyId !== null) return;
    setListError(null);
    setBusyId(keyId);
    try {
      await revoke.mutateAsync(keyId);
      toast.success('Key revoked.');
    } catch (cause) {
      setListError(messageFor(cause));
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="dev-page">
      <div className="page-head">
        <div>
          <span className="eyebrow">
            <span className="dot" aria-hidden="true" />
            Developer
          </span>
          <h1>Integration keys</h1>
          <p className="sub">
            Org-scoped API keys for calling your published agents and capabilities from outside the
            console. A key is bound to one agent or a capability allow-list; its secret is shown
            once at creation and never again.
          </p>
        </div>
      </div>

      <DeveloperTabs active="keys" />

      <div className="kpis">
        <div className="kpi">
          <span className="l">Keys</span>
          <span className="v">{keys.length}</span>
        </div>
        <div className="kpi">
          <span className="l">Active</span>
          <span className="v">{activeCount}</span>
        </div>
        <div className="kpi">
          <span className="l">Revoked</span>
          <span className={'v' + (revokedCount === 0 ? ' is-mute' : '')}>{revokedCount}</span>
        </div>
      </div>

      {isAdmin && (
        <form className="card dev-mint" onSubmit={onMint}>
          <div className="card-head">
            <div className="h">
              <h2>Mint a key</h2>
              <span className="sub">Bind it to a published agent or to specific capabilities.</span>
            </div>
          </div>
          <div className="card-body">
            <fieldset className="dev-binding">
              <legend>Binding</legend>
              <label className="dev-radio">
                <input
                  type="radio"
                  name="bind"
                  checked={bindMode === 'agent'}
                  onChange={() => setBindMode('agent')}
                />
                Published agent
              </label>
              <label className="dev-radio">
                <input
                  type="radio"
                  name="bind"
                  checked={bindMode === 'capabilities'}
                  onChange={() => setBindMode('capabilities')}
                />
                Capability allow-list
              </label>
            </fieldset>

            {bindMode === 'agent' ? (
              <div className="field">
                <label htmlFor={agentId}>Agent slug</label>
                <input
                  id={agentId}
                  ref={agentRef}
                  value={agentSlug}
                  onChange={(e) => setAgentSlug(e.target.value)}
                  placeholder="my-support-agent"
                  autoComplete="off"
                  aria-invalid={errorField === 'agent' || undefined}
                  aria-describedby={errorField === 'agent' ? errId : undefined}
                />
                <span className="hint">
                  The slug of a published agent in this org. The key may call only that agent.
                </span>
              </div>
            ) : (
              <div className="field">
                <label htmlFor={capId}>Capabilities</label>
                <input
                  id={capId}
                  ref={capRef}
                  value={capabilities}
                  onChange={(e) => setCapabilities(e.target.value)}
                  placeholder="capability-ref-1, capability-ref-2"
                  autoComplete="off"
                  aria-invalid={errorField === 'capabilities' || undefined}
                  aria-describedby={errorField === 'capabilities' ? errId : undefined}
                />
                <span className="hint">Comma- or space-separated capability references.</span>
              </div>
            )}

            <div className="field-row">
              <div className="field">
                <label htmlFor={corsId}>CORS origins (optional)</label>
                <input
                  id={corsId}
                  value={corsOrigins}
                  onChange={(e) => setCorsOrigins(e.target.value)}
                  placeholder="https://app.example.com"
                  autoComplete="off"
                />
                <span className="hint">
                  Exact origins (scheme://host[:port]), no trailing slash.
                </span>
              </div>
              <div className="field">
                <label htmlFor={rateId}>Rate limit (optional)</label>
                <input
                  id={rateId}
                  ref={rateRef}
                  type="number"
                  min="1"
                  value={rateLimit}
                  onChange={(e) => setRateLimit(e.target.value)}
                  placeholder="requests"
                  aria-invalid={errorField === 'rate' || undefined}
                  aria-describedby={errorField === 'rate' ? errId : undefined}
                />
                <span className="hint">Max requests per window (below).</span>
              </div>
            </div>

            <div className="field-row">
              <div className="field">
                <label htmlFor={windowId}>Rate window (optional)</label>
                <input
                  id={windowId}
                  type="number"
                  min="1"
                  value={rateWindow}
                  onChange={(e) => setRateWindow(e.target.value)}
                  placeholder="seconds"
                />
                <span className="hint">Window for the limit, in seconds (defaults to 60).</span>
              </div>
              <div className="field">
                <label htmlFor={expId}>Expires (optional)</label>
                <input
                  id={expId}
                  ref={expRef}
                  type="datetime-local"
                  value={expiresAt}
                  onChange={(e) => setExpiresAt(e.target.value)}
                  aria-invalid={errorField === 'expiry' || undefined}
                  aria-describedby={errorField === 'expiry' ? errId : undefined}
                />
                <span className="hint">Leave empty for a key with no expiry.</span>
              </div>
            </div>

            {formError !== null && (
              <p id={errId} className="field" role="alert">
                <span className="error-text">{formError}</span>
              </p>
            )}

            <div className="btn-row">
              <button
                type="submit"
                className="btn"
                data-variant="primary"
                disabled={mint.isPending}
              >
                {mint.isPending ? 'Minting…' : 'Mint key'}
              </button>
            </div>
          </div>
        </form>
      )}

      <section className="card dev-list">
        <div className="card-head">
          <div className="h">
            <h2>Keys</h2>
            <span className="sub">{visibleKeys.length} shown</span>
          </div>
          {revokedCount > 0 && (
            <label className="dev-toggle">
              <input
                type="checkbox"
                checked={showRevoked}
                onChange={(e) => setShowRevoked(e.target.checked)}
              />
              Show revoked
            </label>
          )}
        </div>

        {listError !== null && (
          <div className="card-body">
            <div className="callout" data-tone="error" role="alert">
              <span>{listError}</span>
            </div>
          </div>
        )}

        {isLoading ? (
          <div className="card-body">
            <SkeletonList rows={3} />
          </div>
        ) : isError ? (
          <div className="card-body">
            <div className="callout" data-tone="error">
              <span>Couldn’t load integration keys.</span>
            </div>
          </div>
        ) : visibleKeys.length === 0 ? (
          <div className="empty">
            <span className="empty-icon" aria-hidden="true">
              <IconKey size={22} />
            </span>
            {keys.length > 0 ? (
              <>
                <span className="t">No active keys</span>
                <span className="s">
                  Every key has been revoked. Turn on “Show revoked” above to see them.
                </span>
              </>
            ) : (
              <>
                <span className="t">No integration keys</span>
                <span className="s">
                  {isAdmin
                    ? 'Mint a key above to call your agents from outside the console.'
                    : 'An org admin can mint keys for calling agents from outside the console.'}
                </span>
              </>
            )}
          </div>
        ) : (
          <div className="card-body no-pad">
            <div
              className="table dev-table"
              role="table"
              aria-label="Integration keys"
              {...(isAdmin ? { 'data-admin': '' } : {})}
            >
              <div className="table-head" role="row">
                <span role="columnheader">Key</span>
                <span role="columnheader">Binding</span>
                <span role="columnheader">Rate</span>
                <span role="columnheader">Status</span>
                <span role="columnheader">Created</span>
                {isAdmin && <span role="columnheader">Actions</span>}
              </div>
              {visibleKeys.map((k) => (
                <div className="table-row" role="row" key={k.id}>
                  <span role="cell" className="mono" title={k.keyPrefix}>
                    {k.keyPrefix}
                    {k.last4 !== null && <span className="mute">···{k.last4}</span>}
                  </span>
                  <span role="cell">{bindingLabel(k)}</span>
                  <span role="cell" className="mono">
                    {k.rateLimit !== null ? (
                      <>
                        {k.rateLimit}
                        {k.rateWindowSeconds !== null && (
                          <span className="mute">/{k.rateWindowSeconds}s</span>
                        )}
                      </>
                    ) : (
                      <span className="mute">—</span>
                    )}
                  </span>
                  <span role="cell">
                    <span
                      className="status-pill"
                      data-state={k.status === 'active' ? 'active' : 'paused'}
                    >
                      <span className="dot" aria-hidden="true" />
                      {k.status}
                    </span>
                  </span>
                  <span role="cell" className="mono mute">
                    {formatDate(k.createdAt)}
                  </span>
                  {isAdmin && (
                    <span role="cell" className="dev-actions">
                      {k.status === 'active' ? (
                        <>
                          <button
                            type="button"
                            className="btn"
                            data-variant="secondary"
                            data-size="sm"
                            disabled={busyId !== null}
                            onClick={() => onRotate(k.id)}
                          >
                            {busyId === k.id ? '…' : 'Rotate'}
                          </button>
                          <button
                            type="button"
                            className="btn"
                            data-variant="danger"
                            data-size="sm"
                            disabled={busyId !== null}
                            onClick={() => onRevoke(k.id)}
                          >
                            Revoke
                          </button>
                        </>
                      ) : (
                        <span className="mute">revoked</span>
                      )}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </section>

      {revealed !== null && (
        <DisplayOnceSecretModal
          title={revealTitle}
          secret={revealed.key}
          secretLabel="Secret key"
          note={
            <>
              Send this as <code>Authorization: Bearer &lt;key&gt;</code> when calling the bound
              agent’s public endpoint. Only <code>{revealed.keyPrefix}</code> identifies it
              afterwards.
            </>
          }
          fields={[
            { label: 'Key prefix', value: revealed.keyPrefix },
            ...(revealed.boundAgentSlug !== null
              ? [{ label: 'Bound agent', value: revealed.boundAgentSlug }]
              : []),
            ...(revealed.capabilityAllowList !== null &&
            revealed.capabilityAllowList !== undefined &&
            revealed.capabilityAllowList.length > 0
              ? [{ label: 'Capabilities', value: revealed.capabilityAllowList.join(', ') }]
              : []),
          ]}
          onClose={() => setRevealed(null)}
        />
      )}
    </div>
  );
}
