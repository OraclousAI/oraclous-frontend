// Auth sub-client. Standalone (not part of createApiClient) because authentication
// happens BEFORE the app has a session: login is a public gateway path and needs no
// token, whereas the app client is used once authenticated. Shares the same transport.

import type { ApiTransport } from './transport';
import type { AuthPrincipal, AuthSession, LoginInput } from './types/auth';

interface TokenResponseWire {
  readonly access_token: string;
  readonly refresh_token: string;
  readonly token_type: string;
  readonly expires_in: number;
  readonly email: string;
  readonly is_superuser: boolean;
}

interface MeResponseWire {
  readonly id: string;
  readonly principal_type: string;
  readonly organisation_id: string;
  readonly email: string | null;
}

export interface AuthClient {
  // POST /v1/auth/login — public gateway path; exchanges credentials for a session.
  login(input: LoginInput): Promise<AuthSession>;
  // POST /v1/auth/register — public; creates an account (email + password) and returns a session.
  register(input: LoginInput): Promise<AuthSession>;
  // GET /oauth/providers — the OAuth providers with credentials configured (names only).
  oauthProviders(): Promise<string[]>;
  // GET /oauth/{provider}/login — the provider authorize URL to redirect the browser to (PKCE).
  oauthLoginUrl(provider: string, redirectUri: string): Promise<string>;
  // GET /oauth/{provider}/callback — exchange the returned code+state for a session.
  oauthCallback(provider: string, code: string, state: string): Promise<AuthSession>;
  // POST /oauth/{provider}/connect — begin a provider *connect* (authed, distinct from login): returns
  // the authorize URL to redirect to, requesting the given scopes. Connect binds a token to the
  // signed-in user, it does NOT issue a session.
  oauthConnectBegin(
    provider: string,
    redirectUri: string,
    scopes?: readonly string[]
  ): Promise<string>;
  // POST /oauth/{provider}/connect/complete — exchange the returned code+state; the backend lands the
  // provider token as a broker credential for the authenticated caller (the secret never reaches the
  // FE). Returns the new credential id — no session.
  oauthConnectComplete(
    provider: string,
    code: string,
    state: string
  ): Promise<{ provider: string; credentialId: string }>;
  // GET /v1/auth/me — the authenticated principal (requires a bearer token).
  me(): Promise<AuthPrincipal>;
  // POST /v1/auth/refresh — exchange a (rotating) refresh token for a fresh session.
  refresh(refreshToken: string): Promise<AuthSession>;
  // POST /v1/auth/switch-org — re-issue the session scoped to another org the user belongs to.
  switchOrg(organisationId: string): Promise<AuthSession>;
  // POST /v1/auth/change-password — set a new password for the authenticated user.
  changePassword(newPassword: string): Promise<void>;
}

function toSession(wire: TokenResponseWire): AuthSession {
  return {
    accessToken: wire.access_token,
    refreshToken: wire.refresh_token,
    tokenType: wire.token_type,
    expiresIn: wire.expires_in,
    email: wire.email,
    isSuperuser: wire.is_superuser,
  };
}

export function createAuthClient(transport: ApiTransport): AuthClient {
  return {
    async login(input: LoginInput): Promise<AuthSession> {
      const { data } = await transport.execute<TokenResponseWire>({
        method: 'POST',
        path: '/v1/auth/login',
        body: { email: input.email, password: input.password },
      });
      return toSession(data);
    },
    async register(input: LoginInput): Promise<AuthSession> {
      const { data } = await transport.execute<TokenResponseWire>({
        method: 'POST',
        path: '/v1/auth/register',
        body: { email: input.email, password: input.password },
      });
      return toSession(data);
    },
    async oauthProviders(): Promise<string[]> {
      const { data } = await transport.execute<{ providers: string[] }>({
        method: 'GET',
        path: '/oauth/providers',
      });
      return data.providers ?? [];
    },
    async oauthLoginUrl(provider: string, redirectUri: string): Promise<string> {
      const { data } = await transport.execute<{ authorize_url: string }>({
        method: 'GET',
        path: `/oauth/${encodeURIComponent(provider)}/login?redirect_uri=${encodeURIComponent(
          redirectUri
        )}`,
      });
      return data.authorize_url;
    },
    async oauthCallback(provider: string, code: string, state: string): Promise<AuthSession> {
      const { data } = await transport.execute<TokenResponseWire>({
        method: 'GET',
        path: `/oauth/${encodeURIComponent(provider)}/callback?code=${encodeURIComponent(
          code
        )}&state=${encodeURIComponent(state)}`,
      });
      return toSession(data);
    },
    async oauthConnectBegin(
      provider: string,
      redirectUri: string,
      scopes?: readonly string[]
    ): Promise<string> {
      const { data } = await transport.execute<{ authorize_url: string }>({
        method: 'POST',
        path: `/oauth/${encodeURIComponent(provider)}/connect`,
        body: { redirect_uri: redirectUri, scopes: scopes ?? [] },
      });
      return data.authorize_url;
    },
    async oauthConnectComplete(
      provider: string,
      code: string,
      state: string
    ): Promise<{ provider: string; credentialId: string }> {
      const { data } = await transport.execute<{ provider: string; credential_id: string }>({
        method: 'POST',
        path: `/oauth/${encodeURIComponent(provider)}/connect/complete`,
        body: { code, state },
      });
      return { provider: data.provider, credentialId: data.credential_id };
    },
    async me(): Promise<AuthPrincipal> {
      const { data } = await transport.execute<MeResponseWire>({
        method: 'GET',
        path: '/v1/auth/me',
      });
      return {
        id: data.id,
        principalType: data.principal_type,
        organisationId: data.organisation_id,
        email: data.email,
      };
    },
    async refresh(refreshToken: string): Promise<AuthSession> {
      const { data } = await transport.execute<TokenResponseWire>({
        method: 'POST',
        path: '/v1/auth/refresh',
        body: { refresh_token: refreshToken },
      });
      return toSession(data);
    },
    async switchOrg(organisationId: string): Promise<AuthSession> {
      // The target org rides the X-Organisation-Id header (never the body); the gateway/auth-service
      // validates it against the caller's membership and re-issues a session scoped to it.
      const { data } = await transport.execute<TokenResponseWire>({
        method: 'POST',
        path: '/v1/auth/switch-org',
        headers: { 'X-Organisation-Id': organisationId },
      });
      return toSession(data);
    },
    async changePassword(newPassword: string): Promise<void> {
      await transport.execute<void>({
        method: 'POST',
        path: '/v1/auth/change-password',
        body: { new_password: newPassword },
      });
    },
  };
}
