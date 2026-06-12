// Published agents — the developer surface for taking an agent to the outside world (issue #57 /
// Wave 2). An admin publishes an agent under a slug bound to a capability/harness descriptor; the
// agent is then invocable at POST /v1/agents/{slug}/invoke with an integration key bound to that
// slug. Each agent shows its public endpoint, a ready-to-run curl, and the keys bound to it (with a
// one-click "mint invoke key" that reuses the display-once flow). Unpublish awaits backend #280.
import { useId, useMemo, useState, type FormEvent } from 'react';
import { ApiClientError, type PublishAgentInput, type MintedKey } from '@oraclous/api-client';
import { useDash } from '../context/dash.js';
import { usePublishAgent, usePublishedAgents } from '../lib/publishedAgents.js';
import { useIntegrationKeys, useMintKey } from '../lib/integrationKeys.js';
import { useToast } from '../lib/toast.jsx';
import { DisplayOnceSecretModal } from '../components/DisplayOnceSecretModal.js';
import { DeveloperTabs } from '../components/DeveloperTabs.js';
import { SkeletonList } from '../components/ui/Skeleton.js';
import { IconBot } from '../icons/index.js';
import './developer.css';

function messageFor(cause: unknown): string {
  if (ApiClientError.is(cause)) return cause.message;
  return 'Something went wrong. Please try again.';
}

// The gateway origin the FE talks to — shown in the curl snippet so it's copy-paste runnable.
function gatewayOrigin(): string {
  const base = import.meta.env.VITE_API_BASE_URL;
  if (typeof base === 'string' && base.trim() !== '') return base.replace(/\/+$/, '');
  return window.location.origin;
}

function curlFor(slug: string): string {
  return [
    `curl -X POST ${gatewayOrigin()}/v1/agents/${slug}/invoke \\`,
    `  -H "Authorization: Bearer <your-integration-key>" \\`,
    `  -H "Content-Type: application/json" \\`,
    `  -d '{"input": "your message here"}'`,
  ].join('\n');
}

