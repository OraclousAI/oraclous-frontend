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
  // GET /v1/auth/me — the authenticated principal (requires a bearer token).
  me(): Promise<AuthPrincipal>;
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
  };
}
