// The real gateway transport. This is the ONLY place a bare fetch is allowed
// (Gate 1: api-client-boundary). Base URL + auth-token injection are constructor
// concerns; every 4xx/5xx is surfaced as an ApiClientError carrying the ORA-56/ORA-37
// envelope, and network/parse failures are synthesised into a conformant envelope so
// callers always branch on `code`, never on transport internals.

import { ApiClientError, ErrorCode, type ApiErrorEnvelope } from './errors';
import type { ApiTransport, TransportRequest, TransportResponse } from './transport';

export interface FetchTransportOptions {
  // Gateway origin, e.g. http://localhost:8006 (no trailing slash required).
  readonly baseUrl: string;
  // Returns the current bearer token, or null when unauthenticated (e.g. the login call).
  readonly getToken?: () => string | null;
  // Injectable for tests; defaults to the global fetch.
  readonly fetchImpl?: typeof fetch;
}

function synthetic(code: ErrorCode, message: string, retryable: boolean): ApiErrorEnvelope {
  return { error: { code, message, requestId: 'req_clientsynthetic', retryable } };
}

function isEnvelope(value: unknown): value is ApiErrorEnvelope {
  if (typeof value !== 'object' || value === null || !('error' in value)) return false;
  const err = (value as { error: unknown }).error;
  return (
    typeof err === 'object' &&
    err !== null &&
    typeof (err as { code?: unknown }).code === 'string' &&
    typeof (err as { message?: unknown }).message === 'string'
  );
}

async function envelopeFrom(response: Response): Promise<ApiErrorEnvelope> {
  try {
    const body: unknown = await response.json();
    if (isEnvelope(body)) return body;
  } catch {
    // fall through to a synthesised envelope
  }
  return synthetic(ErrorCode.INTERNAL_ERROR, 'An unexpected error occurred.', false);
}

export function createFetchTransport(options: FetchTransportOptions): ApiTransport {
  const root = options.baseUrl.replace(/\/+$/, '');
  const fetchImpl = options.fetchImpl ?? fetch;

  return {
    async execute<T>(request: TransportRequest): Promise<TransportResponse<T>> {
      const headers: Record<string, string> = { Accept: 'application/json' };
      const token = options.getToken?.() ?? null;
      if (token !== null && token !== '') headers['Authorization'] = `Bearer ${token}`;
      const hasBody = request.body !== undefined && request.method !== 'GET';
      // Multipart (file upload): pass the FormData through untouched — the browser sets
      // Content-Type with the correct boundary, so we must NOT set it or JSON-stringify.
      const isMultipart =
        hasBody && typeof FormData !== 'undefined' && request.body instanceof FormData;
      if (hasBody && !isMultipart) headers['Content-Type'] = 'application/json';

      let response: Response;
      try {
        response = await fetchImpl(root + request.path, {
          method: request.method,
          headers,
          ...(hasBody
            ? { body: isMultipart ? (request.body as FormData) : JSON.stringify(request.body) }
            : {}),
          ...(request.signal ? { signal: request.signal } : {}),
        });
      } catch {
        throw new ApiClientError(
          synthetic(ErrorCode.SERVICE_UNAVAILABLE, 'Unable to reach the server.', true),
          0
        );
      }

      if (!response.ok) {
        throw new ApiClientError(await envelopeFrom(response), response.status);
      }

      const data =
        response.status === 204 ? (undefined as unknown as T) : ((await response.json()) as T);
      return { data, status: response.status };
    },
  };
}
