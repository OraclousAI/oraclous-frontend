// The single transport seam for all gateway calls.
// Concrete implementations (fetch-based or mock) are injected at createApiClient() time.
// Auth and base URL are transport-constructor concerns, not factory concerns.

export interface TransportRequest {
  readonly method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  readonly path: string;
  readonly body?: unknown;
  readonly signal?: AbortSignal;
  // Extra request headers (e.g. X-Organisation-Id for active-org switch). Merged after the managed
  // Accept/Authorization/Content-Type headers.
  readonly headers?: Readonly<Record<string, string>>;
}

export interface TransportResponse<T> {
  readonly data: T;
  readonly status: number;
}

// Implementations MUST throw ApiClientError on 4xx/5xx using the ORA-56 envelope.
export interface ApiTransport {
  execute<T>(request: TransportRequest): Promise<TransportResponse<T>>;
}