export default function PublishedAgentsPage() {
  const { currentOrg, persona } = useDash();
  const orgId = currentOrg?.id ?? '';
  const isAdmin = persona !== 'member';

  const { agents, isLoading, isError } = usePublishedAgents(orgId);
  const { keys, isLoading: keysLoading, isError: keysError } = useIntegrationKeys(orgId);
  const publish = usePublishAgent(orgId);
  const mint = useMintKey(orgId);
  const toast = useToast();

  const [slug, setSlug] = useState('');
  const [capabilityRef, setCapabilityRef] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [description, setDescription] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  const [revealed, setRevealed] = useState<MintedKey | null>(null);
  const [listError, setListError] = useState<string | null>(null);
  const [mintingFor, setMintingFor] = useState<string | null>(null);
  const [copiedSlug, setCopiedSlug] = useState<string | null>(null);

  const slugId = useId();
  const capId = useId();
  const nameId = useId();
  const descId = useId();

  const activeCount = useMemo(() => agents.filter((a) => a.status === 'active').length, [agents]);
  // The cross-joined key count is honest only once the keys query has settled — a loading/errored
  // empty list must not render as a real "0 active keys".
  const keysSettled = !keysLoading && !keysError;
  // Bound invoke keys grouped by the agent slug they authorise (client-side join — the key carries
  // bound_agent_slug; there is no agent→keys link on the wire). Revoked keys are dropped.
  const keysBySlug = useMemo(() => {
    const m = new Map<string, number>();
    for (const k of keys) {
      if (k.boundAgentSlug !== null && k.status === 'active') {
        m.set(k.boundAgentSlug, (m.get(k.boundAgentSlug) ?? 0) + 1);
      }
    }
    return m;
  }, [keys]);

  function resetForm() {
    setSlug('');
    setCapabilityRef('');
    setDisplayName('');
    setDescription('');
  }

  async function onPublish(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);
    const s = slug.trim();
    const ref = capabilityRef.trim();
    if (s === '') {
      setFormError('A slug is required — lowercase letters, numbers, and hyphens.');
      return;
    }
    if (ref === '') {
      setFormError('Bind the agent to a capability or harness reference.');
      return;
    }
    const input: PublishAgentInput = { slug: s, boundCapabilityRef: ref };
    if (displayName.trim() !== '')
      (input as { displayName?: string }).displayName = displayName.trim();
    if (description.trim() !== '')
      (input as { description?: string }).description = description.trim();
    try {
      await publish.mutateAsync(input);
      resetForm();
      toast.success('Agent published.');
    } catch (cause) {
      setFormError(messageFor(cause));
    }
  }

  async function onMintInvokeKey(agentSlug: string) {
    setListError(null);
    setMintingFor(agentSlug);
    try {
      const minted = await mint.mutateAsync({ boundAgentSlug: agentSlug });
      setRevealed(minted);
      // Drop the resolved plaintext from the mutation cache; `revealed` is now the only copy.
      mint.reset();
      toast.success('Invoke key minted.');
    } catch (cause) {
      setListError(messageFor(cause));
    } finally {
      setMintingFor(null);
    }
  }

  async function onCopyCurl(agentSlug: string) {
    try {
      await navigator.clipboard.writeText(curlFor(agentSlug));
      setCopiedSlug(agentSlug);
      window.setTimeout(() => setCopiedSlug((s) => (s === agentSlug ? null : s)), 1500);
    } catch {
      // Clipboard may be unavailable; the snippet stays selectable.
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
          <h1>Published agents</h1>
          <p className="sub">
            Publish an agent under a slug to make it callable from outside the console. Callers
            invoke it at <code>POST /v1/agents/&#123;slug&#125;/invoke</code> with an integration
            key bound to that slug.
          </p>
        </div>
      </div>

      <DeveloperTabs active="agents" />

      {/* Announces curl copy-success to assistive tech (mirrors the secret modal's live region). */}
      <span className="dev-sr-live" role="status" aria-live="polite">
        {copiedSlug !== null ? 'Copied curl command to clipboard.' : ''}
      </span>

      <div className="kpis">
        <div className="kpi">
          <span className="l">Published</span>
          <span className="v">{agents.length}</span>
        </div>
        <div className="kpi">
          <span className="l">Active</span>
          <span className="v">{activeCount}</span>
        </div>
      </div>

      {isAdmin && (
        <form className="card dev-mint" onSubmit={onPublish}>
          <div className="card-head">
            <div className="h">
              <h2>Publish an agent</h2>
              <span className="sub">Choose a slug and bind it to a capability or harness.</span>
            </div>
          </div>
          <div className="card-body">
            <div className="field-row">
              <div className="field">
                <label htmlFor={slugId}>Slug</label>
                <input
                  id={slugId}
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  placeholder="support-agent"
                  autoComplete="off"
                />
                <span className="hint">
                  Lowercase letters, numbers, hyphens. Unique in your org.
                </span>
              </div>
              <div className="field">
                <label htmlFor={capId}>Capability / harness reference</label>
                <input
                  id={capId}
                  value={capabilityRef}
                  onChange={(e) => setCapabilityRef(e.target.value)}
                  placeholder="harness:my-agent@1"
                  autoComplete="off"
                />
                <span className="hint">The descriptor the invoke call runs.</span>
              </div>
            </div>
            <div className="field-row">
              <div className="field">
                <label htmlFor={nameId}>Display name (optional)</label>
                <input
                  id={nameId}
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Support Agent"
                  autoComplete="off"
                />
              </div>
              <div className="field">
                <label htmlFor={descId}>Description (optional)</label>
                <input
                  id={descId}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Answers product questions"
                  autoComplete="off"
                />
              </div>
            </div>

            {formError !== null && (
              <p className="field" role="alert">
                <span className="error-text">{formError}</span>
              </p>
            )}

            <div className="btn-row">
              <button
                type="submit"
                className="btn"
                data-variant="primary"
                disabled={publish.isPending}
              >
                {publish.isPending ? 'Publishing…' : 'Publish agent'}
              </button>
            </div>
          </div>
        </form>
      )}

      <section className="card dev-list">
        <div className="card-head">
          <div className="h">
            <h2>Agents</h2>
            <span className="sub">{agents.length} published</span>
          </div>
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
              <span>Couldn’t load published agents.</span>
            </div>
          </div>
        ) : agents.length === 0 ? (
          <div className="empty">
            <span className="empty-icon" aria-hidden="true">
              <IconBot size={22} />
            </span>
            <span className="t">No published agents</span>
            <span className="s">
              {isAdmin
                ? 'Publish an agent above to make it callable from outside the console.'
                : 'An org admin can publish agents to make them callable from outside the console.'}
            </span>
          </div>
        ) : (
          <ul className="dev-agents" aria-label="Published agents">
            {agents.map((a) => {
              const boundKeys = keysBySlug.get(a.slug) ?? 0;
              return (
                <li key={a.id} className="dev-agent">
                  <div className="dev-agent-head">
                    <div className="dev-agent-id">
                      <span className="dev-agent-name">{a.displayName ?? a.slug}</span>
                      <span className="dev-agent-slug mono">/{a.slug}</span>
                    </div>
                    <span
                      className="status-pill"
                      data-state={a.status === 'active' ? 'active' : 'paused'}
                    >
                      <span className="dot" aria-hidden="true" />
                      {a.status}
                    </span>
                  </div>
                  {a.description !== null && a.description !== '' && (
                    <p className="dev-agent-desc">{a.description}</p>
                  )}
                  <p className="dev-agent-meta mono">
                    {a.boundCapabilityRef}
                    {/* Only state the key count once the keys query has settled — a loading/errored
                        empty list must not read as a genuine "0 keys". */}
                    {keysSettled && (
                      <>
                        {' '}
                        · {boundKeys} active {boundKeys === 1 ? 'key' : 'keys'}
                      </>
                    )}
                  </p>

                  <details className="dev-usage">
                    <summary>Usage</summary>
                    <div className="dev-usage-body">
                      {a.status !== 'active' && (
                        <div className="callout" data-tone="warning">
                          <span>
                            This agent is not active — invoke calls are rejected until it’s
                            published again.
                          </span>
                        </div>
                      )}
                      <p className="dev-usage-label">Public endpoint</p>
                      <code className="dev-endpoint mono">
                        POST {gatewayOrigin()}/v1/agents/{a.slug}/invoke
                      </code>
                      <div className="dev-curl-head">
                        <p className="dev-usage-label">Example request</p>
                        <button
                          type="button"
                          className="btn"
                          data-variant="ghost"
                          data-size="sm"
                          onClick={() => onCopyCurl(a.slug)}
                        >
                          {copiedSlug === a.slug ? 'Copied' : 'Copy'}
                        </button>
                      </div>
                      <pre className="dev-curl mono">{curlFor(a.slug)}</pre>
                      {isAdmin && (
                        <div className="btn-row">
                          <button
                            type="button"
                            className="btn"
                            data-variant="secondary"
                            data-size="sm"
                            disabled={mintingFor === a.slug || a.status !== 'active'}
                            onClick={() => onMintInvokeKey(a.slug)}
                          >
                            {mintingFor === a.slug ? 'Minting…' : 'Mint invoke key'}
                          </button>
                        </div>
                      )}
                    </div>
                  </details>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {revealed !== null && (
        <DisplayOnceSecretModal
          title="Invoke key created"
          secret={revealed.key}
          secretLabel="Secret key"
          note={
            <>
              Use this as the <code>Authorization: Bearer</code> token when calling the agent’s
              invoke endpoint. It is bound to <code>/{revealed.boundAgentSlug ?? ''}</code> and
              shown only once.
            </>
          }
          fields={[
            { label: 'Key prefix', value: revealed.keyPrefix },
            ...(revealed.boundAgentSlug !== null
              ? [{ label: 'Bound agent', value: revealed.boundAgentSlug }]
              : []),
          ]}
          onClose={() => setRevealed(null)}
        />
      )}
    </div>
  );
}
