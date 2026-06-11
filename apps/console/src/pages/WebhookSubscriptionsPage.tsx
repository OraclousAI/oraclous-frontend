// Webhook subscriptions — the developer surface for receiving signed provider webhooks (issue #57
// / Wave 2). An admin subscribes a published agent to an inbound webhook under a signature scheme
// (generic/github/stripe/slack); creating one reveals a display-once HMAC signing secret and the
// ingress path to configure at the provider. There is no edit/rotate — delete + recreate to roll
// the secret (oraclous-backend has no rotate endpoint). The provider→gateway ingress endpoint is
// bearer-less and not called from here.
import { useId, useMemo, useState, type FormEvent } from 'react';
import {
  ApiClientError,
  type CreatedSubscription,
  type SignatureScheme,
} from '@oraclous/api-client';
import { useDash } from '../context/dash.js';
import {
  useCreateSubscription,
  useDeleteSubscription,
  useWebhookSubscriptions,
} from '../lib/webhookSubscriptions.js';
import { usePublishedAgents } from '../lib/publishedAgents.js';
import { useToast } from '../lib/toast.jsx';
import { DisplayOnceSecretModal } from '../components/DisplayOnceSecretModal.js';
import { DeveloperTabs } from '../components/DeveloperTabs.js';
import { SkeletonList } from '../components/ui/Skeleton.js';
import { IconGlobe } from '../icons/index.js';
import './developer.css';

const SCHEMES: readonly { id: SignatureScheme; label: string }[] = [
  { id: 'generic', label: 'Generic HMAC' },
  { id: 'github', label: 'GitHub' },
  { id: 'stripe', label: 'Stripe' },
  { id: 'slack', label: 'Slack' },
];

// What the provider sends so its signature verifies against the signing secret.
function schemeHint(scheme: string): string {
  switch (scheme) {
    case 'github':
      return 'GitHub signs deliveries as X-Hub-Signature-256: sha256=<hmac>.';
    case 'stripe':
      return 'Stripe signs deliveries as Stripe-Signature: t=<timestamp>,v1=<hmac>.';
    case 'slack':
      return 'Slack signs with X-Slack-Signature and X-Slack-Request-Timestamp.';
    default:
      return 'Generic HMAC-SHA256 of the raw request body.';
  }
}

function messageFor(cause: unknown): string {
  if (ApiClientError.is(cause)) return cause.message;
  return 'Something went wrong. Please try again.';
}

function formatDate(iso: string | null): string {
  if (iso === null) return '—';
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? '—' : d.toLocaleDateString();
}

