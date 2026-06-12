// Webhook-subscriptions sub-client (application-gateway-service, /v1/webhook-subscriptions). A
// subscription routes an inbound, signed provider webhook (generic/github/stripe/slack) to a
// published agent. Creating one returns a DISPLAY-ONCE HMAC signing secret (whsec_…) and the
// ingress path to configure at the provider; the provider→gateway ingress endpoint itself
// (POST /v1/webhooks/{id}) is bearer-less and NOT called from the console.
import type { ApiTransport } from './transport';

export type SignatureScheme = 'generic' | 'github' | 'stripe' | 'slack';

export interface CreateSubscriptionInput {
  readonly agentSlug: string; // an ACTIVE published agent's slug
  readonly signatureScheme: SignatureScheme;
}

// The create response — carries the DISPLAY-ONCE signing secret. Hold it in memory only, show it
// once, never persist it (CLAUDE.md §1.5 / Gate 2).
export interface CreatedSubscription {
  readonly id: string;
  readonly agentSlug: string;
  readonly signatureScheme: string;
  readonly webhookPath: string; // the ingress path: /v1/webhooks/{id}
  readonly signingSecret: string; // whsec_… — DISPLAY-ONCE
}

// The redacted list view — never the signing secret.
export interface Subscription {
  readonly id: string;
  readonly agentSlug: string;
  readonly signatureScheme: string;
  readonly enabled: boolean;
  readonly createdAt: string | null;
}

interface CreateWire {
  id: string;
  agent_slug: string;
  signature_scheme: string;
  webhook_path: string;
  signing_secret: string;
}

// NOTE the wire asymmetry: create returns `agent_slug`, list returns `target_slug` for the same
// value. Both normalise to `agentSlug` (application-gateway-service webhook schemas).
interface SubscriptionWire {
  id: string;
  target_slug: string;
  signature_scheme: string;
  enabled: boolean;
  created_at: string | null;
}

function toCreated(w: CreateWire): CreatedSubscription {
  return {
    id: w.id,
    agentSlug: w.agent_slug,
    signatureScheme: w.signature_scheme,
    webhookPath: w.webhook_path,
    signingSecret: w.signing_secret,
  };
}

function toSubscription(w: SubscriptionWire): Subscription {
  return {
    id: w.id,
    agentSlug: w.target_slug,
    signatureScheme: w.signature_scheme,
    enabled: w.enabled,
    createdAt: w.created_at,
  };
}

export interface WebhookSubscriptionsClient {
  // Create a subscription (admin). Returns the DISPLAY-ONCE signing secret + ingress path.
  create(input: CreateSubscriptionInput): Promise<CreatedSubscription>;
  // List the org's subscriptions (member). Redacted — no secret.
  list(): Promise<Subscription[]>;
  // Delete a subscription (admin). 204; the ingress path stops accepting deliveries.
  remove(subscriptionId: string): Promise<void>;
}

export function createWebhookSubscriptionsClient(
  transport: ApiTransport
): WebhookSubscriptionsClient {
  return {
    async create(input: CreateSubscriptionInput): Promise<CreatedSubscription> {
      const { data } = await transport.execute<CreateWire>({
        method: 'POST',
        path: '/v1/webhook-subscriptions',
        body: { agent_slug: input.agentSlug, signature_scheme: input.signatureScheme },
      });
      return toCreated(data);
    },
    async list(): Promise<Subscription[]> {
      const { data } = await transport.execute<SubscriptionWire[]>({
        method: 'GET',
        path: '/v1/webhook-subscriptions',
      });
      return (Array.isArray(data) ? data : []).map(toSubscription);
    },
    async remove(subscriptionId: string): Promise<void> {
      await transport.execute<void>({
        method: 'DELETE',
        path: `/v1/webhook-subscriptions/${encodeURIComponent(subscriptionId)}`,
      });
    },
  };
}
