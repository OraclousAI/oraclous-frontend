// Auth domain types (camelCase). The gateway/auth-service wire shape is snake_case
// (access_token, expires_in, …) and is mapped in auth.ts; consumers only see these.

export interface LoginInput {
  readonly email: string;
  readonly password: string;
}

export interface AuthSession {
  readonly accessToken: string;
  readonly refreshToken: string;
  readonly tokenType: string;
  // Seconds until the access token expires.
  readonly expiresIn: number;
  readonly email: string;
  readonly isSuperuser: boolean;
}

export interface AuthPrincipal {
  readonly id: string;
  readonly principalType: string;
  readonly organisationId: string;
  readonly email: string | null;
}