export default function WebhookSubscriptionsPage() {
  const { currentOrg, persona } = useDash();
  const orgId = currentOrg?.id ?? '';
  const isAdmin = persona !== 'member';

  const { subscriptions, isLoading, isError } = useWebhookSubscriptions(orgId);
  const { agents, isLoading: agentsLoading, isError: agentsError } = usePublishedAgents(orgId);
  const create = useCreateSubscription(orgId);
  const del = useDeleteSubscription(orgId);
  const toast = useToast();

  const activeAgents = useMemo(() => agents.filter((a) => a.status === 'active'), [agents]);
  // Only assert "no agents" once the agents query has actually settled — a loading/errored empty
  // list must not read as a genuine zero (mirrors PublishedAgentsPage's keysSettled guard).
  const agentsSettled = !agentsLoading && !agentsError;

  const [agentSlug, setAgentSlug] = useState('');
  const [scheme, setScheme] = useState<SignatureScheme>('generic');
  const [formError, setFormError] = useState<string | null>(null);

  const [revealed, setRevealed] = useState<CreatedSubscription | null>(null);
  const [listError, setListError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const agentId = useId();
  const schemeId = useId();
  const errId = useId();

  const enabledCount = useMemo(
    () => subscriptions.filter((s) => s.enabled).length,
    [subscriptions]
  );

  async function onCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);
    const slug = agentSlug.trim();
    if (slug === '') {
      setFormError('Choose a published agent to route deliveries to.');
      return;
    }
    try {
      const created = await create.mutateAsync({ agentSlug: slug, signatureScheme: scheme });
      setRevealed(created);
      // Drop the resolved signing secret from the mutation cache; `revealed` is the only copy.
      create.reset();
      setAgentSlug('');
      setScheme('generic');
      toast.success('Webhook subscription created.');
    } catch (cause) {
      setFormError(messageFor(cause));
    }
  }

  async function onDelete(subscriptionId: string) {
    if (busyId !== null) return;
    setListError(null);
    setBusyId(subscriptionId);
    try {
      await del.mutateAsync(subscriptionId);
      toast.success('Subscription deleted.');
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
          <h1>Webhooks</h1>
          <p className="sub">
            Route signed provider webhooks (GitHub, Stripe, Slack, or generic HMAC) to a published
            agent. Creating a subscription reveals a signing secret once — configure it at the
            provider so deliveries verify.
          </p>
        </div>
      </div>

      <DeveloperTabs active="webhooks" />

      <div className="kpis">
        <div className="kpi">
          <span className="l">Subscriptions</span>
          <span className="v">{subscriptions.length}</span>
        </div>
        <div className="kpi">
          <span className="l">Enabled</span>
          <span className="v">{enabledCount}</span>
        </div>
      </div>

      {isAdmin && (
        <form className="card dev-mint" onSubmit={onCreate}>
          <div className="card-head">
            <div className="h">
              <h2>Create a subscription</h2>
              <span className="sub">
                Pick a published agent and the provider’s signature scheme.
              </span>
            </div>
          </div>
          <div className="card-body">
            {!agentsSettled ? (
              agentsError ? (
                <div className="callout" data-tone="error">
                  <span>Couldn’t load your published agents. Reload to try again.</span>
                </div>
              ) : (
                <SkeletonList rows={1} />
              )
            ) : activeAgents.length === 0 ? (
              <div className="callout" data-tone="warning">
                <span>
                  Publish an agent first — a webhook subscription routes deliveries to an active
                  published agent.
                </span>
              </div>
            ) : (
              <>
                <div className="field-row">
                  <div className="field">
                    <label htmlFor={agentId}>Agent</label>
                    <select
                      id={agentId}
                      value={agentSlug}
                      onChange={(e) => setAgentSlug(e.target.value)}
                      aria-invalid={formError !== null && agentSlug === '' ? true : undefined}
                      aria-describedby={formError !== null ? errId : undefined}
                    >
                      <option value="">Select an agent…</option>
                      {activeAgents.map((a) => (
                        <option key={a.id} value={a.slug}>
                          {a.displayName ?? a.slug} (/{a.slug})
                        </option>
                      ))}
                    </select>
                    <span className="hint">Deliveries are forwarded to this agent.</span>
                  </div>
                  <div className="field">
                    <label htmlFor={schemeId}>Signature scheme</label>
                    <select
                      id={schemeId}
                      value={scheme}
                      onChange={(e) => setScheme(e.target.value as SignatureScheme)}
                    >
                      {SCHEMES.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.label}
                        </option>
                      ))}
                    </select>
                    <span className="hint">{schemeHint(scheme)}</span>
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
                    disabled={create.isPending}
                  >
                    {create.isPending ? 'Creating…' : 'Create subscription'}
                  </button>
                </div>
              </>
            )}
          </div>
        </form>
      )}

      <section className="card dev-list">
        <div className="card-head">
          <div className="h">
            <h2>Subscriptions</h2>
            <span className="sub">{subscriptions.length} total</span>
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
              <span>Couldn’t load webhook subscriptions.</span>
            </div>
          </div>
        ) : subscriptions.length === 0 ? (
          <div className="empty">
            <span className="empty-icon" aria-hidden="true">
              <IconGlobe size={22} />
            </span>
            <span className="t">No webhook subscriptions</span>
            <span className="s">
              {isAdmin
                ? 'Create one above to route a provider’s signed webhooks to an agent.'
                : 'An org admin can subscribe agents to inbound provider webhooks.'}
            </span>
          </div>
        ) : (
          <ul className="dev-agents" aria-label="Webhook subscriptions">
            {subscriptions.map((s) => (
              <li key={s.id} className="dev-agent">
                <div className="dev-agent-head">
                  <div className="dev-agent-id">
                    <span className="dev-agent-name">/{s.agentSlug}</span>
                    <span className="chip chip-sm">{s.signatureScheme}</span>
                  </div>
                  <div className="dev-sub-right">
                    <span className="status-pill" data-state={s.enabled ? 'active' : 'paused'}>
                      <span className="dot" aria-hidden="true" />
                      {s.enabled ? 'enabled' : 'disabled'}
                    </span>
                    {isAdmin && (
                      <button
                        type="button"
                        className="btn"
                        data-variant="danger"
                        data-size="sm"
                        disabled={busyId !== null}
                        onClick={() => onDelete(s.id)}
                      >
                        Delete
                      </button>
                    )}
                  </div>
                </div>
                <p className="dev-agent-meta mono">
                  Ingress: /v1/webhooks/{s.id} · created {formatDate(s.createdAt)}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>

      {revealed !== null && (
        <DisplayOnceSecretModal
          title="Webhook subscription created"
          secret={revealed.signingSecret}
          secretLabel="Signing secret"
          note={
            <>
              {schemeHint(revealed.signatureScheme)} Configure your provider to POST deliveries to
              the ingress path below and sign them with this secret. To roll the secret, delete this
              subscription and create a new one.
            </>
          }
          fields={[
            { label: 'Ingress path', value: revealed.webhookPath },
            { label: 'Agent', value: revealed.agentSlug },
            { label: 'Scheme', value: revealed.signatureScheme },
          ]}
          onClose={() => setRevealed(null)}
        />
      )}
    </div>
  );
}
