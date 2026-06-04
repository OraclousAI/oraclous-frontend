// The single transport seam for all gateway calls.
// Concrete implementations (fetch-based or mock) are injected at createApiClient() time.
// Token storage is NEVER done here; callers provide a getToken callback.

import type { ApiClientError } from './errors';

export interface TransportRequest {
  readonly method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  readonly path: string;
  readonly body?: unknown;
  readonly signal?: AbortSignal;
}

export interface TransportResponse<T> {
  readonly data: T;
  readonly status: number;
}

// Implementations MUST throw ApiClientError on 4xx/5xx using the ORA-56 envelope.
export interface ApiTransport {
  execute<T>(request: TransportRequest): Promise<TransportResponse<T>>;
}

export type { ApiClientError };
