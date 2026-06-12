// Integration-keys sub-client (application-gateway-service, /v1/integration-keys). Org-scoped
// developer credentials: an admin mints a key bound EITHER to a published-agent slug OR to a
// capability allow-list (exactly one), optionally with per-key CORS origins, a rate cap, and an
// expiry. The plaintext token is DISPLAY-ONCE — returned only by mint and rotate, never stored
// server-side and never echoed by list/get (which carry only key_prefix + last4 to identify it).
import type { ApiTransport } from './transport';

// What the caller supplies at mint. The gateway enforces "exactly one of boundAgentSlug XOR
// capabilityAllowList" (422 otherwise); this type keeps both optional and lets the form/backend
// enforce the XOR. cors_origins are exact scheme://host[:port] origins (no trailing slash).
export interface MintKeyInput {
  readonly boundAgentSlug?: string;
  readonly capabilityAllowList?: readonly string[];
  readonly corsOrigins?: readonly string[];
  readonly rateLimit?: number;
  readonly rateWindowSeconds?: number;
  readonly expiresAt?: string; // ISO 8601
}

// The mint/rotate response — carries the one-time plaintext `key`. Hold it in memory only, show
// it once, never persist it (CLAUDE.md §1.5 / Gate 2).
export interface MintedKey {
  readonly id: string;
  readonly key: string; // plaintext `oak-<prefix>-<secret>` — DISPLAY-ONCE
  readonly keyPrefix: string;
  readonly last4: string | null;
  readonly boundAgentSlug: string | null;
  readonly capabilityAllowList: readonly string[] | null;
  readonly status: string;
}

// The redacted view returned by list/get — never the secret.
export interface KeySummary {
  readonly id: string;
  readonly keyPrefix: string;
  readonly last4: string | null;
  readonly boundAgentSlug: string | null;
  readonly capabilityAllowList: readonly string[] | null;
  readonly corsOrigins: readonly string[] | null;
  readonly rateLimit: number | null;
  // The window (seconds) the rate limit applies over — surfaced by the gateway since #282; null
  // when the key has no rate cap.
  readonly rateWindowSeconds: number | null;
  readonly status: string; // 'active' | 'revoked'
  readonly expiresAt: string | null;
  readonly createdAt: string | null;
}

interface MintedKeyWire {
  id: string;
  key: string;
  key_prefix: string;
  last4: string | null;
  bound_agent_slug: string | null;
  capability_allow_list: string[] | null;
  status: string;
}

interface KeyOutWire {
  id: string;
  key_prefix: string;
  last4: string | null;
  bound_agent_slug: string | null;
  capability_allow_list: string[] | null;
  cors_origins: string[] | null;
  rate_limit: number | null;
  rate_window_seconds: number | null;
  status: string;
  expires_at: string | null;
  created_at: string | null;
}

function toMintedKey(w: MintedKeyWire): MintedKey {
  return {
    id: w.id,
    key: w.key,
    keyPrefix: w.key_prefix,
    last4: w.last4,
    boundAgentSlug: w.bound_agent_slug,
    capabilityAllowList: w.capability_allow_list,
    status: w.status,
  };
}

function toKeySummary(w: KeyOutWire): KeySummary {
  return {
    id: w.id,
    keyPrefix: w.key_prefix,
    last4: w.last4,
    boundAgentSlug: w.bound_agent_slug,
    capabilityAllowList: w.capability_allow_list,
    corsOrigins: w.cors_origins,
    rateLimit: w.rate_limit,
    rateWindowSeconds: w.rate_window_seconds ?? null,
    status: w.status,
    expiresAt: w.expires_at,
    createdAt: w.created_at,
  };
}

export interface IntegrationKeysClient {
  // Mint a new key (admin). Returns the DISPLAY-ONCE plaintext token — capture it from here only.
  mint(input: MintKeyInput): Promise<MintedKey>;
  // List the org's keys (member). Redacted — no secret.
  list(): Promise<KeySummary[]>;
  // One key by id (member). Redacted.
  get(keyId: string): Promise<KeySummary>;
  // Rotate a key's secret (admin). Returns a NEW DISPLAY-ONCE token; the old one is invalidated.
  rotate(keyId: string): Promise<MintedKey>;
  // Revoke a key (admin). Soft delete — the key reads back `status: 'revoked'` and fails closed.
  revoke(keyId: string): Promise<void>;
}

export function createIntegrationKeysClient(transport: ApiTransport): IntegrationKeysClient {
  return {
    async mint(input: MintKeyInput): Promise<MintedKey> {
      const body: Record<string, unknown> = {};
      if (input.boundAgentSlug !== undefined) body['bound_agent_slug'] = input.boundAgentSlug;
      if (input.capabilityAllowList !== undefined)
        body['capability_allow_list'] = input.capabilityAllowList;
      if (input.corsOrigins !== undefined) body['cors_origins'] = input.corsOrigins;
      if (input.rateLimit !== undefined) body['rate_limit'] = input.rateLimit;
      if (input.rateWindowSeconds !== undefined)
        body['rate_window_seconds'] = input.rateWindowSeconds;
      if (input.expiresAt !== undefined) body['expires_at'] = input.expiresAt;
      const { data } = await transport.execute<MintedKeyWire>({
        method: 'POST',
        path: '/v1/integration-keys',
        body,
      });
      return toMintedKey(data);
    },
    async list(): Promise<KeySummary[]> {
      const { data } = await transport.execute<KeyOutWire[]>({
        method: 'GET',
        path: '/v1/integration-keys',
      });
      return (Array.isArray(data) ? data : []).map(toKeySummary);
    },
    async get(keyId: string): Promise<KeySummary> {
      const { data } = await transport.execute<KeyOutWire>({
        method: 'GET',
        path: `/v1/integration-keys/${encodeURIComponent(keyId)}`,
      });
      return toKeySummary(data);
    },
    async rotate(keyId: string): Promise<MintedKey> {
      const { data } = await transport.execute<MintedKeyWire>({
        method: 'POST',
        path: `/v1/integration-keys/${encodeURIComponent(keyId)}/rotate`,
      });
      return toMintedKey(data);
    },
    async revoke(keyId: string): Promise<void> {
      await transport.execute<void>({
        method: 'DELETE',
        path: `/v1/integration-keys/${encodeURIComponent(keyId)}`,
      });
    },
  };
}
